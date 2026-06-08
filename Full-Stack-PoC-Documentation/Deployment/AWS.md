# Deployment — AWS Production Architecture (EKS)

**Status: `Future:` — architecture decision only.** No AWS resources exist, no
Terraform is written, and no workflows or app code change as a result of this
document. It records the chosen production target and the path from today's
GHCR + Kubernetes-manifest setup to a running AWS deployment.

> ⚠️ **PoC limitation:** today the pipeline only builds and **publishes** a
> container image to GHCR — it deploys nowhere. Everything below is the planned
> next phase, gated on explicit approval before any resource is created.

The container and Kubernetes work is the **real production path**, not a throwaway
artifact. The Dockerfile image and the `k8s/` manifests carry forward into AWS
largely unchanged.

## Target Architecture

```
push to production-main
  → GitHub Actions  (OIDC → STS short-lived creds; no stored AWS keys)
    → docker build  (existing multi-stage Dockerfile)
    → push image    → Amazon ECR        (immutable :<git-sha> tag)
    → aws eks update-kubeconfig
    → apply manifests / set image        → Amazon EKS
        → Deployment → Service → ALB Ingress
          → public HTTPS app             (Route 53 + ACM)

Runtime dependencies:
  Secrets Manager  → External Secrets Operator → K8s Secret (envFrom)
  S3 (private)     + CloudFront (OAC)           → signed document downloads
  CloudWatch       ← Container Insights / Fluent Bit (logs + metrics)

Data:
  Supabase (now)   ·  Amazon RDS for PostgreSQL (Future: option)
```

| Stage | Service | Role |
| ----- | ------- | ---- |
| Build | GitHub Actions | Build image, authenticate to AWS via OIDC, trigger rollout |
| Registry | **ECR** | Private image store; immutable `:<git-sha>` tags |
| Runtime | **EKS** | Kubernetes cluster running the existing manifests |
| Ingress | **ALB** (via AWS Load Balancer Controller) | Public L7 entry, HTTPS termination |
| DNS/TLS | **Route 53 + ACM** | Domain + managed certificate on the ALB |
| Secrets | **Secrets Manager + ESO** | Runtime secrets synced into the cluster |
| Files | **S3 + CloudFront** | Private documents served via signed URLs |
| Observability | **CloudWatch** | Pod logs and metrics |
| Database | Supabase → **RDS** (`Future:`) | Postgres for documents/submissions |

## Why EKS

EKS is chosen because it is the **only** target that reuses **both** existing
assets at once: the Dockerfile image (via ECR) **and** the `k8s/`
Deployment/Service/Ingress as the deployment source of truth. The alternatives each
discard part of the work.

| Option | Verdict | Reasoning |
| ------ | ------- | --------- |
| **EKS** | **Chosen** | Runs the existing manifests nearly as-is and the existing image via ECR. Preserves the whole container + Kubernetes investment; manifests stay the source of truth. Highest operational cost/complexity, accepted deliberately and mitigated with a managed node group or Fargate profile. |
| AWS Amplify | Rejected | Builds the app **from source** and manages its own Lambda + CloudFront + S3 runtime. It **bypasses** the Dockerfile, the ECR image, and every Kubernetes manifest — the core work becomes dead weight. Directly conflicts with "manifests are the source of truth." |
| AWS App Runner | Rejected | Runs the container image (so Dockerfile + ECR stay relevant) but has **no Kubernetes** — the `k8s/` manifests go unused, and there is no Deployment/Ingress model to own. |
| Amazon ECS (Fargate) | Rejected | Container-native, but **task definitions replace** the Kubernetes manifests. The deployment spec would be rewritten in ECS's model rather than reused. |

### Cost & Operational Complexity Comparison

EKS is the most expensive and most operationally involved option. The choice is a
deliberate trade of higher ops burden for portability, reuse of the manifests, and
Kubernetes experience — not a claim that it is the cheapest path.

