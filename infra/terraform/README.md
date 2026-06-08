# Terraform — AWS Infrastructure (`Future:` / unapplied)

> ⚠️ **Nothing here has been applied.** These are reviewable infrastructure
> definitions for the EKS production architecture in
> `Full-Stack-PoC-Documentation/Deployment/AWS.md`. No AWS resources exist yet.
> Apply only after the architecture is approved and real credentials/values are in
> place.

This tree is built up across stacked phases:

- **Phase 2** — foundation: remote state, the GitHub OIDC trust CI uses to
  authenticate to AWS, and the ECR repository.
- **Phase 4** — the network (VPC), the EKS cluster + managed node group +
  EKS-managed add-ons, and IRSA roles.
- **Deferred (post-checkpoint)** — Helm installs of the ALB Controller and External
  Secrets Operator, DNS/TLS (Route 53 + ACM), Secrets Manager secrets, and the
  S3 + CloudFront downloads stack. RDS stays a documented `Future:` option (the app
  keeps using Supabase).

## Layout

```
infra/terraform/
├── bootstrap/                 # run ONCE, before the env stacks
│   ├── state-backend/         # S3 state bucket + DynamoDB lock table
│   └── github-oidc/           # IAM OIDC provider + GitHub Actions deploy role
├── modules/                   # reusable, environment-agnostic building blocks
│   ├── ecr/                   # private image repository + lifecycle policy
│   ├── network/               # VPC (community module): public + private subnets
│   ├── eks/                   # cluster, managed node group, add-ons, access entries
│   └── irsa/                  # IAM roles for ALB controller, ESO, and app S3 access
└── envs/
    └── production/            # composes the modules; remote state in S3
```

> The community `terraform-aws-modules/{vpc,eks,iam}` modules are used for the
> network, cluster, and IRSA roles. `terraform init` fetches them; versions are
> pinned in each module's `main.tf`.

> ⚠️ The ALB Controller and External Secrets Operator are installed via **Helm in a
> separate phase**, not here: their providers must point at a cluster that already
> exists, so installing them in the same apply as the cluster is the classic
> chicken-and-egg failure. Their IAM/IRSA roles (`modules/irsa`) are created now;
> the Helm releases come after the cluster is up.

## Order of operations

1. **`bootstrap/state-backend`** — uses **local** state on first apply because it
   creates the very bucket/table the other stacks use for remote state. Optionally
   migrate its own state into the bucket afterward.
2. **`bootstrap/github-oidc`** — creates the OIDC provider + CI role. Capture the
   role ARN; later it becomes the `role-to-assume` in the GitHub Actions deploy job.
3. **`envs/production`** — `terraform init` with the backend pointed at the bucket
   from step 1, then `plan`. Phase 2 wires only the ECR module.

## Parameterization

No account-specific values are hard-coded. Region, bucket/table names, tags, the
allowed OIDC subjects, and repository names are all variables — see each stack's
`variables.tf` and `envs/production/terraform.tfvars.example`.

## Verifying (run these yourself)

```bash
terraform -chdir=infra/terraform/bootstrap/state-backend init
terraform -chdir=infra/terraform/bootstrap/state-backend fmt -check
terraform -chdir=infra/terraform/bootstrap/state-backend validate
# ...repeat per stack. `plan`/`apply` require AWS credentials and are deliberately
# left to you — nothing here should be applied without review.
```
