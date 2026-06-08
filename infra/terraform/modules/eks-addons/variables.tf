variable "cluster_name" {
  description = "EKS cluster name (passed to the ALB controller chart)."
  type        = string
}

variable "region" {
  description = "AWS region (ALB controller chart)."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID (ALB controller chart)."
  type        = string
}

variable "alb_controller_role_arn" {
  description = "IRSA role ARN for the ALB controller ServiceAccount."
  type        = string
}

variable "external_secrets_role_arn" {
  description = "IRSA role ARN for the External Secrets Operator ServiceAccount."
  type        = string
}

variable "enable_alb_controller" {
  description = "Install the AWS Load Balancer Controller."
  type        = bool
  default     = true
}

variable "enable_external_secrets" {
  description = "Install the External Secrets Operator."
  type        = bool
  default     = true
}

variable "alb_controller_chart_version" {
  description = "aws-load-balancer-controller Helm chart version."
  type        = string
  default     = "1.8.1"
}

variable "external_secrets_chart_version" {
  description = "external-secrets Helm chart version."
  type        = string
  default     = "0.9.19"
}