| Dimension | Amplify | App Runner | ECS Fargate | **EKS** |
| --------- | ------- | ---------- | ----------- | ------- |
| Baseline fixed cost | None (pay per build/usage) | Per running instance | Per task (vCPU/GB) | **~$0.10/hr control plane (~$73/mo) + nodes/Fargate** |
| Ops burden | Lowest — fully managed | Low — managed scaling/TLS | Medium — task defs, ALB, roles | **Highest — cluster upgrades, add-ons, node mgmt, IRSA** |
| Reuses Dockerfile | No | Yes | Yes | **Yes** |
| Reuses `k8s/` manifests | No | No | No | **Yes (source of truth)** |
| TLS/CDN | Built-in | Built-in | Manual (ALB/CloudFront) | **ALB + ACM (controller-managed)** |
| Autoscaling | Automatic | Automatic | Service auto scaling | **HPA + Cluster Autoscaler / Karpenter** |
| Portability | AWS-locked | AWS-locked | AWS-locked | **Portable (any K8s)** |
| Best fit here | Fastest URL | Simple container | AWS-native containers | **Reuse + K8s skill demonstration** |

> ⚠️ **PoC limitation:** EKS carries a fixed monthly control-plane charge even when
> idle. For a low-traffic PoC, a managed node group of small instances — or a
> **Fargate profile** to avoid managing nodes — keeps cost down. The trade is
> accepted because the goal is a real Kubernetes production path, not the cheapest
> hosting.

## How the Current Setup Evolves into ECR/EKS

Nothing is thrown away. Each existing asset maps forward:

| Asset (today) | Evolution (EKS) |
| ------------- | --------------- |
| `Dockerfile` (multi-stage standalone, non-root, `/api/health`) | **Unchanged.** Same image is the runtime artifact. |
| `.github/workflows/production.yml` (GHCR push) | Repointed: replace the `docker/login-action` GHCR step with `aws-actions/configure-aws-credentials` (**OIDC**) + `aws-actions/amazon-ecr-login`; push to **ECR** with an immutable `:<git-sha>` tag. Add a **deploy job**: `aws eks update-kubeconfig` → `kubectl set image` / `kubectl apply -k`. GHCR optionally retained as a mirror or dropped. |
| `k8s/namespace.yaml`, `configmap.yaml`, `service.yaml` | **Unchanged.** |
| `k8s/deployment.yaml` | `image:` GHCR → ECR (`<acct>.dkr.ecr.<region>.amazonaws.com/pwyw-web:<sha>`); add a **ServiceAccount** with an **IRSA** annotation; bump to **≥2 replicas**; add **HPA** + **PodDisruptionBudget** (already listed as follow-ups in `k8s/README.md`). |
| `k8s/ingress.yaml` | Generic Ingress → **ALB** annotations (`ingressClassName: alb`, `alb.ingress.kubernetes.io/scheme: internet-facing`, `target-type: ip`, `certificate-arn: <ACM ARN>`, `listen-ports`). |
| `k8s/secret.example.yaml` / manual `secret.yaml` | Real values move to **Secrets Manager**; **External Secrets Operator** syncs them into the `Secret app-secrets` the Deployment already consumes via `envFrom`. Manifests stay unchanged in shape. |
| `public/files/*.pdf` (PoC downloads) | Private **S3** bucket + **CloudFront** (OAC); app issues **signed URLs after confirmed payment**, using its IRSA role. |

The `k8s/README.md` "Future: AWS / EKS Mapping" table is the seed of this section;
this document expands it into a full plan.

## AWS Services & IAM

- **ECR** — private repository `pwyw-web`; immutable `:<git-sha>` tags; a lifecycle
  policy to expire untagged/old images.
- **EKS** — managed cluster; a **managed node group** (or **Fargate profile** to
  skip node management); cluster access granted via **EKS access entries** (or the
  `aws-auth` ConfigMap).
