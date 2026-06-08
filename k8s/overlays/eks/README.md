# EKS Overlay (Kustomize)

AWS-specific layer over the portable base manifests in `k8s/`. The base files are
**unchanged** and still work with `kubectl apply -f k8s/` on any cluster; this
overlay adds what EKS needs.

```bash
kubectl apply -k k8s/overlays/eks
```

## What it adds / changes

| Resource | Purpose |
| -------- | ------- |
| `images:` transformer | GHCR → ECR (`ACCOUNT_ID.dkr.ecr.REGION...`); CI sets the `sha-<commit>` tag |
| `serviceaccount.yaml` | `pwyw-web` SA with the IRSA role annotation (S3 signed URLs) |
| `deployment-patch.yaml` | `replicas: 2` + `serviceAccountName: pwyw-web` |
| `ingress-alb.yaml` | ALB Ingress (`ingressClassName: alb`, ACM cert, `/api/health` checks) |
| `hpa.yaml` | CPU autoscaler (min 2 / max 5) |
| `pdb.yaml` | `minAvailable: 1` |

## Placeholders to fill at deploy (no real values committed)

| Placeholder | Source |
| ----------- | ------ |
| `ACCOUNT_ID` / `REGION` in the image name | your AWS account + region |
| image `newTag` | the `sha-<commit>` pushed by CI (the deploy job overrides this) |
| `REPLACE_WITH_APP_IRSA_ROLE_ARN` | `terraform output app_role_arn` |
| `REPLACE_WITH_ACM_CERTIFICATE_ARN` | `terraform output` from the dns-tls module / ACM |
| `pwyw.example.com` | your real `app_hostname` |

## Demo note

For the cheapest single-node demo, drop `hpa.yaml` `minReplicas` (and the
deployment patch `replicas`) to `1`. Teardown: `kubectl delete -k k8s/overlays/eks`
**before** `terraform destroy` so the ALB Controller deprovisions the ALB first
(see `Deployment/AWS.md` → teardown checklist).
