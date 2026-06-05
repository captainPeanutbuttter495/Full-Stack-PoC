# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────────────────────
# Local containerization for the Next.js app (PoC).
# Multi-stage build → small standalone runtime image. pnpm + Node 22 LTS.
#
# Build-time:  only public NEXT_PUBLIC_* values are passed (safe to expose).
# Runtime:     all secrets are injected at `docker run` via --env-file .env.local.
#              See README "Run with Docker".
# ──────────────────────────────────────────────────────────────────────────────

# ---- deps: install dependencies from the lockfile ----------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Use the exact pnpm pinned in package.json's "packageManager" field. Corepack
# provisions it on first use; disable the interactive download prompt so the
# non-interactive Docker build doesn't hang. Pinning the version is what makes
# pnpm honor the allowBuilds approval map in pnpm-workspace.yaml.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Only copy manifests first so this layer caches unless deps change.
# pnpm-workspace.yaml carries the build-script approval config.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: generate Prisma client + build the app -------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public, browser-exposed values must be present at `next build` time because
# Next.js inlines NEXT_PUBLIC_* into the client bundle. Changing these requires
# a rebuild. Never pass server-only secrets here.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_TELEMETRY_DISABLED=1

# lib/generated/prisma is gitignored, so regenerate the client inside the image.
RUN npx prisma generate
RUN pnpm build

# ---- runner: minimal standalone runtime image --------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone output bundles a minimal traced node_modules + server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