- **IAM / OIDC — no long-lived keys:**
  - **GitHub Actions deploy role** — trust policy federates GitHub's OIDC provider
    (`token.actions.githubusercontent.com`), with the `sub` condition scoped to
    `repo:captainPeanutbuttter495/Full-Stack-PoC:ref:refs/heads/production-main`.
    Permissions: ECR push + EKS describe/access for `kubectl`.
  - **EKS cluster role + node group role** (Terraform-managed later).
  - **IRSA pod roles** — app ServiceAccount role for **S3 signing**; **External
    Secrets Operator** role for Secrets Manager reads; **AWS Load Balancer
    Controller** role.
- **AWS Load Balancer Controller** — installed in-cluster; provisions an **ALB**
  from the Ingress and attaches the ACM cert to the HTTPS listener.
- **Route 53 + ACM** — hosted zone + managed certificate; DNS record → ALB; TLS
  terminates at the ALB.
- **Secrets Manager + External Secrets Operator** — real runtime secrets
  (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`) live in Secrets Manager; ESO syncs them into the K8s
  `Secret`. A manual `kubectl` secret is acceptable as a first step.
- **S3 + CloudFront (protected downloads)** — private bucket (all public access
  blocked) fronted by CloudFront with **Origin Access Control**; the app generates
  **signed URLs only after a confirmed Stripe payment**. Replaces the PoC
  `public/files` approach, where a file is public if the URL is known.
- **CloudWatch** — pod logs and metrics via **Container Insights / Fluent Bit**
  (the `amazon-cloudwatch-observability` add-on).
- **Amazon RDS for PostgreSQL (`Future:` option)** — **keep Supabase initially.**
  Supabase is Postgres **plus auth plus storage**; RDS is Postgres only, so moving
  to it also forces a new auth story (e.g., Cognito) and a storage replacement.
  Prisma's `DATABASE_URL` / `DIRECT_URL` keeps the SQL layer portable, but the cost
  is auth and storage, not the data. **Trigger to revisit:** wanting everything
  inside one AWS VPC. EKS → RDS then needs VPC security-group wiring and a DB subnet
  group.

## Planned Terraform Structure (architecture only — no code yet)

Terraform is **not** written until the architecture is approved. The intended
layout separates a one-time **bootstrap** (remote state + the OIDC trust that CI
depends on) from **environment** stacks composed of reusable **modules**. State is
remote in S3 with a DynamoDB lock table.

```
infra/terraform/
├── bootstrap/                 # run once, local state → then migrates to S3
│   ├── state-backend          # S3 bucket + DynamoDB lock table
│   └── github-oidc            # IAM OIDC provider + GitHub Actions deploy role
├── modules/                   # reusable, environment-agnostic building blocks
│   ├── network/               # VPC, subnets, NAT, route tables
│   ├── ecr/                   # repository + lifecycle policy
│   ├── eks/                   # cluster, node group / Fargate profile, access entries
│   ├── eks-addons/            # ALB controller, External Secrets Operator, CloudWatch
│   ├── irsa/                  # per-ServiceAccount IAM roles (app S3, ESO, ALB)
│   ├── dns-tls/               # Route 53 zone/records + ACM certificate
│   ├── secrets/               # Secrets Manager secrets (values injected, not committed)
│   └── storage-cdn/           # private S3 bucket + CloudFront (OAC)
└── envs/
    └── production/            # composes the modules; remote state in S3
        ├── main.tf
        ├── variables.tf
        └── backend.tf
```

| Layer | Responsibility | Lifecycle |
| ----- | -------------- | --------- |
| `bootstrap/` | State backend + GitHub OIDC trust | Once, before anything else |
| `modules/` | Reusable infra definitions | Versioned, no environment specifics |
| `envs/production/` | Real production composition | Changes per release/infra update |

> ⚠️ **PoC limitation:** Kubernetes workload objects (Deployment/Service/Ingress)
> stay in **`k8s/` manifests**, *not* Terraform. Terraform provisions the
> **platform** (cluster, IAM, networking, registry); the manifests remain the
> application deployment source of truth. This keeps a clean split and avoids two
> tools fighting over the same objects.

## Deployment Mechanism: GitHub Actions + `kubectl` vs. Argo CD GitOps

Two ways to get an image running on the cluster. Both keep the `k8s/` manifests as
the source of truth; they differ in **who applies them**.

| Aspect | **GitHub Actions + `kubectl apply`** (push) | **Argo CD GitOps** (pull) |
| ------ | ------------------------------------------- | ------------------------- |
| Model | CI pushes changes to the cluster | In-cluster controller pulls + reconciles from Git |
| Extra infra | None — reuses existing Actions | Argo CD must be installed/operated in-cluster |
| Drift detection | None (fire-and-forget) | Continuous reconcile back to Git state |
| Credentials | CI assumes an IAM role via OIDC, runs `kubectl` | Controller has cluster access; CI only writes to Git |
| Rollback | Re-run with a previous SHA tag | Revert the Git commit; controller reconciles |
| Best for | Getting to production quickly with one pipeline | Mature multi-env, audited, self-healing delivery |

**Recommendation: start with GitHub Actions + `kubectl`.** It reuses the pipeline
that already exists, adds no cluster components to operate, and is the shortest path
to a working deployment for a single-environment PoC. **Argo CD is a `Future:`
upgrade** worth adopting once there are multiple environments or a need for
drift detection and self-healing — at which point the same `k8s/` manifests become
the Git source Argo CD reconciles, so the switch is additive, not a rewrite.

## Phased Roadmap (current GHCR/K8s → AWS production)

| # | Phase | Scope |
| - | ----- | ----- |
| 1 | **Architecture decision** | This document; EKS approved. |
| 2 | **Terraform foundation** | `bootstrap/`: remote state (S3 + DynamoDB), GitHub OIDC provider + CI IAM role, ECR repo. No cluster yet. |
| 3 | **ECR + CI image push** | Repoint `production.yml` to push to ECR via OIDC with immutable `:<sha>` tags. |
| 4 | **EKS cluster** | Terraform: VPC, EKS, node group / Fargate, access entries, ALB controller, ESO, CloudWatch add-on. |
| 5 | **Manifests → EKS** | Apply updated manifests (ECR image, ALB ingress, IRSA ServiceAccount, ≥2 replicas + HPA/PDB). |
| 6 | **Domain / TLS** | Route 53 + ACM; ALB ingress references the cert; DNS → ALB. |
| 7 | **Secrets + protected files** | Secrets Manager + ESO; private S3 + CloudFront signed URLs (IRSA). |
| 8 | **Continuous deploy** | `production.yml` deploy job updates the EKS image to the SHA on every push. |
| 9 | **(`Future:`) RDS / Argo CD** | Migrate DB into the VPC if going all-in-AWS; adopt Argo CD GitOps for multi-env. |

> **Implementation status:** Phases 1–8 are **written as unapplied IaC** — Terraform
> under `infra/terraform/` (bootstrap + `modules/{ecr,network,eks,eks-addons,irsa,dns-tls,secrets,storage-cdn}`
> + `envs/production`), the EKS Kustomize overlay at `k8s/overlays/eks/`, and the
> `ecr` + `deploy` jobs in `production.yml`. **Nothing has been `terraform apply`-d
> and no AWS resources exist.** All account IDs, ARNs, domains, and secret values are
> placeholders set at deploy time. Phase 9 (RDS / Argo CD) stays `Future:`.

## Manual First vs. Automated Later

| Manual at first | Automated later |
| --------------- | --------------- |
| `terraform apply` for cluster, VPC, IAM | Image build + push to ECR (already automated — just retargeted) |
| First `kubectl apply` of the manifests | Rolling deploy to EKS on `production-main` push (set image to SHA) |
| ACM/DNS validation; seeding the first Secret | ESO secret sync from Secrets Manager |
| Verifying the ALB + health checks by hand | HPA autoscaling; optional Argo CD GitOps reconciliation |

## Short-Lived Demo Deployment (Cost-Optimized)

Goal: prove the **full Docker → ECR → EKS → Ingress → HTTPS** path **plus S3 +
CloudFront protected downloads** for ~one week, then tear everything down cleanly
without leaving expensive resources running. Optimization targets **only** the
expensive, always-on compute/network; the cheap, demo-defining pieces stay.

### What stays (not optimized away)

- **Route 53 + ACM** — real domain and HTTPS are part of what's being demoed. A
  hosted zone is `$0.50/month` (flat); public ACM certs are free.
- **S3 private documents bucket + CloudFront (OAC) signed URLs** — the protected
  download flow is a headline feature of the demo. Negligible cost at demo traffic.

### The three expensive levers

**1. EKS control plane — fixed `$0.10/hr` (~`$16.80`/week). Unavoidable with EKS.**
It bills per hour the cluster exists, idle or not. The only lever is *time*: create
at the start of the demo window and `terraform destroy` the moment it ends. Three
days instead of seven ≈ `$7` instead of `$16.80`.

**2. Worker nodes — compare options** (us-west-2, rough):

| Option | Spec | ~Hourly | ~1 week | Notes |
| ------ | ---- | ------- | ------- | ----- |
| t3.medium on-demand ×2 | 2 vCPU / 4 GB | `$0.0832` | ~`$14` | Current default; production-like (≥2 nodes) |
| t3.small on-demand ×1 | 2 vCPU / 2 GB | `$0.0208` | ~`$3.5` | Runs the app pod + system pods; min realistic size |
| t3.small **Spot** ×1 | 2 vCPU / 2 GB | ~`$0.007` | ~`$1.2` | **Cheapest**; interruption risk is fine for a demo |
| **Fargate** (per pod) | 0.25 vCPU / 0.5 GB | ~`$0.012` | ~`$2`/pod | No node management or idle cost — but **forces private subnets → NAT/endpoints** |

Recommendation: **1× t3.small** (Spot for cheapest, on-demand for stability). One
node runs the app plus system pods fine; you can still set 2 replicas (they
co-schedule). Fargate is operationally clean but reintroduces NAT (next lever), so
it is not the cost winner here.

**3. NAT Gateway — ~`$0.045/hr` + `$0.045/GB` (~`$7.56`/week + data). Avoidable.**

| Approach | NAT cost | Trade-off |
| -------- | -------- | --------- |
| **Public-subnet nodes, no NAT** (recommended for demo) | **`$0`** | Nodes reach the internet/ECR via the free Internet Gateway. Nodes get public IPs — fine for a short demo; the app is still only reachable through the ALB. |
| Single NAT, private nodes | ~`$7.56`/wk | More production-like; keeps nodes private |
| VPC endpoints (S3 gateway free + ECR/STS/logs interface) | ~`$1.68`/wk each | ~4 interface endpoints ≈ one NAT for a week, but more secure; add the **free S3 gateway endpoint** regardless |

For lowest one-week cost, put the node group in **public subnets and disable NAT**
(`enable_nat_gateway = false`).

> ✅ **Implemented in Terraform.** The toggles exist in the committed modules:
> `enable_nat_gateway`, `worker_nodes_public`, `enable_s3_gateway_endpoint`,
> `node_instance_types`, `node_capacity_type`, and `ecr_force_delete`. Use
> `infra/terraform/envs/production/demo.tfvars.example` for the no-NAT, public-node,
> Spot demo config, or `terraform.tfvars.example` for the private-node + NAT
> production-like config. (The S3 documents bucket `force_destroy` toggle arrives
> with the storage phase.) Still **unapplied** — no resources exist.

> ⚠️ EKS **Fargate requires private subnets**, so choosing Fargate means keeping NAT
> (or VPC endpoints). EC2 nodes in **public** subnets is what unlocks the no-NAT
> saving.

### Estimated one-week cost

Rough us-west-2 estimates assuming the cluster runs the full 7 days — **not a quote.**

| Scenario | Control plane | Nodes | NAT | ALB | R53/S3/CF | **Week total** |
| -------- | ------------- | ----- | --- | --- | --------- | -------------- |
| **A — cheapest** (public 1× t3.small Spot, no NAT) | `$16.80` | ~`$1.2` | `$0` | ~`$4` | ~`$0.7` | **≈ `$23`** |
| B — balanced (public 1× t3.small on-demand, no NAT) | `$16.80` | ~`$3.5` | `$0` | ~`$4` | ~`$0.7` | **≈ `$25`** |
| C — production-like (private 2× t3.medium, 1 NAT) | `$16.80` | ~`$14` | ~`$8.5` | ~`$4` | ~`$0.7` | **≈ `$44`** |

ALB ≈ `$0.0225/hr` + small LCU. Route 53 zone `$0.50/mo` (flat), ACM free,
S3/CloudFront negligible at demo traffic. **The control plane dominates every
scenario** — the real money-saver is destroying promptly, not node choice.

### Teardown checklist

> ⚠️ The biggest risk is **orphaned resources Terraform does not own**: the ALB,
> target groups, and security groups created *by the AWS Load Balancer Controller*
> (not Terraform), plus a non-empty S3 bucket / ECR repo. They block VPC deletion
> and keep billing. Delete the Kubernetes objects **first** so the controller
> deprovisions its ALB, then destroy.

1. **Delete the Ingress (and any `type: LoadBalancer` Service) first:**
   `kubectl delete ingress --all -n pwyw` — wait until the ALB, target groups, and
   controller-managed security groups disappear from the EC2 console. (Skipping this
   strands an ALB + ENIs that prevent the VPC from deleting.)
2. **Empty the S3 documents bucket** (or set `force_destroy = true`) — S3 won't
   delete a non-empty bucket.
3. **Delete ECR images** (or set `force_delete = true`) — `modules/ecr` defaults to
   `force_delete = false`.
4. **Disable + delete the CloudFront distribution** — if Terraform-managed it does
   this, but propagation takes ~15 min; confirm it's gone.
5. `terraform -chdir=infra/terraform/envs/production destroy` — removes EKS, node
   group, IRSA, VPC/NAT/EIP, ECR, S3/CloudFront.
6. `terraform -chdir=infra/terraform/bootstrap/github-oidc destroy`.
7. **State backend last:** `bootstrap/state-backend` has `prevent_destroy = true` +
   versioning. To remove it: drop `prevent_destroy`, empty all object versions, then
   destroy (or delete the bucket + DynamoDB table by hand). Or just **leave it** — an
   empty versioned bucket + on-demand lock table costs ≈ `$0`.
8. **Manual sweep — confirm in the console / Cost Explorer that none remain:**
   - EKS cluster, EC2 instances, **NAT Gateway**, **Elastic IPs** (an unattached NAT
     EIP keeps billing), ALB / target groups, ENIs.
   - **CloudWatch log groups** from the `amazon-cloudwatch-observability` add-on /
     Container Insights — these persist after teardown; delete to stop storage charges.
   - Route 53 hosted zone — keep if you keep the domain (`$0.50/mo`); delete stale
     records pointing at the gone ALB.
   - ACM certificate — free; leave or delete.

**Safe to keep between demos (≈ `$0`):** the Terraform state bucket + lock table, the
ACM cert, and the Route 53 hosted zone (if you want to retain the domain). Recreate
the cluster / nodes / NAT / ALB each demo window.

## Related Docs

- `Deployment/CI-CD.md` — current GitHub Actions pipelines (GHCR publish, Vitest, gated E2E).
- `Deployment/Kubernetes.md` — the `k8s/` manifests and the seed "Future: AWS / EKS Mapping" table this document expands.
- `Deployment/Docker.md` — the multi-stage image these deployments run.
- `k8s/README.md` — apply order, dry-run, and pull-secret operations.

## Future Work (Not in Scope)

- Write the Terraform under `infra/terraform/` (only after this architecture is approved).
- Image scanning / SBOM in CI before the ECR push.
- Branch protection requiring the production checks before merge.
- Argo CD GitOps and multi-environment overlays (Kustomize).
- RDS migration with a Cognito (or retained Supabase) auth decision.
