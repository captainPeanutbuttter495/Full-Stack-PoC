The landing page is the entry point of the Pay-What-You-Want PoC. It explains the concept and directs visitors to browse documents.

**Route:** `/` (`app/page.tsx`)

## Components

| Component    | File                         | Reusable | Description                                             |
| ------------ | ---------------------------- | -------- | ------------------------------------------------------- |
| `Home`       | `app/page.tsx`               | No       | Page composition — assembles header, hero, footer       |
| `Hero`       | `app/page.tsx` (inline)      | No       | Eyebrow, display heading, lede, CTA, three-step section |
| `SiteHeader` | `components/site-header.tsx` | Yes      | Wordmark + nav links; accepts `activePage` prop         |
| `SiteFooter` | `components/site-footer.tsx` | Yes      | Copyright line                                          |
| `Wordmark`   | `components/wordmark.tsx`    | Yes      | Green accent dot + "Openleaf" text                      |

## Layout

The page uses a flex column layout with `min-h-screen`. Content is capped at `1120px` max-width and centered. The footer pins to the bottom via `mt-auto`.

**Desktop** (> 640px):

- Page padding: `32px` top, `40px` sides, `24px` bottom
- Three-step section: three-column grid
- Display heading scales via `clamp(40px, 5.4vw, 64px)`

**Mobile** (≤ 640px):

- Page padding: `20px` top, `18px` sides, `16px` bottom
- Three-step section: single column
- Display heading: fixed `40px`
- No horizontal scrollbar at 360px minimum width

## Design Tokens

All colors use oklch and are applied as arbitrary Tailwind values — no custom CSS classes.

| Token      | Value                   | Usage                           |
| ---------- | ----------------------- | ------------------------------- |
| Background | `oklch(0.985 0.005 95)` | Page background                 |
| Ink        | `oklch(0.2 0.012 80)`   | Primary text                    |
| Ink-2      | `oklch(0.32 0.012 80)`  | Lede / secondary text           |
| Muted      | `oklch(0.52 0.012 80)`  | Eyebrow, microcopy, step desc   |
| Accent     | `oklch(0.45 0.13 155)`  | CTA button, wordmark dot        |
| Accent-ink | `oklch(0.97 0.02 155)`  | CTA button text                 |
| Line       | `oklch(0.9 0.006 95)`   | Borders (header, footer, steps) |
| Line-2     | `oklch(0.85 0.008 95)`  | Step number badge border        |

## Typography

| Role       | Font       | Size / Weight                    |
| ---------- | ---------- | -------------------------------- |
| Display    | Geist      | `clamp(40px, 5.4vw, 64px)` / 500 |
| Lede       | Geist      | 17px / 400                       |
| Body       | Geist      | 15px / 400                       |
| Eyebrow    | Geist Mono | 11px uppercase, 0.08em tracking  |
| Microcopy  | Geist Mono | 11px                             |
| Step title | Geist      | 15px / 500                       |
| Step desc  | Geist      | 13.5px / 400                     |
| CTA button | Geist      | 14.5px / 500                     |

## Hero Content

- **Eyebrow:** "A small experiment in fair pricing"
- **Heading:** "Pay what you think it's worth."
- **Lede:** "Choose a document, enter any amount greater than $0, and unlock the download. No accounts, no upsells."
- **CTA:** "Browse Documents →" — links to `/documents` (not yet built)
- **Meta:** "6 seeded documents · proof of concept"

## Three-Step Section

Summarizes the core user flow from the SRS.

| Step | Badge | Title           | Description                                           |
| ---- | ----- | --------------- | ----------------------------------------------------- |
| 1    | 01    | Browse          | Skim the library and open anything that looks useful. |
| 2    | 02    | Name your price | Type any amount over $0 — a dollar, ten, fifty.       |
| 3    | 03    | Download        | Submit and the file unlocks. That's the whole flow.   |

## SRS Coverage

| SRS Requirement | Description                     | Status      |
| --------------- | ------------------------------- | ----------- |
| 1.1.1           | Landing page with hero section  | Implemented |
| 1.1.2           | Primary CTA to browse documents | Implemented |
| 1.1.3           | Responsive down to 360px        | Implemented |
