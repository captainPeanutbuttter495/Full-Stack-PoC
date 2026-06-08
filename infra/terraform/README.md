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

## Demo Mode vs Production-like Mode

The `envs/production` stack ships two example variable files. Copy the one you want
to `terraform.tfvars` (gitignored).

| Concern             | Production-like (`terraform.tfvars.example`) | Demo (`demo.tfvars.example`)                             |
| ------------------- | -------------------------------------------- | -------------------------------------------------------- |
| Nodes               | Private subnets                              | **Public subnets** (`worker_nodes_public = true`)        |
| NAT gateway         | On                                           | **Off** (`enable_nat_gateway = false`) — saves ~$7.56/wk |
| Node group          | 2× `t3.medium` `ON_DEMAND`                   | **1× `t3.small` `SPOT`**                                 |
| S3 gateway endpoint | On                                           | On (free, both modes)                                    |
| ECR `force_delete`  | `false` (safe)                               | **`true`** (clean teardown)                              |

The relevant toggles (`enable_nat_gateway`, `worker_nodes_public`,
`enable_s3_gateway_endpoint`, `node_instance_types`, `node_capacity_type`,
`node_desired_size`, `ecr_force_delete`) are all plain variables — nothing is
hard-coded to a mode. Coherent combinations:

- **Production-like:** `worker_nodes_public = false` + `enable_nat_gateway = true`.
- **Demo:** `worker_nodes_public = true` + `enable_nat_gateway = false`.

> ⚠️ `ecr_force_delete = true` (and the future S3 `force_destroy`) are **demo-only**
> conveniences so `terraform destroy` doesn't snag on images/objects. Keep them
> `false` for anything you don't want wiped. Full cost + teardown guidance:
> `Full-Stack-PoC-Documentation/Deployment/AWS.md` → "Short-Lived Demo Deployment".

## Verifying (run these yourself)

```bash
terraform -chdir=infra/terraform/bootstrap/state-backend init
terraform -chdir=infra/terraform/bootstrap/state-backend fmt -check
terraform -chdir=infra/terraform/bootstrap/state-backend validate
# ...repeat per stack. `plan`/`apply` require AWS credentials and are deliberately
# left to you — nothing here should be applied without review.
```
