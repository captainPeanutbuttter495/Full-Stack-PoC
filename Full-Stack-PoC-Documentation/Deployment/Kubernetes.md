# Deployment — Kubernetes (Cloud-Portable Manifests)

Vendor-neutral Kubernetes manifests for the Next.js standalone app, living in the
repo's `k8s/` directory. Covers each manifest, how the `/api/health` probes wire
up, secret handling, the Stripe-webhook ingress caveat, and the future AWS/EKS
mapping.

> ⚠️ **PoC limitation:** these are **manifests only — there is no live cluster**.
> They are designed to apply cleanly to any cluster (kind, minikube, Docker
> Desktop, or a managed cluster) and to document the future AWS/EKS path. AWS is
> **Future:** work, not in scope.

## Manifests

| File                      | Kind              | Summary                                                                              |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `k8s/namespace.yaml`      | Namespace         | `pwyw` — isolates all objects; `kubectl delete namespace pwyw` tears everything down |
| `k8s/configmap.yaml`      | ConfigMap         | Public `NEXT_PUBLIC_*` + standalone runtime defaults (`PORT`, `HOSTNAME`, …)         |
| `k8s/secret.example.yaml` | Secret (template) | Placeholder runtime secrets; copy to `k8s/secret.yaml`                               |
| `k8s/deployment.yaml`     | Deployment        | App pod: image, port 3000, probes, non-root securityContext, resources               |
| `k8s/service.yaml`        | Service           | ClusterIP, port 80 → container 3000                                                  |
| `k8s/ingress.yaml`        | Ingress           | Public host + TLS placeholders                                                       |

Operational quickstart (apply order, dry-run, pull secrets) lives in `k8s/README.md`.

## Health Probes

The deployment's **liveness** and **readiness** probes both `httpGet` the
`/api/health` route (added with this work) on the container's `http` port (3000):

| Probe     | Path              | Purpose                               |
| --------- | ----------------- | ------------------------------------- |
| liveness  | `GET /api/health` | Restart the pod if the process wedges |
| readiness | `GET /api/health` | Hold traffic until the app can serve  |

`/api/health` returns `200 {"status":"ok","timestamp":"<ISO>"}` and makes **no
database, Supabase, or Stripe calls**. That keeps probes cheap and prevents a slow
downstream service from causing false restarts. The timestamp lets an operator
confirm the response is live, not cached.

## Configuration & Secrets

The app gets its environment from two sources, mounted via `envFrom`:

| Source                 | Holds                                                                                                   | Sensitivity |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| `ConfigMap app-config` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, runtime defaults                    | Public      |
| `Secret app-secrets`   | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Server-only |

- **`NEXT_PUBLIC_*` are inlined at build time** into the client bundle (see
  `Docker.md`). The ConfigMap values are for server-side reads and to document
  what a given image was built against — changing them does not re-bake the
  bundle; that needs a rebuilt image.
- The real Secret is **never committed.** `secret.example.yaml` ships placeholders;
  the filled-in `k8s/secret.yaml` is gitignored. ⚠️ **PoC limitation:** a plain
  K8s `Secret` is only base64-encoded, not encrypted at rest by default — see the
  AWS mapping for the production-grade option.

## Security Context

The pod runs as the same non-root identity baked into the image
(`nextjs`, uid/gid 1001): `runAsNonRoot: true`, `runAsUser/Group: 1001`,
`allowPrivilegeEscalation: false`, and all Linux capabilities dropped.
`readOnlyRootFilesystem` is intentionally **not** enabled because the Next.js
standalone server writes to `.next/cache` at runtime; enabling it would require
mounting `emptyDir` volumes for the cache and `/tmp`.

## ⚠️ Stripe Webhook Needs a Public URL

Stripe delivers `checkout.session.completed` and `charge.refunded` events by
POSTing to `/api/stripe/webhook`. That endpoint must be **publicly reachable**, so
the Ingress `host` has to be real and DNS-resolvable in any environment that
processes payments, with the Stripe dashboard pointed at
`https://<host>/api/stripe/webhook`. (For local dev, the Docker workflow uses
`stripe listen --forward-to localhost:3000/api/stripe/webhook` instead.)

## Replicas

`replicas: 1` — a deliberate PoC choice, since there is no live cluster.
**Production would run ≥2 replicas** for availability and zero-downtime rolling
updates, fronted by the Service and Ingress (no app changes needed).

## Future: AWS / EKS Mapping

The manifests are portable; moving to AWS/EKS swaps surrounding platform pieces,
not the app.

| Concern      | This PoC (portable)    | Future AWS / EKS                                |
| ------------ | ---------------------- | ----------------------------------------------- |
| Registry     | GHCR                   | ECR                                             |
| Ingress      | generic `Ingress`      | AWS Load Balancer Controller (ALB Ingress)      |
| TLS          | commented `tls:` block | ACM certificate on the ALB                      |
| Secrets      | K8s `Secret` (base64)  | External Secrets Operator + AWS Secrets Manager |
| Pod identity | n/a                    | IRSA (IAM Roles for Service Accounts)           |
| Database     | Supabase (external)    | Amazon RDS for PostgreSQL (or keep Supabase)    |
| Scaling      | `replicas: 1`          | HPA + Cluster Autoscaler / Karpenter            |

## Future Work (Not in Scope)

- Apply to a real cluster; wire a TLS issuer (e.g. cert-manager).
- `HorizontalPodAutoscaler`, `PodDisruptionBudget`, `NetworkPolicy`.
- Package as Helm/Kustomize for multi-environment overlays.
