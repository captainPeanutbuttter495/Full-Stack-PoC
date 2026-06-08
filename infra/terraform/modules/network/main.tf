# VPC for the EKS cluster, built on the well-maintained community VPC module.
# Public subnets host the internet-facing ALB; private subnets host the nodes.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_region" "current" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name = var.name
  cidr = var.cidr

  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  # enable_nat_gateway is configurable: production-like keeps NAT on (private
  # nodes); demo mode turns it OFF and runs nodes in public subnets to avoid the
  # ~$7.56/week NAT cost. single_nat_gateway is ignored when NAT is disabled.
  enable_nat_gateway   = var.enable_nat_gateway
  single_nat_gateway   = var.single_nat_gateway
  enable_dns_hostnames = true

  # Give public-subnet instances a public IP so demo nodes can reach the internet
  # / ECR via the (free) Internet Gateway without NAT. Leave false for production.
  map_public_ip_on_launch = var.map_public_ip_on_launch

  # Subnet tags let the AWS Load Balancer Controller auto-discover where to place
  # internet-facing vs internal load balancers.
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = var.tags
}

# S3 gateway endpoint: free, keeps S3 traffic (document downloads, image layers
# via S3-backed services) on the AWS network instead of routing out through NAT.
# Beneficial in both modes; on by default. Attaches to all route tables so both
# public and private subnets use it.
resource "aws_vpc_endpoint" "s3" {
  count = var.enable_s3_gateway_endpoint ? 1 : 0

  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.public_route_table_ids)

  tags = merge(var.tags, { Name = "${var.name}-s3-gateway" })
}
