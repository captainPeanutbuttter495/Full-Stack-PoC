output "certificate_arn" {
  description = "ACM cert ARN (created or reused) — set on the ALB Ingress annotation."
  value       = local.certificate_arn
}

output "app_hostname" {
  description = "Public hostname for the app — set as the Ingress rule host."
  value       = var.app_hostname
}
