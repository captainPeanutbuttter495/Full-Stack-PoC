# Private container registry for the app image the Dockerfile produces.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_ecr_repository" "this" {
  name = var.repository_name

  # MUTABLE so the convenience `production-main` tag can move while immutable
  # `sha-<commit>` tags remain the real, traceable deploy pins. Each SHA tag is
  # unique in practice, so this does not weaken rollout traceability.
  image_tag_mutability = var.image_tag_mutability

  # Reject pushes that fail a scan-on-push vulnerability check surfacing.
  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  # PoC convenience: allow `terraform destroy` to remove a repo that still holds
  # images. Set false for a real production registry.
  force_delete = var.force_delete

  tags = var.tags
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep the most recent 30 deploy-tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["production-main", "sha-"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = { type = "expire" }
      },
    ]
  })
}
