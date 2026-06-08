variable "prefix" {
  description = "Secret name prefix (path)."
  type        = string
  default     = "pwyw"
}

variable "tags" {
  description = "Tags applied to the secret."
  type        = map(string)
  default     = {}
}
