variable "region" {
  description = "AWS region (IAM is global, but the provider needs a region)."
  type        = string
  default     = "us-west-2"
}

variable "role_name" {
  description = "Name of the IAM role GitHub Actions assumes via OIDC."
  type        = string
  default     = "pwyw-github-actions-deploy"
}

variable "allowed_subjects" {
  description = <<-EOT
    GitHub OIDC `sub` claims allowed to assume the role. Scoped to the
    production integration branch by default — deploys originate only from
    pushes to production-main.
  EOT
  type        = list(string)
  default = [
    "repo:captainPeanutbuttter495/Full-Stack-PoC:ref:refs/heads/production-main",
  ]
}

variable "ecr_repository_arns" {
  description = <<-EOT
    ECR repository ARNs the CI role may push to. Defaults to "*" until the ECR
    repo exists; narrow to the modules/ecr output ARN once applied.
  EOT
  type        = list(string)
  default     = ["*"]
}

variable "eks_cluster_arns" {
  description = <<-EOT
    EKS cluster ARNs the CI role may describe. Defaults to "*" until the cluster
    exists; narrow to the cluster ARN once the EKS phase is applied.
  EOT
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  description = "Tags applied to the OIDC provider and role."
  type        = map(string)
  default = {
    Project   = "pwyw"
    ManagedBy = "terraform"
    Stack     = "bootstrap-github-oidc"
  }
}
