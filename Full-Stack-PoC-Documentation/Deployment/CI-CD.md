# Deployment — CI/CD (GitHub Actions)

How the project builds, validates, and publishes via GitHub Actions. Two workflows
mirror the branch policy: `tests` runs the full quality gate, `production-main`
verifies and publishes the Docker image to GHCR.

> ⚠️ **PoC limitation:** CI builds and pushes a container image to **GHCR** and
> runs the test suite. It does **not** deploy anywhere — there is no live cluster
> and **AWS is out of scope**. Deployment is `Future:` work.

## Workflows

| File                               | Branch            | Jobs                                                                   |
| ---------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `.github/workflows/tests.yml`      | `tests`           | `test` (lint, format:check, build, Vitest) → `e2e` (gated Playwright)  |
| `.github/workflows/production.yml` | `production-main` | `verify` (lint, format:check, build) → `docker` (build + push to GHCR) |

Both trigger on `push` and `pull_request` for their branch. Every job uses
**Corepack** to provision the pinned `pnpm@11.4.0`, Node 22 with pnpm cache, and
runs `npx prisma generate` before building (the Prisma client is gitignored) —
matching the Dockerfile exactly.

## `tests` Pipeline

| Step     | Command             | Notes                                      |
| -------- | ------------------- | ------------------------------------------ |
| Lint     | `pnpm lint`         | ESLint 9 flat config                       |
| Format   | `pnpm format:check` | Prettier check-only                        |
| Build    | `pnpm build`        | Needs `NEXT_PUBLIC_*` (inlined at build)   |
| Unit/API | `pnpm test`         | Vitest; `vitest.config.ts` excludes `e2e/` |
| E2E      | `pnpm test:e2e`     | **Gated** Playwright job (see below)       |

**Playwright is gated.** It needs a dev server plus Supabase/Stripe test
credentials, so the `e2e` job only runs when the repo **variable** `E2E_ENABLED`
is `'true'`. (GitHub does not allow the `secrets` context in a job-level `if`, so
a `vars` flag is the standard gate.) When unset, the job is skipped cleanly and
the pipeline still passes on the Vitest suite.

## `production-main` Pipeline

The `verify` job runs lint/format/build (no tests — `production-main` carries app
and infra only, no test files). The `docker` job then:

1. Runs **only on `push`** (`if: github.event_name == 'push'`) — never publishes from an unmerged PR.
2. Logs in to GHCR with the built-in `GITHUB_TOKEN` (`packages: write`).
3. Builds the image from the root `Dockerfile` (which runs `prisma generate` + `pnpm build` internally), passing the two `NEXT_PUBLIC_*` build-args.
4. Pushes the tags below.

### GHCR Tagging

Image: `ghcr.io/captainpeanutbuttter495/full-stack-poc` (the image name is
lower-cased from `${{ github.repository }}` because GHCR requires lower-case).

| Tag                | Meaning                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `:production-main` | Primary deployable tag — what the K8s manifests/docs reference         |
| `:<git-sha>`       | Immutable, traceable — **pin this in `deployment.yaml` for a rollout** |
| `:latest`          | Optional convenience pointer only — not a deploy target                |

## Required GitHub Secrets & Variables

Configure these in **Settings → Secrets and variables → Actions** before the
pipelines can fully run.

| Name                                   | Type         | Used by                       | Notes                                          |
| -------------------------------------- | ------------ | ----------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Secret       | both builds, docker build-arg | Public-safe, but stored as a secret for parity |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Secret       | both builds, docker build-arg | Public-safe                                    |
| `DATABASE_URL`                         | Secret       | E2E                           | Pooled (6543)                                  |
| `DIRECT_URL`                           | Secret       | E2E                           | Session (5432)                                 |
| `SUPABASE_SERVICE_ROLE_KEY`            | Secret       | E2E                           | Server-only                                    |
| `STRIPE_SECRET_KEY`                    | Secret       | E2E                           | Test key only                                  |
| `STRIPE_WEBHOOK_SECRET`                | Secret       | E2E                           | Test webhook secret                            |
| `TEST_USER_EMAIL`                      | Secret       | E2E                           | Playwright sign-in                             |
| `TEST_USER_PASSWORD`                   | Secret       | E2E                           | Playwright sign-in                             |
| `E2E_ENABLED`                          | **Variable** | `tests` e2e gate              | Set to `'true'` to enable the E2E job          |
| `GITHUB_TOKEN`                         | (built-in)   | GHCR push                     | Provided automatically; no setup               |

## ⚠️ Activation — getting `tests.yml` to run on `tests`

GitHub Actions fires a `push` workflow **only if the workflow file exists on the
pushed branch**. These workflows are authored on `feature/cicd-kubernetes`, cut
from `production-main`, so after the first merge they live on `production-main` —
**not yet on `tests`**.

**Recommended rollout (in order):**

1. `feature/cicd-kubernetes` → PR into **`production-main`**. The PR runs
   `production.yml`'s `verify` job. Merge it; the push to `production-main` then
   runs `verify` + the `docker` publish.
2. Bring the workflows onto `tests` by **merging `production-main` into `tests`**
   (`git checkout tests && git merge production-main`). `tests` already holds the
   code superset, so the merge is essentially additive (`.github/`,
   `app/api/health`, `k8s/`, docs). The next push/PR on `tests` then runs
   `tests.yml`.
3. Configure the Secrets/Variables above before step 1. Set `E2E_ENABLED=true`
   only once Supabase/Stripe test credentials are in place.

**Direction of flow:** `feature/cicd-kubernetes → production-main → (merge into) tests`.
Workflows originate on the infra branch and are pulled _into_ the validation
branch — never the reverse — which keeps the branch policy intact.

## Future Work (Not in Scope)

- **Deployment:** apply the `k8s/` manifests to a real cluster, or deploy the
  Next.js server to Vercel / AWS.
- **Registry:** GHCR → **ECR** on AWS (see `Kubernetes.md`).
- **Image scanning / SBOM, branch protection requiring these checks, caching the
  Docker layers** — follow-ups.
