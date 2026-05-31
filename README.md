# Pay-What-You-Want Document Download Site

A proof-of-concept full-stack web app. A visitor selects a document, enters any amount greater than $0.50, pays via Stripe Checkout, and receives a download button. The file is only unlocked after the webhook confirms payment server-side.

## Current Stack

- **Next.js 16.2.6** — App Router
- **React 19.2.4**
- **TypeScript 5.x** — strict mode
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **shadcn/ui** — radix-nova style, Radix UI primitives, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`
- **Framer Motion** (`motion/react`) — page animations
- **Lucide React** — icon library
- **Supabase** — auth (`@supabase/supabase-js`, `@supabase/ssr`) and Storage (signed download URLs)
- **Stripe** — Checkout Sessions, webhook event handling, refund revocation
- **Prisma 7.8.0** — ORM with `@prisma/adapter-pg` for pgBouncer compatibility
- **PostgreSQL** — via `pg` (node-postgres), transaction-mode pooler at runtime / session-mode pooler for CLI
- **Geist + Geist Mono** — loaded via `next/font/google`
- **ESLint 9** + **Prettier 3.x**

## What's Implemented

### Pages & Routing
- **Landing page** (`app/page.tsx`) — hero, features, CTA
- **Documents page** (`app/documents/page.tsx`) — document cards with inline payment flow and loading skeletons
- **Success page** (`app/documents/success/page.tsx`) — retrieves the Stripe session server-side, shows document title, amount paid, and download button
- **Login page** (`app/auth/login/page.tsx`) — email/password form and Google OAuth button
- **Register page** (`app/auth/register/page.tsx`) — email, password, and confirm-password fields
- **Auth callback** (`app/auth/callback/route.ts`) — exchanges Supabase OAuth code for a session

### API Routes
- `GET /api/documents` — returns all documents ordered by creation date
- `GET /api/documents/[id]` — returns a single document; 400 on invalid ID, 404 on missing
- `POST /api/stripe/checkout` — creates a Stripe Checkout Session; requires auth; validates amount ≥ $0.50; embeds `document_id` and `user_id` in session metadata
- `POST /api/stripe/webhook` — handles `checkout.session.completed` (creates submission) and `charge.refunded` (marks submission as refunded); validates Stripe signature
- `GET /api/submissions/[id]` — checks if the current user owns a document (requires auth)
- `GET /api/download/[documentId]` — verifies ownership then returns a 1-hour Supabase Storage signed URL (requires auth)

### Payment Flow
1. User clicks **Select** on a document card → `PaymentForm` dialog opens
2. User enters an amount (≥ $0.50) and submits → `POST /api/stripe/checkout` creates a Session and returns its URL
3. User is redirected to Stripe-hosted Checkout
4. On success → redirected to `/documents/success?session_id=...`
5. Stripe sends `checkout.session.completed` to `/api/stripe/webhook` → submission row created in DB with `stripe_session_id` and `stripe_payment_intent_id`
6. Download button calls `GET /api/download/[documentId]` → server checks submission exists and is `active`, then returns a signed URL
7. If a charge is refunded, `charge.refunded` webhook fires → submission status set to `refunded`, revoking download access

### Components
- **Layout** — `components/site-header.tsx` (nav, scroll-based border, user dropdown), `components/site-footer.tsx`, `components/wordmark.tsx`
- **Landing page** — `components/landing-page/` (split into `hero-section`, `features-section`, `cta-section`, `primitives`)
- **Documents** — `components/documents/DocumentItem.tsx`, `DocumentItemSkeleton.tsx`, `PaymentForm.tsx`, `DownloadButton.tsx`
- **UI primitives** — `avatar`, `button`, `card`, `dialog`, `dropdown-menu`, `field`, `input`, `input-group`, `label`, `separator`, `skeleton`, `textarea`

### Library & Data Layer
- **Prisma client** (`lib/prisma.ts`) — singleton with `PrismaPg` adapter; uses `DATABASE_URL` at runtime
- **Document queries** (`lib/documents.ts`) — `getAllDocuments()`, `getDocumentById(id)`
- **Auth helpers** (`lib/auth.ts`) — `signInWithEmail`, `signUpWithEmail`, `signOut`, `continueWithGoogle`
- **Submission queries** (`lib/submissions.ts`) — `createSubmission()`, `checkSubmission()`, `revokeSubmission()`
- **Supabase clients** — `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server/cookie-based), `lib/supabase/admin.ts` (service-role for Storage)

### Database
- **Schema** (`prisma/schema.prisma`) — `documents` and `submissions` models; `submissions` stores `stripe_session_id`, `stripe_payment_intent_id`, and `status` (`active` | `refunded`)
- **Config** (`prisma.config.ts`) — dual-URL: `DIRECT_URL` (session-mode, port 5432) for CLI; `DATABASE_URL` (transaction-mode pooler) at runtime

> **Prisma + Supabase schema rule:** `prisma db pull` will always fail because `submissions_user_id_fkey` crosses from `public` into Supabase's `auth` schema. **Do not use `db pull`.** Make schema changes by editing `prisma/schema.prisma` manually, applying the SQL in Supabase, then running `npx prisma generate`.

## What's Planned

