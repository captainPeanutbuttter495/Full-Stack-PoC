output "repository_url" {
  description = "Registry URL to tag/push images to (use in k8s/deployment.yaml image)."
  value       = aws_ecr_repository.this.repository_url
}

output "repository_arn" {
  description = "Repository ARN — narrow the CI role's ECR permissions to this."
  value       = aws_ecr_repository.this.arn
}

output "repository_name" {
  description = "Repository name."
  value       = aws_ecr_repository.this.name
}
