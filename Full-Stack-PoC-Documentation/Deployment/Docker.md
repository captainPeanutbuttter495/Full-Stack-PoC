# Deployment — Docker (Local Containerization)

How the Next.js app is containerized for consistent local runs. Covers the root `Dockerfile`, `.dockerignore`, the build-time vs runtime environment split, and the build/run commands.

> ⚠️ **PoC limitation:** the container is for **consistent local runs**, not production deployment. It containerizes **only the Next.js app** — Postgres (Supabase), Stripe, and Storage remain remote managed services, so there is **no `docker-compose`** and nothing else to orchestrate. AWS, CI/CD, and Kubernetes are **Future:** work, not in scope.

## What It Does

The repo ships a root `Dockerfile` and `.dockerignore`. The build produced a small, self-contained runtime image using a **multi-stage build** and Next.js **standalone output** (`output: "standalone"` in `next.config.ts`).

| Stage | Base | Purpose |
| ----- | ---- | ------- |
| `deps` | `node:22-bookworm-slim` | Enabled `pnpm` via Corepack and installed dependencies from `pnpm-lock.yaml` (`--frozen-lockfile`). Layer caches unless manifests change. |
| `builder` | `node:22-bookworm-slim` | Copied deps + source, ran `npx prisma generate` (the client is gitignored), then `pnpm build`. |
| `runner` | `node:22-bookworm-slim` | Minimal runtime: copied `.next/standalone`, `.next/static`, and `public`; ran as a non-root `nextjs:nodejs` user (uid/gid 1001); started `node server.js`. |

**Key implementation details:**

- **Package manager:** `pnpm` is provisioned by Corepack at the version pinned in `package.json`'s `packageManager` field. `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` keeps the non-interactive build from hanging. Build-script approval lives in `pnpm-workspace.yaml` (`allowBuilds`).
- **Prisma client:** `lib/generated/prisma` is gitignored, so the client was regenerated inside the image with `npx prisma generate` before the build.
- **Runtime defaults:** `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`, `NEXT_TELEMETRY_DISABLED=1`.
- **Non-root:** the final image runs as an unprivileged `nextjs` user.

## Build-Time vs Runtime Environment

This split is the most important rule for the image.

| Kind | Variables | When | How passed |
| ---- | --------- | ---- | ---------- |
| **Build-time (public)** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `next build` | `--build-arg` |
| **Runtime (secret)** | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `docker run` | `--env-file .env.local` |

- `NEXT_PUBLIC_*` values are **inlined into the client bundle at build time**, so they are passed as `--build-arg`. They are public-safe keys; **no server-only secret is ever passed at build time.**
- Because `NEXT_PUBLIC_*` are baked in, **changing them requires a rebuild** — they are not runtime knobs.
- All server-only secrets are injected **only at `docker run`** via `--env-file` and are never baked into the image.

## Build

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
  -t fullstack-poc .
```

## Run

```bash
docker run --rm -p 3000:3000 --env-file .env.local fullstack-poc
```

Open [http://localhost:3000](http://localhost:3000). The same `.env.local` used for local development supplies the runtime secrets.

> Stripe webhooks still need a public URL. As in local dev, run
> `stripe listen --forward-to localhost:3000/api/stripe/webhook` on the host while the container is running.

The non-Docker workflow (`pnpm dev` / `pnpm build` / `pnpm start`) is unchanged.

## `.dockerignore`

The build context excluded everything not needed to build or run the app: `node_modules`, `.next`, the generated Prisma client (regenerated in-image), all `.env*` files (secrets), version control / CI tooling, and **test assets** (`tests/`, `e2e/`, `playwright.config.ts`, reports). `playwright.config.ts` was excluded specifically because it imports `@next/env` — a transitive dependency not resolvable under pnpm — which would otherwise fail `next build`'s project-wide type check.

## Future Work (Not in Scope)

- **Production deployment:** Vercel or AWS Lambda for the Next.js server; Supabase remains the database and auth provider.
- **CI/CD:** GitHub Actions to lint/build/test and build the image.
- **Kubernetes:** cloud-portable manifests (`Deployment`, `Service`, `Ingress`) mapping to a future AWS/EKS deployment.
