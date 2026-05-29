# Pay-What-You-Want Document Download Site

A proof-of-concept full-stack web app. A visitor selects a document, enters any amount greater than $0, submits it, and receives a download button. No real payment processing — this is a PoC.

## Current Stack

- **Next.js 16.2.6** — App Router
- **React 19.2.4**
- **TypeScript 5.x** — strict mode
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **shadcn/ui** — radix-nova style, Radix UI primitives, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`
- **Lucide React** — icon library
- **Supabase** — auth (`@supabase/supabase-js`, `@supabase/ssr`)
- **Prisma 7.8.0** — ORM with `@prisma/adapter-pg` for pgBouncer compatibility
- **PostgreSQL** — via `pg` (node-postgres), transaction-mode pooler at runtime / session-mode pooler for CLI
- **Geist + Geist Mono** — loaded via `next/font/google`
- **ESLint 9** + **Prettier 3.x**

## What's Implemented

### Pages & Routing
- **Landing page** (`app/page.tsx`) — hero section, primary CTA linking to `/documents`, three-step explanation section, responsive down to 360px
- **Documents page** (`app/documents/page.tsx`) — fetches from `/api/documents`, renders document cards with inline payment flow and loading skeletons
- **Login page** (`app/auth/login/page.tsx`) — email/password form and Google OAuth button
- **Register page** (`app/auth/register/page.tsx`) — email, password, and confirm-password fields
- **Auth callback** (`app/auth/callback/route.ts`) — exchanges Supabase OAuth code for a session, redirects on success/error

### API Routes
- `GET /api/documents` — returns all documents ordered by creation date
- `GET /api/documents/[id]` — returns a single document; 400 on invalid ID, 404 on missing
- `POST /api/submissions` — records a purchase (requires auth); validates amount > 0
- `GET /api/submissions/[id]` — checks if the current user owns a document (requires auth)
- `GET /api/download/[documentId]` — verifies ownership then returns a 1-hour Supabase Storage signed URL (requires auth)

### Components
- **Layout** — `components/site-header.tsx` (nav links + user auth dropdown), `components/site-footer.tsx`, `components/wordmark.tsx`
- **Documents** — `components/documents/DocumentItem.tsx` (card with title, description, category, suggested price), `components/documents/DocumentItemSkeleton.tsx`, `components/documents/PaymentForm.tsx` (dialog with amount input)
- **UI primitives** — `avatar`, `button`, `card`, `dialog`, `dropdown-menu`, `field`, `input`, `input-group`, `label`, `separator`, `skeleton`, `textarea`

### Library & Data Layer
- **Prisma client** (`lib/prisma.ts`) — singleton with `PrismaPg` adapter; uses `DATABASE_URL` (transaction-mode pooler) at runtime
- **Document queries** (`lib/documents.ts`) — `getAllDocuments()`, `getDocumentById(id)`; serializes `Decimal` and `Date` types for JSON transport
- **Auth helpers** (`lib/auth.ts`) — `signInWithEmail`, `signUpWithEmail`, `signOut`, `continueWithGoogle`
- **Submission queries** (`lib/submissions.ts`) — `createSubmission()`, `checkSubmission()`
- **Supabase clients** — `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server/cookie-based), `lib/supabase/admin.ts` (service-role for Storage)
- **Types** (`lib/types.ts`) — `Document`, `Submission`
- **Utilities** (`lib/utils.ts`) — `cn()` helper

### Database
- **Schema** (`prisma/schema.prisma`) — `documents` and `submissions` models; `submissions.user_id` is a plain `@db.Uuid` field — the FK to `auth.users` is enforced at the DB level by Supabase, not as a Prisma relation
- **Config** (`prisma.config.ts`) — dual-URL setup: `DIRECT_URL` (session-mode, port 5432) for CLI operations; `DATABASE_URL` (transaction-mode pooler) injected at runtime via `PrismaClient` constructor
- **Generated client** — output to `lib/generated/prisma/`

> **Prisma + Supabase schema rule:** `prisma db pull` will always fail on this project because `submissions_user_id_fkey` crosses from the `public` schema into Supabase's `auth` schema. Adding `auth` to the datasource `schemas` list triggers multi-schema mode, which then requires `@@schema(...)` on every model. **Do not use `db pull`.** Make schema changes in two steps instead: (1) edit `prisma/schema.prisma` manually, (2) apply the SQL change in Supabase (dashboard or `prisma migrate dev` for `public`-only changes), then run `npx prisma generate`.

