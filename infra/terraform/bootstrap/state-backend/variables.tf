variable "region" {
  description = "AWS region for the state bucket and lock table."
  type        = string
  default     = "us-west-2"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  type        = string
  default     = "pwyw-terraform-locks"
}

variable "tags" {
  description = "Tags applied to the state backend resources."
  type        = map(string)
  default = {
    Project   = "pwyw"
    ManagedBy = "terraform"
    Stack     = "bootstrap-state-backend"
  }
}
