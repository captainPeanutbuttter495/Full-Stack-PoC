# Kubernetes Manifests (Cloud-Portable)

Vendor-neutral manifests for running the Next.js standalone app in any Kubernetes
cluster. **Manifests only — there is no live cluster.** They are written to be
applied as-is to a local cluster (kind, minikube, Docker Desktop) or any managed
cluster, and to document the future AWS/EKS mapping.

## Files

| File                  | Kind              | Purpose                                                        |
| --------------------- | ----------------- | -------------------------------------------------------------- |
| `namespace.yaml`      | Namespace         | Isolates all objects in `pwyw`; one-command teardown           |
| `configmap.yaml`      | ConfigMap         | Public `NEXT_PUBLIC_*` + standalone runtime defaults           |
| `secret.example.yaml` | Secret (template) | Placeholder runtime secrets — copy to `secret.yaml`            |
| `deployment.yaml`     | Deployment        | App pod: GHCR image, port 3000, `/api/health` probes, non-root |
| `service.yaml`        | Service           | ClusterIP, port 80 → 3000                                      |
| `ingress.yaml`        | Ingress           | Public host/TLS; Stripe webhook needs a public URL             |

## Secrets

`secret.example.yaml` is a **template with placeholders** — safe to commit. The
real secret is **never** committed (`k8s/secret.yaml` is gitignored):

```bash
cp k8s/secret.example.yaml k8s/secret.yaml
# edit k8s/secret.yaml with real DATABASE_URL, DIRECT_URL,
# SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

## Apply Order

The namespace must exist before namespaced objects, and config/secret before the
deployment that consumes them:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml        # your filled-in copy, not the .example
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

`kubectl apply -f k8s/` also works — on the first pass it may warn about the
namespace not yet existing for some objects; re-run once and it reconciles. The
explicit order above avoids that.

Validate without a cluster (client-side dry run):

```bash
kubectl apply --dry-run=client -f k8s/
```

## Image & Tags

The deployment references:

```
ghcr.io/captainpeanutbuttter495/full-stack-poc:production-main
```

| Tag                | Use                                                           |
| ------------------ | ------------------------------------------------------------- |
| `:production-main` | Primary deployable tag, moves with the integration branch     |
| `:<git-sha>`       | **Pin this for a specific rollout** — immutable and traceable |
| `:latest`          | Optional convenience only — **do not** use as the deploy tag  |

CI (`.github/workflows/production.yml`) builds and pushes all three on every push
to `production-main`.

### Private GHCR package

If the GHCR package is private, create a pull secret and reference it in the
deployment (`imagePullSecrets`, currently commented out):

```bash
kubectl -n pwyw create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<github-PAT-with-read:packages>
```

## ⚠️ PoC Limitations

- `replicas: 1` — there is no live cluster. Production would run **≥2** replicas
  for availability and zero-downtime rolling updates.
- No `HorizontalPodAutoscaler`, `PodDisruptionBudget`, `NetworkPolicy`, or TLS
  issuer wired up — listed as follow-ups, not implemented.
- The database (Supabase), Stripe, and Storage stay as **external managed
  services**; nothing runs in-cluster except the app.

## Future: AWS / EKS Mapping

These manifests are portable; moving to AWS/EKS is a swap of the surrounding
platform pieces, not a rewrite.

| Concern      | This PoC (portable)    | Future AWS / EKS                                          |
| ------------ | ---------------------- | --------------------------------------------------------- |
| Registry     | GHCR                   | ECR                                                       |
| Ingress      | generic Ingress        | AWS Load Balancer Controller (ALB Ingress)                |
| TLS          | commented `tls:` block | ACM cert on the ALB                                       |
| Secrets      | K8s `Secret`           | External Secrets Operator + AWS Secrets Manager, via IRSA |
| Pod identity | n/a                    | IRSA (IAM Roles for Service Accounts)                     |
| Database     | Supabase (external)    | Amazon RDS for PostgreSQL (or keep Supabase)              |
| Scaling      | `replicas: 1`          | HPA + Cluster Autoscaler / Karpenter                      |

See `Full-Stack-PoC-Documentation/Deployment/Kubernetes.md` for the full write-up.
