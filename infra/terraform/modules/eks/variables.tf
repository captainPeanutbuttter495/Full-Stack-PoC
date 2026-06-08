variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
  default     = "pwyw"
}

variable "cluster_version" {
  description = "Kubernetes control-plane version."
  type        = string
  default     = "1.30"
}

variable "vpc_id" {
  description = "VPC the cluster runs in."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for the managed node group."
  type        = list(string)
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed node group."
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
  description = "Desired nodes (>=2 for availability + rolling updates)."
  type        = number
  default     = 2
}

variable "access_entries" {
  description = <<-EOT
    EKS access entries granting kubectl access to extra principals (e.g. the CI
    deploy role ARN). Empty by default; the apply principal is admin via
    enable_cluster_creator_admin_permissions.
  EOT
  type        = any
  default     = {}
}

variable "tags" {
  description = "Tags applied to the cluster."
  type        = map(string)
  default     = {}
}
