# Production composition. Phase 2 wires only ECR. Later stacked phases add the
# network, EKS cluster, EKS add-ons (ALB controller, External Secrets Operator,
# CloudWatch), IRSA roles, DNS/TLS, secrets, and S3+CloudFront modules.
module "ecr" {
  source          = "../../modules/ecr"
  repository_name = var.ecr_repository_name
  tags            = var.tags
}
