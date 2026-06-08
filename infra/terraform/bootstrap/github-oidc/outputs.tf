output "ci_deploy_role_arn" {
  description = "Role ARN for the GitHub Actions `role-to-assume` (deploy job)."
  value       = aws_iam_role.ci_deploy.arn
}

output "oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC identity provider."
  value       = aws_iam_openid_connect_provider.github.arn
}
