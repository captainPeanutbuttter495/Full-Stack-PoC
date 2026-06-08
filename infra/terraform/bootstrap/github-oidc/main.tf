# GitHub Actions → AWS auth via OIDC. No long-lived AWS access keys: the workflow
# exchanges a short-lived GitHub OIDC token for STS credentials by assuming this
# role. Trust is scoped to specific repo refs (see var.allowed_subjects).
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Fetch GitHub's current OIDC signing cert so the thumbprint stays correct over
# rotations. (AWS no longer validates this thumbprint for the GitHub IdP, but the
# resource still requires a non-empty list.)
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]

  tags = var.tags
}

# Trust policy: only GitHub OIDC tokens whose `sub` matches an allowed ref may
# assume the role, and only for the `sts.amazonaws.com` audience.
data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.allowed_subjects
    }
  }
}

resource "aws_iam_role" "ci_deploy" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

# Least-privilege CI permissions: push images to ECR and describe the EKS cluster
# (enough for `aws eks update-kubeconfig`). Cluster RBAC for kubectl is granted
# separately via EKS access entries in the cluster phase.
data "aws_iam_policy_document" "ci_permissions" {
  statement {
    sid       = "EcrAuthToken"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    # Narrow to the ECR repo ARN once it exists (see modules/ecr output).
    resources = var.ecr_repository_arns
  }

  statement {
    sid       = "EksDescribe"
    effect    = "Allow"
    actions   = ["eks:DescribeCluster"]
    resources = var.eks_cluster_arns
  }
}

resource "aws_iam_role_policy" "ci_permissions" {
  name   = "${var.role_name}-permissions"
  role   = aws_iam_role.ci_deploy.id
  policy = data.aws_iam_policy_document.ci_permissions.json
}
