variable "repository_name" {
  description = "ECR repository name (matches the image referenced by k8s/deployment.yaml)."
  type        = string
  default     = "pwyw-web"
}

variable "image_tag_mutability" {
  description = "MUTABLE (allows the moving production-main tag) or IMMUTABLE."
  type        = string
  default     = "MUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be MUTABLE or IMMUTABLE."
  }
}

variable "force_delete" {
  description = "Allow destroying the repo while it still holds images (PoC convenience)."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to the repository."
  type        = map(string)
  default     = {}
}
