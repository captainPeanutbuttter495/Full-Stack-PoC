# Route 53 + ACM for the app's public HTTPS host. Works two ways:
#   - create_certificate = true  → issue a DNS-validated ACM cert in the zone
#   - create_certificate = false → reuse an existing cert via var.certificate_arn
# All inputs (domain, zone id, hostname, ARN) are placeholders here — fill the real
# values in terraform.tfvars before apply. No real domain/ARN/account ID committed.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  certificate_arn = var.create_certificate ? aws_acm_certificate_validation.this[0].certificate_arn : var.certificate_arn
}

resource "aws_acm_certificate" "this" {
  count             = var.create_certificate ? 1 : 0
  domain_name       = var.app_hostname
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.create_certificate ? {
    for dvo in aws_acm_certificate.this[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "this" {
  count                   = var.create_certificate ? 1 : 0
  certificate_arn         = aws_acm_certificate.this[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# Optional alias: app_hostname -> ALB. The ALB is created by the Load Balancer
# Controller (not Terraform), so its DNS name/zone are inputs filled after the
# Ingress provisions the ALB. Off by default; external-dns is the automated
# alternative (it manages this record from the Ingress host annotation).
resource "aws_route53_record" "app_alias" {
  count   = var.create_alias_record ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.app_hostname
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
