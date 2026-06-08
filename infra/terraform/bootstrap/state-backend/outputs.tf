output "state_bucket_name" {
  description = "S3 bucket holding remote state — use as the backend `bucket`."
  value       = aws_s3_bucket.tf_state.id
}

output "lock_table_name" {
  description = "DynamoDB table for state locking — use as the backend `dynamodb_table`."
  value       = aws_dynamodb_table.tf_lock.name
}

output "backend_config_hint" {
  description = "Partial backend config for the env stacks' `terraform init`."
  value = {
    bucket         = aws_s3_bucket.tf_state.id
    dynamodb_table = aws_dynamodb_table.tf_lock.name
    region         = var.region
    encrypt        = true
  }
}
