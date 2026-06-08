variable "domain_name" {
  description = "Apex/registered domain (e.g. example.com). Placeholder until you set the real one."
  type        = string
  default     = "example.com"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for the domain (e.g. Z0123...). Required to apply."
  type        = string
  default     = ""
}

variable "app_hostname" {
  description = "Public hostname for the app (e.g. pwyw.example.com)."
  type        = string
  default     = "pwyw.example.com"
}

variable "certificate_arn" {
  description = "Existing ACM cert ARN to reuse when create_certificate = false. Leave empty to create one."
  type        = string
  default     = ""
}

variable "create_certificate" {
  description = "Issue a DNS-validated ACM cert (true) or reuse certificate_arn (false)."
  type        = bool
  default     = true
}

variable "create_alias_record" {
  description = "Create the app_hostname -> ALB alias record. Off by default (use external-dns, or fill after the ALB exists)."
  type        = bool
  default     = false
}

variable "alb_dns_name" {
  description = "ALB DNS name for the alias record (filled post-Ingress; only used when create_alias_record = true)."
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "ALB hosted zone ID for the alias record (only used when create_alias_record = true)."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to created DNS/ACM resources."
  type        = map(string)
  default     = {}
}
