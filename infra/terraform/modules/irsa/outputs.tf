output "alb_controller_role_arn" {
  description = "IRSA role ARN for the AWS Load Balancer Controller ServiceAccount."
  value       = module.alb_controller_irsa.iam_role_arn
}

output "external_secrets_role_arn" {
  description = "IRSA role ARN for the External Secrets Operator ServiceAccount."
  value       = module.external_secrets_irsa.iam_role_arn
}

output "app_role_arn" {
  description = "IRSA role ARN for the app ServiceAccount (pwyw:pwyw-web)."
  value       = module.app_irsa.iam_role_arn
}
