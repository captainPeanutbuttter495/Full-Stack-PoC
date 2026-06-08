output "ecr_repository_url" {
  description = "Push target and the value for k8s/deployment.yaml image."
  value       = module.ecr.repository_url
}

output "ecr_repository_arn" {
  description = "ECR ARN — narrow the CI deploy role's push permissions to this."
  value       = module.ecr.repository_arn
}
