variable "cluster_name" {
  description = "Cluster name, used as the role-name prefix."
  type        = string
}

variable "oidc_provider_arn" {
  description = "EKS IRSA OIDC provider ARN (from modules/eks)."
  type        = string
}

variable "secrets_manager_arns" {
  description = <<-EOT
    Secrets Manager ARNs the External Secrets Operator may read. Defaults to "*"
    until the secrets phase creates them; narrow to the real ARNs then.
  EOT
  type        = list(string)
  default     = ["*"]
}

variable "documents_bucket_object_arns" {
  description = <<-EOT
    Object ARNs (e.g. arn:aws:s3:::bucket/*) the app may GetObject for signed
    downloads. Defaults to "*" until the storage phase creates the bucket.
  EOT
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  description = "Tags applied to the IRSA roles/policies."
  type        = map(string)
  default     = {}
}
