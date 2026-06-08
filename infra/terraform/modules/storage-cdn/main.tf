# Private S3 documents bucket + CloudFront (Origin Access Control) for protected
# downloads. The bucket blocks all public access; only this CloudFront distribution
# can read it. The app grants access by issuing time-limited signed URLs AFTER a
# confirmed payment (CloudFront signed URLs via a key group, or S3 presigned URLs
# using the app's IRSA role).
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_s3_bucket" "documents" {
  bucket = var.bucket_name
  # DEMO-ONLY when true: lets `terraform destroy` empty + delete the bucket.
  force_destroy = var.force_destroy
  tags          = var.tags
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "documents" {
  name                              = "${var.bucket_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

# Optional CloudFront signed-URL key group. Provide a PUBLIC key PEM to enable
# trusted-key-group enforcement; the matching PRIVATE key lives with the app and is
# NEVER committed. When disabled, protect downloads with S3 presigned URLs instead
# (the app's IRSA role already grants s3:GetObject).
resource "aws_cloudfront_public_key" "this" {
  count       = var.enable_signed_urls ? 1 : 0
  name        = "${var.bucket_name}-signing-key"
  encoded_key = var.signing_public_key_pem
}

resource "aws_cloudfront_key_group" "this" {
  count = var.enable_signed_urls ? 1 : 0
  name  = "${var.bucket_name}-key-group"
  items = [aws_cloudfront_public_key.this[0].id]
}

resource "aws_cloudfront_distribution" "documents" {
  enabled = true
  comment = "PWYW protected document downloads"

  origin {
    domain_name              = aws_s3_bucket.documents.bucket_regional_domain_name
    origin_id                = "s3-documents"
    origin_access_control_id = aws_cloudfront_origin_access_control.documents.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-documents"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    trusted_key_groups     = var.enable_signed_urls ? [aws_cloudfront_key_group.this[0].id] : []
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Default *.cloudfront.net cert keeps the demo simple. A custom CDN domain needs
  # an ACM cert in us-east-1 — documented as a follow-up.
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = var.price_class
  tags        = var.tags
}

# Bucket policy: allow ONLY this distribution (via OAC) to read objects.
data "aws_iam_policy_document" "bucket" {
  statement {
    sid       = "AllowCloudFrontOAC"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.documents.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.documents.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id
  policy = data.aws_iam_policy_document.bucket.json
}
