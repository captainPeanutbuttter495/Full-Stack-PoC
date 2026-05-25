# Pay-What-You-Want Document Download Site

A proof-of-concept full-stack web app. A visitor selects a document, enters any amount greater than $0, submits it, and receives a download button. No real payment processing — this is a PoC.

## Current Stack

- **Next.js 16.2.6** — App Router
- **React 19.2.4**
- **TypeScript 5.x** — strict mode
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Geist + Geist Mono** — loaded via `next/font/google`
- **ESLint 9** + **Prettier 3.x**

## What's Implemented

- **Landing page** (`app/page.tsx`) — hero section, primary CTA linking to `/documents`, three-step explanation section, responsive down to 360px
- **Shared components** — `components/wordmark.tsx`, `components/site-header.tsx` (with `activePage` prop), `components/site-footer.tsx`
- **Design system** — Tailwind utility classes with arbitrary values matching the Claude Design prototype (oklch color palette, Geist typography)

## What's Planned (Not Yet Built)

- `/documents` page with document grid and inline payment flow
- Prisma + PostgreSQL (Docker) for data persistence
- API routes: `GET /api/documents`, `GET /api/documents/[id]`, `POST /api/submissions`
- Backend validation and tests
- Static mock PDF downloads in `public/files/`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npm run format       # Prettier — auto-fix
npm run format:check # Prettier — check only
```

## Project Structure

```
app/
  layout.tsx       # Root layout — font loading, metadata
  page.tsx         # Landing page — hero, steps
  globals.css      # Tailwind import + @theme (font config)
components/
  wordmark.tsx     # Green dot + "Openleaf" brand mark
  site-header.tsx  # Header with nav links (reusable across pages)
  site-footer.tsx  # Footer with copyright line
```
