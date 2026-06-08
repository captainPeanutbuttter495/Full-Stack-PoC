variable "bucket_name" {
  description = "Globally-unique S3 bucket name for private documents."
  type        = string
}

variable "force_destroy" {
  description = "Allow destroying a non-empty bucket. DEMO-ONLY — keep false for production."
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_100 is cheapest)."
  type        = string
  default     = "PriceClass_100"
}

variable "enable_signed_urls" {
  description = "Enforce CloudFront signed URLs via a trusted key group (needs signing_public_key_pem)."
  type        = bool
  default     = false
}

variable "signing_public_key_pem" {
  description = "PUBLIC key PEM for CloudFront signed URLs. Private key stays with the app — never commit it."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to the bucket/distribution."
  type        = map(string)
  default     = {}
}
