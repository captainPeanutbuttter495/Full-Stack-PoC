terraform {
  # Partial backend config. Supply `bucket`, `dynamodb_table`, and `region` at
  # init time (from the bootstrap/state-backend outputs) via a backend.hcl file:
  #   terraform init -backend-config=backend.hcl
  backend "s3" {
    key     = "production/terraform.tfstate"
    encrypt = true
  }
}
