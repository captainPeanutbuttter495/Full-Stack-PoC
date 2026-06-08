output "secret_arn" {
  description = "ARN of the app secret — narrow the ESO IRSA role to this."
  value       = aws_secretsmanager_secret.app.arn
}

output "secret_name" {
  description = "Secret name/path — referenced by the ExternalSecret `key`."
  value       = aws_secretsmanager_secret.app.name
}
