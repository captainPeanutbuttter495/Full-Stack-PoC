output "ecr_repository_url" {
  description = "Push target and the value for k8s/deployment.yaml image."
  value       = module.ecr.repository_url
}

output "ecr_repository_arn" {
  description = "ECR ARN — narrow the CI deploy role's push permissions to this."
  value       = module.ecr.repository_arn
}

# --- EKS --------------------------------------------------------------------
output "cluster_name" {
  description = "EKS cluster name for `aws eks update-kubeconfig --name`."
  value       = module.eks.cluster_name
}

output "cluster_arn" {
  description = "Cluster ARN — narrow the CI role's eks:DescribeCluster to this."
  value       = module.eks.cluster_arn
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint."
  value       = module.eks.cluster_endpoint
}

# --- IRSA role ARNs (consumed by the later add-ons/app ServiceAccounts) ------
output "alb_controller_role_arn" {
  description = "IRSA role ARN for the AWS Load Balancer Controller."
  value       = module.irsa.alb_controller_role_arn
}

output "external_secrets_role_arn" {
  description = "IRSA role ARN for the External Secrets Operator."
  value       = module.irsa.external_secrets_role_arn
}

output "app_role_arn" {
  description = "IRSA role ARN for the app ServiceAccount (pwyw:pwyw-web)."
  value       = module.irsa.app_role_arn
}
