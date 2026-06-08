# AWS Secrets Manager container for the app's server-only runtime secrets
# (Supabase service key, DB URLs, Stripe keys). External Secrets Operator syncs it
# into the K8s `app-secrets` Secret the Deployment reads via envFrom.
#
# ⚠️ Terraform manages only the secret CONTAINER, never the VALUE — no secret
# material is committed or written to Terraform state. Populate the value
# out-of-band after apply, e.g.:
#   aws secretsmanager put-secret-value --secret-id pwyw/app-secrets \
#     --secret-string '{"DATABASE_URL":"...","STRIPE_SECRET_KEY":"..."}'
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_secretsmanager_secret" "app" {
  name        = "${var.prefix}/app-secrets"
  description = "PWYW app server-only secrets (value set out-of-band, not by Terraform)."
  tags        = var.tags
}
