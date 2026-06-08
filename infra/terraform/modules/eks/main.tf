# EKS cluster on the community EKS module. Scoped to the cluster itself: a managed
# node group, EKS-managed add-ons, IRSA enablement, and access entries. The
# helm-based ALB Controller and External Secrets Operator installs are a SEPARATE
# (later) phase, because they need kubernetes/helm providers pointed at a cluster
# that must already exist — applying them in the same run is the classic
# chicken-and-egg failure. Their IAM/IRSA roles live in modules/irsa.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Public endpoint so CI (`aws eks update-kubeconfig`) and operators can reach
  # the API. Lock down with cluster_endpoint_public_access_cidrs in production.
  cluster_endpoint_public_access = true

  enable_irsa = true

  vpc_id = var.vpc_id
  # Subnets for the cluster ENIs and node group. Production-like passes private
  # subnets; demo mode passes public subnets (so nodes reach ECR via the IGW
  # without NAT). The env stack selects which based on var.worker_nodes_public.
  subnet_ids = var.node_subnet_ids

  # EKS-managed add-ons. amazon-cloudwatch-observability ships pod logs + metrics
  # to CloudWatch (Container Insights).
  cluster_addons = {
    coredns                           = {}
    kube-proxy                        = {}
    vpc-cni                           = {}
    amazon-cloudwatch-observability   = {}
  }

  eks_managed_node_groups = {
    default = {
      instance_types = var.node_instance_types
      capacity_type  = var.node_capacity_type
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_desired_size
    }
  }

  # The principal running `terraform apply` becomes a cluster admin; additional
  # principals (e.g. the CI deploy role) are granted via access_entries.
  enable_cluster_creator_admin_permissions = true
  access_entries                           = var.access_entries

  tags = var.tags
}
