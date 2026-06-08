output "vpc_id" {
  description = "VPC ID."
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs — EKS node group subnets."
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "Public subnet IDs — internet-facing ALB (and demo-mode nodes)."
  value       = module.vpc.public_subnets
}

output "s3_gateway_endpoint_id" {
  description = "S3 gateway VPC endpoint ID (null when disabled)."
  value       = try(aws_vpc_endpoint.s3[0].id, null)
}
