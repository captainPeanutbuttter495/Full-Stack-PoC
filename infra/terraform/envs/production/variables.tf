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

variable "ecr_force_delete" {
  description = "Allow destroying the ECR repo with images still in it. DEMO-ONLY — keep false for production."
  type        = bool
  default     = false
}

# --- Network ----------------------------------------------------------------
variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones."
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "private_subnets" {
  description = "Private subnet CIDRs (EKS nodes)."
  type        = list(string)
  default     = ["10.0.0.0/20", "10.0.16.0/20", "10.0.32.0/20"]
}

variable "public_subnets" {
  description = "Public subnet CIDRs (internet-facing ALB)."
  type        = list(string)
  default     = ["10.0.48.0/20", "10.0.64.0/20", "10.0.80.0/20"]
}

variable "enable_nat_gateway" {
  description = "Create NAT gateway(s). Set false for demo mode (public nodes, no NAT cost)."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "One NAT gateway (cheaper) vs one per AZ. Ignored when enable_nat_gateway = false."
  type        = bool
  default     = true
}

variable "enable_s3_gateway_endpoint" {
  description = "Create the free S3 gateway VPC endpoint (recommended both modes)."
  type        = bool
  default     = true
}

variable "worker_nodes_public" {
  description = "Place nodes in PUBLIC subnets (demo, no NAT). Keep false for production (private nodes)."
  type        = bool
  default     = false
}

# --- EKS cluster + node group -----------------------------------------------
variable "cluster_name" {
  description = "EKS cluster name (also the network/IRSA name prefix)."
  type        = string
  default     = "pwyw"
}

variable "cluster_version" {
  description = "Kubernetes control-plane version."
  type        = string
  default     = "1.30"
}

variable "node_instance_types" {
  description = "Managed node group instance types."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_capacity_type" {
  description = "ON_DEMAND or SPOT."
  type        = string
  default     = "ON_DEMAND"
}

variable "node_min_size" {
  description = "Minimum nodes."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum nodes."
  type        = number
  default     = 4
}

variable "node_desired_size" {
  description = "Desired nodes."
  type        = number
  default     = 2
}

variable "eks_access_entries" {
  description = "EKS access entries (e.g. grant the CI deploy role kubectl access)."
  type        = any
  default     = {}
}

variable "install_eks_addons" {
  description = "Install Helm add-ons (ALB controller, ESO). Set false for the first cluster-only apply, then true."
  type        = bool
  default     = true
}

# --- DNS / TLS (Route 53 + ACM) — placeholders until you set real values --------
variable "enable_dns_tls" {
  description = "Manage Route 53 + ACM for the app host."
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Registered domain (placeholder: example.com)."
  type        = string
  default     = "example.com"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID. Required to apply DNS/TLS."
  type        = string
  default     = ""
}

variable "app_hostname" {
  description = "Public hostname for the app (placeholder: pwyw.example.com)."
  type        = string
  default     = "pwyw.example.com"
}

variable "acm_certificate_arn" {
  description = "Existing ACM cert ARN to reuse. Leave empty to issue a new one."
  type        = string
  default     = ""
}

variable "create_acm_certificate" {
  description = "Issue a DNS-validated ACM cert (true) or reuse acm_certificate_arn (false)."
  type        = bool
  default     = true
}

# --- IRSA fallbacks (used only when the modules below are disabled) ----------
variable "secrets_manager_arns" {
  description = "Secrets Manager ARNs the ESO may read (fallback when enable_secrets = false)."
  type        = list(string)
  default     = ["*"]
}

variable "documents_bucket_object_arns" {
  description = "S3 object ARNs the app may GetObject (fallback when enable_storage_cdn = false)."
  type        = list(string)
  default     = ["*"]
}

# --- Secrets Manager + ESO ---------------------------------------------------
variable "enable_secrets" {
  description = "Create the Secrets Manager container for the app secrets."
  type        = bool
  default     = true
}

variable "secrets_prefix" {
  description = "Secret name prefix/path."
  type        = string
  default     = "pwyw"
}

# --- S3 + CloudFront protected downloads -------------------------------------
variable "enable_storage_cdn" {
  description = "Create the private S3 documents bucket + CloudFront distribution."
  type        = bool
  default     = true
}

variable "documents_bucket_name" {
  description = "Globally-unique S3 bucket name for documents (replace the placeholder)."
  type        = string
  default     = "pwyw-documents-REPLACE-ME"
}

variable "documents_force_destroy" {
  description = "Empty + delete the bucket on destroy. DEMO-ONLY — keep false for production."
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_100 cheapest)."
  type        = string
  default     = "PriceClass_100"
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
