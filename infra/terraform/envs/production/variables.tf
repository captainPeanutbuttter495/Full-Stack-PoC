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

# --- IRSA placeholders (narrowed once secrets/storage phases exist) ----------
variable "secrets_manager_arns" {
  description = "Secrets Manager ARNs the External Secrets Operator may read."
  type        = list(string)
  default     = ["*"]
}

variable "documents_bucket_object_arns" {
  description = "S3 object ARNs the app may GetObject for signed downloads."
  type        = list(string)
  default     = ["*"]
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
