variable "name" {
  description = "Name prefix for the VPC and its subnets."
  type        = string
}

variable "cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones to spread subnets across."
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "private_subnets" {
  description = "Private subnet CIDRs (one per AZ) — EKS nodes live here."
  type        = list(string)
  default     = ["10.0.0.0/20", "10.0.16.0/20", "10.0.32.0/20"]
}

variable "public_subnets" {
  description = "Public subnet CIDRs (one per AZ) — internet-facing ALB lives here."
  type        = list(string)
  default     = ["10.0.48.0/20", "10.0.64.0/20", "10.0.80.0/20"]
}

variable "single_nat_gateway" {
  description = "Use one NAT gateway (cheaper) vs one per AZ (more available)."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to network resources."
  type        = map(string)
  default     = {}
}
