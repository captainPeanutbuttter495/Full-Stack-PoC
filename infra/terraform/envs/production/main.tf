# Production composition. Phases 2–4 wire ECR, the network, the EKS cluster, and
# IRSA roles. Still to come (deferred to post-checkpoint phases): EKS add-on Helm
# installs (ALB controller, External Secrets Operator), DNS/TLS (Route 53 + ACM),
# Secrets Manager secrets, and the S3 + CloudFront downloads stack.
# Guard against an unreachable-node configuration. Private nodes (worker_nodes_public
# = false) with no NAT (enable_nat_gateway = false) have no route to the internet or
# ECR, so the cluster can't pull images. Require either public nodes (demo) or NAT
# (production-like). Evaluated at `terraform plan`.
resource "terraform_data" "node_networking_guard" {
  lifecycle {
    precondition {
      condition     = var.worker_nodes_public || var.enable_nat_gateway
      error_message = "Invalid networking combo: worker_nodes_public = false with enable_nat_gateway = false leaves nodes in private subnets with no internet/ECR egress. Set worker_nodes_public = true (demo) OR enable_nat_gateway = true (production-like)."
    }
  }
}

module "ecr" {
  source          = "../../modules/ecr"
  repository_name = var.ecr_repository_name
  force_delete    = var.ecr_force_delete # true only for easy demo teardown
  tags            = var.tags
}

module "network" {
  source = "../../modules/network"

  name            = var.cluster_name
  cidr            = var.vpc_cidr
  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway         = var.enable_nat_gateway
  single_nat_gateway         = var.single_nat_gateway
  enable_s3_gateway_endpoint = var.enable_s3_gateway_endpoint
  # Demo public-subnet nodes need public IPs; production private nodes do not.
  map_public_ip_on_launch = var.worker_nodes_public

  tags = var.tags
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id = module.network.vpc_id
  # Demo mode runs nodes in public subnets (no NAT); production keeps them private.
  node_subnet_ids = var.worker_nodes_public ? module.network.public_subnet_ids : module.network.private_subnet_ids

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

# Helm-installed add-ons. Gated by install_eks_addons so the very first apply can
# create the cluster before the helm/kubernetes providers need to reach it.
module "eks_addons" {
  source = "../../modules/eks-addons"
  count  = var.install_eks_addons ? 1 : 0

  cluster_name = var.cluster_name
  region       = var.region
  vpc_id       = module.network.vpc_id

  alb_controller_role_arn   = module.irsa.alb_controller_role_arn
  external_secrets_role_arn = module.irsa.external_secrets_role_arn

  depends_on = [module.eks]
}