- Backend validation tests
- Route protection middleware

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create `.env.local`

```env
# ── Database ────────────────────────────────────────────────────────────────
# Supabase → Project Settings → Database → Connection string
# Transaction mode (port 6543) for runtime:
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Session mode (port 5432) for Prisma CLI:
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-1-us-west-1.pooler.supabase.com:5432/postgres"

# ── Supabase ─────────────────────────────────────────────────────────────────
# Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Service role key — never expose to the client:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ── Stripe ───────────────────────────────────────────────────────────────────
# Stripe Dashboard → Developers → API keys
STRIPE_SECRET_KEY=sk_test_...
# Stripe Dashboard → Developers → Webhooks → signing secret
# (use the Stripe CLI secret when running locally — see step 4)
STRIPE_WEBHOOK_SECRET=whsec_...
```

> **Never commit `.env.local`** — it is already in `.gitignore`.

### 3. Generate Prisma client

```bash
npx prisma generate
```

Run this after install and whenever `prisma/schema.prisma` changes.

### 4. Set up Stripe webhooks (local dev)

Stripe delivers webhook events to a public URL. In development, use the Stripe CLI to forward them to your local server.

**Install the Stripe CLI** (if not already):
```bash
brew install stripe/stripe-cli/stripe
```

**Log in:**
```bash
stripe login
```

**Start forwarding:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a webhook signing secret that starts with `whsec_`. Copy it into `.env.local` as `STRIPE_WEBHOOK_SECRET`. **This secret is different from the one in the Stripe Dashboard** — use the CLI one for local dev and the Dashboard one for production.

Keep this terminal open while developing; it must be running for the webhook to fire after a test payment.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Test card numbers** (no real money):

| Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 9995` | Card declined |

Use any future expiry, any 3-digit CVC, and any postcode.

### 6. Set up Stripe webhooks (production)

1. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. Set the URL to `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `charge.refunded`
4. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET` in your production environment

### Environment variables reference

| Variable | Used by | Where to get it |
|---|---|---|
| `DATABASE_URL` | Runtime (`lib/prisma.ts`) | Supabase → Database → Connection string → Transaction mode (port 6543) |
| `DIRECT_URL` | CLI (`prisma.config.ts`) | Supabase → Database → Connection string → Session mode (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase clients | Supabase → Project Settings → API → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | Supabase → Project Settings → API → `service_role` key |
| `STRIPE_SECRET_KEY` | `app/api/stripe/` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | `app/api/stripe/webhook/route.ts` | Stripe CLI (`stripe listen`) for local; Stripe Dashboard → Webhooks for production |

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
stripe listen --forward-to localhost:3000/api/stripe/webhook  # Forward webhooks locally
# NOTE: npx prisma db pull is NOT supported — see schema rule above
```

## Project Structure

```
app/
  layout.tsx                    # Root layout — fonts, metadata, header/footer
  page.tsx                      # Landing page — composes landing-page sections
  globals.css                   # Tailwind import + CSS variable definitions
  documents/
    page.tsx                    # Documents listing with payment flow
    success/page.tsx            # Post-payment success page with download button
  auth/
    login/page.tsx              # Login — email/password + Google OAuth
    register/page.tsx           # Registration
    callback/route.ts           # Supabase OAuth callback handler
  api/
    stripe/
      checkout/route.ts         # POST — create Stripe Checkout Session
      webhook/route.ts          # POST — handle checkout.session.completed, charge.refunded
    documents/
      route.ts                  # GET /api/documents
      [id]/route.ts             # GET /api/documents/[id]
    submissions/
      [id]/route.ts             # GET /api/submissions/[id]
    download/
      [documentId]/route.ts     # GET — verify ownership, return signed URL
components/
  wordmark.tsx                  # Brand mark
  site-header.tsx               # Nav, scroll-based border, auth dropdown
  site-footer.tsx               # Footer
  landing-page/
    primitives.tsx              # ease, Reveal, Eyebrow, SectionTag
    hero-section.tsx            # Hero copy + floating card visual
    features-section.tsx        # Feature cards grid
    cta-section.tsx             # Final CTA
  documents/
    DocumentItem.tsx            # Document card + payment dialog trigger
    DocumentItemSkeleton.tsx    # Loading skeleton
    PaymentForm.tsx             # Pay-what-you-want dialog → Stripe redirect
    DownloadButton.tsx          # Calls /api/download/[id], triggers file download
  ui/                           # shadcn/ui primitives
lib/
  prisma.ts                     # PrismaClient singleton with PG adapter
  documents.ts                  # getAllDocuments, getDocumentById
  submissions.ts                # createSubmission, checkSubmission, revokeSubmission
  auth.ts                       # Supabase auth helpers
  types.ts                      # Document, Submission types
  utils.ts                      # cn() helper
  generated/prisma/             # Auto-generated Prisma client (do not edit)
  supabase/
    client.ts                   # Browser client
    server.ts                   # Server client (cookies)
    admin.ts                    # Service-role client for Storage signed URLs
prisma/
  schema.prisma                 # documents + submissions (stripe_session_id, stripe_payment_intent_id, status)
prisma.config.ts                # Dual-URL Prisma CLI config
proxy.ts                        # Next.js middleware — Supabase session refresh
```
