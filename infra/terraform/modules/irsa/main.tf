# IRSA (IAM Roles for Service Accounts): IAM roles that in-cluster ServiceAccounts
# assume via the cluster OIDC provider. IAM only — the matching Kubernetes
# ServiceAccounts/Helm installs are wired in the (later) add-ons phase.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# AWS Load Balancer Controller — provisions the ALB from the Ingress.
module "alb_controller_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name                              = "${var.cluster_name}-alb-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = var.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }

  tags = var.tags
}

# External Secrets Operator — reads runtime secrets from AWS Secrets Manager.
module "external_secrets_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name                             = "${var.cluster_name}-external-secrets"
  attach_external_secrets_policy        = true
  external_secrets_secrets_manager_arns = var.secrets_manager_arns

  oidc_providers = {
    main = {
      provider_arn               = var.oidc_provider_arn
      namespace_service_accounts = ["external-secrets:external-secrets"]
    }
  }

  tags = var.tags
}

# App pod role — lets the app generate signed download URLs by reading objects
# from the (later) private documents bucket. Scope resources to the real bucket
# ARNs once the storage phase creates them.
data "aws_iam_policy_document" "app_s3" {
  statement {
    sid       = "ReadDocuments"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = var.documents_bucket_object_arns
  }
}

resource "aws_iam_policy" "app_s3" {
  name   = "${var.cluster_name}-app-s3"
  policy = data.aws_iam_policy_document.app_s3.json
  tags   = var.tags
}

module "app_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name        = "${var.cluster_name}-app"
  role_policy_arns = { s3 = aws_iam_policy.app_s3.arn }

  oidc_providers = {
    main = {
      provider_arn               = var.oidc_provider_arn
      namespace_service_accounts = ["pwyw:pwyw-web"]
    }
  }

  tags = var.tags
}