## What's Planned (Not Yet Built)

- Real payment processing (Stripe, etc.)
- Backend validation and tests
- Route protection middleware

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create `.env.local`

Create a `.env.local` file in the project root with the following variables. Get these values from your [Supabase project dashboard](https://supabase.com/dashboard) under **Project Settings → API** and **Project Settings → Database**.

```env
# Database — get from Supabase: Project Settings → Database → Connection string
# Use "Transaction" mode URL (port 6543) for DATABASE_URL
# Use "Session" mode URL (port 5432) for DIRECT_URL
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-1-us-west-1.pooler.supabase.com:5432/postgres"

# Supabase — get from Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Service role key — get from Project Settings → API → "service_role" (keep secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> **Never commit `.env.local`** — it contains secrets. It is already in `.gitignore`.

### 3. Generate Prisma client

```bash
npx prisma generate
```

Run this after install and any time `prisma/schema.prisma` changes.

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables reference

| Variable | Used by | Where to get it |
|---|---|---|
| `DATABASE_URL` | Runtime (`lib/prisma.ts`) | Supabase → Database → Connection string → Transaction mode (port 6543) |
| `DIRECT_URL` | CLI (`prisma.config.ts`) | Supabase → Database → Connection string → Session mode (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase clients | Supabase → Project Settings → API → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | Supabase → Project Settings → API → `service_role` key — **never expose to the client** |

## Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Serve production build
pnpm lint             # ESLint
pnpm format           # Prettier — auto-fix
pnpm format:check     # Prettier — check only
npx prisma generate   # Re-generate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create + apply a migration (uses DIRECT_URL)
# NOTE: npx prisma db pull is NOT supported — see "Prisma + Supabase schema rule" above
```

## Project Structure

```
app/
  layout.tsx              # Root layout — font loading, metadata, header/footer
  page.tsx                # Landing page — hero, steps
  globals.css             # Tailwind import + CSS variable definitions
  documents/
    page.tsx              # Documents page — listing and payment flow
  auth/
    login/page.tsx        # Login — email/password + Google OAuth
    register/page.tsx     # Registration — email, password, confirm
    callback/route.ts     # Supabase OAuth callback handler
  api/
    documents/
      route.ts            # GET /api/documents
      [id]/route.ts       # GET /api/documents/[id]
    submissions/
      route.ts            # POST /api/submissions
      [id]/route.ts       # GET /api/submissions/[id]
    download/
      [documentId]/route.ts  # GET /api/download/[documentId]
components/
  wordmark.tsx            # Green dot + "Openleaf" brand mark
  site-header.tsx         # Header with nav links and user dropdown
  site-footer.tsx         # Footer with copyright line
  documents/
    DocumentItem.tsx      # Document card + payment dialog trigger
    DocumentItemSkeleton.tsx  # Loading skeleton
    PaymentForm.tsx       # Pay-what-you-want dialog
  ui/                     # shadcn/ui primitives
    avatar.tsx | button.tsx | card.tsx | dialog.tsx | dropdown-menu.tsx
    field.tsx | input.tsx | input-group.tsx | label.tsx | separator.tsx
    skeleton.tsx | textarea.tsx
lib/
  prisma.ts               # PrismaClient singleton with PG adapter
  documents.ts            # getAllDocuments, getDocumentById
  submissions.ts          # createSubmission, checkSubmission
  auth.ts                 # Supabase auth helpers
  types.ts                # Document, Submission types
  utils.ts                # cn() helper
  generated/prisma/       # Auto-generated Prisma client (do not edit; run npx prisma generate)
  supabase/
    client.ts             # Supabase browser client
    server.ts             # Supabase server client (cookies)
    admin.ts              # Service-role client for Storage signed URLs
prisma/
  schema.prisma           # DB schema — documents, submissions (user_id as plain UUID, FK owned by Supabase)
prisma.config.ts          # Prisma CLI config — dual-URL, migrations path
proxy.ts                  # Next.js middleware — Supabase session refresh
```
