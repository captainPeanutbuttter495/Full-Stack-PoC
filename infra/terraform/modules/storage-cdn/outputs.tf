output "bucket_name" {
  description = "Documents bucket name."
  value       = aws_s3_bucket.documents.id
}

output "bucket_arn" {
  description = "Documents bucket ARN."
  value       = aws_s3_bucket.documents.arn
}

output "bucket_object_arns" {
  description = "Object ARN pattern — narrow the app IRSA role's s3:GetObject to this."
  value       = ["${aws_s3_bucket.documents.arn}/*"]
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain (the download host)."
  value       = aws_cloudfront_distribution.documents.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.documents.arn
}
