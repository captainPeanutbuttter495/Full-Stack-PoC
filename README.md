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

### Components
- **Layout** — `components/site-header.tsx` (nav links + user auth dropdown), `components/site-footer.tsx`, `components/wordmark.tsx`
- **Documents** — `components/documents/DocumentItem.tsx` (card with title, description, category, suggested price), `components/documents/DocumentItemSkeleton.tsx`, `components/documents/PaymentForm.tsx` (dialog with amount input)
- **UI primitives** — `avatar`, `button`, `card`, `dialog`, `dropdown-menu`, `field`, `input`, `input-group`, `label`, `separator`, `skeleton`, `textarea`

### Library & Data Layer
- **Prisma client** (`lib/prisma.ts`) — singleton with `PrismaPg` adapter; uses `DATABASE_URL` (transaction-mode pooler) at runtime
- **Document queries** (`lib/documents.ts`) — `getAllDocuments()`, `getDocumentById(id)`; serializes `Decimal` and `Date` types for JSON transport
- **Auth helpers** (`lib/auth.ts`) — `signInWithEmail`, `signUpWithEmail`, `signOut`, `continueWithGoogle`
- **Supabase clients** — `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server/cookie-based), `lib/supabase/proxy.ts` (session middleware)
- **Types** (`lib/types.ts`) — `Document`, `Submission`
- **Utilities** (`lib/utils.ts`) — `cn()` helper

### Database
- **Schema** (`prisma/schema.prisma`) — `documents` and `submissions` models
- **Config** (`prisma.config.ts`) — dual-URL setup: `DIRECT_URL` (session-mode, port 5432) for CLI operations; `DATABASE_URL` (transaction-mode pooler) injected at runtime via `PrismaClient` constructor
- **Generated client** — output to `lib/generated/prisma/`

## What's Planned (Not Yet Built)

- `POST /api/submissions` API route
- Backend validation and tests
- Static mock PDF downloads in `public/files/`

## Getting Started

```bash
pnpm install
npx prisma generate   # generate Prisma client (required after install)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Runtime (`lib/prisma.ts`) | Transaction-mode pgBouncer pooler |
| `DIRECT_URL` | CLI (`prisma.config.ts`) | Session-mode pooler for migrations/db pull |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase clients | Public anon key |

## Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Serve production build
pnpm lint             # ESLint
pnpm format           # Prettier — auto-fix
pnpm format:check     # Prettier — check only
npx prisma generate   # Re-generate Prisma client after schema changes
npx prisma migrate    # Run migrations (uses DIRECT_URL)
npx prisma db pull    # Introspect DB and update schema (uses DIRECT_URL)
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
  documents.ts            # Server actions: getAllDocuments, getDocumentById
  auth.ts                 # Supabase auth helpers
  types.ts                # Document, Submission types
  utils.ts                # cn() helper
  generated/prisma/       # Auto-generated Prisma client (do not edit)
  supabase/
    client.ts             # Supabase browser client
    server.ts             # Supabase server client (cookies)
    proxy.ts              # Session middleware helper
prisma/
  schema.prisma           # DB schema — documents, submissions models
prisma.config.ts          # Prisma CLI config — dual-URL, migrations path
proxy.ts                  # Next.js middleware — Supabase session refresh
```
