# Pay-What-You-Want Document Download Site

A proof-of-concept full-stack web app. A visitor selects a document, enters any amount greater than $0, submits it, and receives a download button. No real payment processing — this is a PoC.

## Current Stack

- **Next.js 16.2.6** — App Router
- **React 19.2.4**
- **TypeScript 5.x** — strict mode
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **shadcn/ui** — Radix UI primitives + `class-variance-authority`, `clsx`, `tailwind-merge`
- **Lucide React** — icon library
- **Supabase** — auth and database (`@supabase/supabase-js`, `@supabase/ssr`)
- **Geist + Geist Mono** — loaded via `next/font/google`
- **ESLint 9** + **Prettier 3.x**

## What's Implemented

- **Landing page** (`app/page.tsx`) — hero section, primary CTA linking to `/documents`, three-step explanation section, responsive down to 360px
- **Documents page** (`app/documents/page.tsx`) — document listing and inline payment flow
- **Shared components** — `components/wordmark.tsx`, `components/site-header.tsx` (with `activePage` prop), `components/site-footer.tsx`
- **UI primitives** — `components/ui/button.tsx` (shadcn Button)
- **Supabase integration** — `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server-side), `lib/supabase/proxy.ts` + `proxy.ts`
- **Utilities** — `lib/utils.ts` (`cn` helper)
- **Design system** — global CSS variables for colors and typography; Tailwind utility classes with an oklch color palette and Geist typeface

## What's Planned (Not Yet Built)

- Prisma + PostgreSQL (Docker) for data persistence
- API routes: `GET /api/documents`, `GET /api/documents/[id]`, `POST /api/submissions`
- Backend validation and tests
- Static mock PDF downloads in `public/files/`

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint
pnpm format       # Prettier — auto-fix
pnpm format:check # Prettier — check only
```

## Project Structure

```
app/
  layout.tsx          # Root layout — font loading, metadata
  page.tsx            # Landing page — hero, steps
  globals.css         # Tailwind import + CSS variable definitions
  documents/
    page.tsx          # Documents page — listing and payment flow
components/
  wordmark.tsx        # Green dot + "Openleaf" brand mark
  site-header.tsx     # Header with nav links (reusable across pages)
  site-footer.tsx     # Footer with copyright line
  ui/
    button.tsx        # shadcn Button primitive
lib/
  utils.ts            # cn() helper (clsx + tailwind-merge)
  supabase/
    client.ts         # Supabase browser client
    server.ts         # Supabase server client
    proxy.ts          # Supabase proxy helper
proxy.ts              # Proxy server entry point
```
