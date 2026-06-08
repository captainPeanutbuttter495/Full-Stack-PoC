# Production composition. Phases 2–4 wire ECR, the network, the EKS cluster, and
# IRSA roles. Still to come (deferred to post-checkpoint phases): EKS add-on Helm
# installs (ALB controller, External Secrets Operator), DNS/TLS (Route 53 + ACM),
# Secrets Manager secrets, and the S3 + CloudFront downloads stack.
module "ecr" {
  source          = "../../modules/ecr"
  repository_name = var.ecr_repository_name
  tags            = var.tags
}

module "network" {
  source = "../../modules/network"

  name               = var.cluster_name
  cidr               = var.vpc_cidr
  azs                = var.azs
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
  single_nat_gateway = var.single_nat_gateway
  tags               = var.tags
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids

  node_instance_types = var.node_instance_types
  node_capacity_type  = var.node_capacity_type
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_desired_size   = var.node_desired_size

  access_entries = var.eks_access_entries

  tags = var.tags
}

module "irsa" {
  source = "../../modules/irsa"

  cluster_name      = var.cluster_name
  oidc_provider_arn = module.eks.oidc_provider_arn

  # Placeholders until the secrets/storage phases create the real resources.
  secrets_manager_arns         = var.secrets_manager_arns
  documents_bucket_object_arns = var.documents_bucket_object_arns

  tags = var.tags
}
