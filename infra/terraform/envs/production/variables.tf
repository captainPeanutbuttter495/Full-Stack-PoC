variable "region" {
  description = "AWS region for the production stack."
  type        = string
  default     = "us-west-2"
}

variable "ecr_repository_name" {
  description = "ECR repository name for the app image."
  type        = string
  default     = "pwyw-web"
}

variable "tags" {
  description = "Default tags applied to all resources in this stack."
  type        = map(string)
  default = {
    Project     = "pwyw"
    ManagedBy   = "terraform"
    Environment = "production"
  }
}
