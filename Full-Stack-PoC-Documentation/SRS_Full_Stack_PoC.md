**Software Requirements Specification — Full Stack PoC**

*Pay-What-You-Want Document Download Site*

| Target release        | 1.0                           |
| :-------------------- | :---------------------------- |
| **Document status**   | IN PROGRESS                   |
| **Document owner**    | Matthew Garcia                |
| **Technical writers** | Matthew Garcia, Duane Cabahug |
| **Last updated**      | 2026-06-04                    |

# **1\. Introduction**

*Authors: Matthew Garcia, Duane Cabahug*

## **1.1 Purpose**

This document specifies the software requirements for a proof-of-concept pay-what-you-want document download website. The web app allows visitors to browse a catalog of digital documents, choose an amount they are willing to pay (greater than $0), submit that amount, and receive access to download the document.

The scope of this SRS covers the full PoC: frontend pages, backend API, data model, auth flow, validation behavior, and the supporting documentation deliverables (architecture diagram, ERD, API doc, test results, security and scalability notes). Real payment processing and admin functionality are out of scope. User authentication via Supabase (email/password and Google OAuth) has been added to scope and is implemented.

## **1.2 Intended Audience and Intended Use**

This SRS is intended for the following readers:

* The project reviewer (Leo), will use this document to evaluate engineering judgment, scope discipline, and the rationale behind technical decisions.

* The development team (Matthew and Duane), will use this document as the source of truth for what the system must do and what is explicitly out of scope.

* Future readers (peers, instructors, prospective employers reviewing the repository on GitHub), who will use this document to understand the system without reading the code.

## **1.3 Product Scope**

The system is a web application with one core user loop: browse documents → select one → enter an amount \> $0 → submit → receive a download button. Users may optionally create an account or sign in with Google; their identity is then attached to submissions. The goal is to prove the team can plan, build, test, document, and iterate on a working full-stack application within a two-week timeline.

The system is not a production product. Real payments, file uploads, and email receipts are intentionally excluded so the team can demonstrate depth on the core loop rather than breadth on integrations. The architecture is designed to extend cleanly to those integrations (see Section 7\) without requiring rework.

## **1.4 Definitions, Acronyms and Abbreviations**

* **PoC:** Proof of Concept. A working prototype intended to demonstrate technical feasibility and engineering judgment, not to ship to production.

* **PWYW:** Pay What You Want. A pricing model in which the buyer chooses the price, typically with a non-zero minimum.

* **RSC:** React Server Component. A Next.js App Router primitive that renders on the server and streams to the client without shipping its JavaScript.

* **ORM:** Object-Relational Mapper. In this project, Prisma.

* **ERD:** Entity Relationship Diagram. Visual representation of database tables and their relationships.

* **CTA:** Call to Action. A prominent UI element prompting the user to take the next step in a flow.

* **OAuth:** Open Authorization. A delegated authorization protocol; used here for Google sign-in via Supabase.

## **1.5 References**

* Full Stack PoC Assignment brief, Leo Jacinto Magtibay, May 22 – June 8, 2026\.

* Next.js App Router documentation: https://nextjs.org/docs/app

* Prisma ORM documentation: [https://www.prisma.io/docs](https://www.prisma.io/docs)

* Supabase documentation: https://supabase.com/docs

* Tailwind CSS documentation: https://tailwindcss.com/docs

* Vitest documentation: https://vitest.dev

* PostgreSQL 16 documentation: https://www.postgresql.org/docs/16/index.html

# **2\. Overall Description**

*Authors: Matthew Garcia, Duane Cabahug*

## **2.1 Product Perspective**

The system is a new, self-contained product. It is not a follow-on member of a product family and does not replace an existing system.

External actors in the current implementation:

* **End user** — a browser client interacting with the Next.js frontend and API routes.
* **Reviewer** — a browser, plus direct database inspection via Prisma Studio or psql.
* **Supabase** — external service providing PostgreSQL hosting, connection pooling (pgBouncer), and the authentication layer (email/password, Google OAuth, session cookies).

The Supabase `auth.users` table is managed entirely by Supabase and is not accessible via the Prisma schema. The `submissions.user_id` column holds a UUID foreign key to `auth.users`; this constraint is enforced at the database level by Supabase, not declared as a Prisma relation (see Section 3.6 and the schema note in Section 3.2).

## **2.2 Product Functions**

High-level summary of functions.

* **Landing page:** Explains the PWYW model and provides a single CTA to begin the flow.

* **Documents browse:** Displays all available documents with title, description, category, and suggested price.

* **Document selection and payment:** Allows the user to select a document and enter an amount inline via a dialog.

* **Authentication:** Users can create an account (email/password) or sign in with Google OAuth. The header shows the user's email and a sign-out option when authenticated; a "Sign in" button otherwise. Authenticated sessions are refreshed on every request via Next.js middleware.

* **Submission validation:** Server-side enforcement that the amount is a number greater than zero and that the referenced document exists.

* **Submission persistence:** Each valid submission is recorded as a Submission row linked to its Document via foreign key. The authenticated user's ID is stored in `user_id` if present.

* **Download access:** On successful submission, the UI reveals a download button. The PoC returns the file URL directly from the submission response.

## **2.3 User Classes and Characteristics**

Two user classes exist based on authentication state:

* **Unauthenticated visitor:** Can browse the landing page. The `/documents` page requires authentication; unauthenticated visitors are redirected. Can navigate to `/auth/login` or `/auth/register`.

* **Authenticated user:** Has completed email/password registration or Google OAuth. The header displays their email initial as an avatar. Their `user_id` (Supabase UUID) is attached to any submission they make. Can sign out from the header dropdown. Submissions require authentication; anonymous submissions are rejected with 401.

Within each class, two behavioral subtypes inform UI decisions:

* **First-time visitor:** Arrives at the landing page with no prior context. Needs to understand the PWYW model before acting.

* **Returning visitor:** Familiar with the flow; moves directly to `/documents` from the navbar.

## **2.4 Operating Environment**

* **Server runtime:** Node.js 20 LTS or later, running Next.js 16.2.6 with the App Router and Turbopack dev server.

* **Database:** PostgreSQL hosted on Supabase. Prisma 7.8.0 with `@prisma/adapter-pg` and pgBouncer transaction-mode pooling at runtime; session-mode pooling for CLI migrations. Schema managed via manual Prisma migrations — `prisma db pull` is explicitly unsupported (see Section 3.2 note).

* **Auth provider:** Supabase Auth (email/password + Google OAuth). Sessions managed server-side via `@supabase/ssr` cookies.

* **Client:** Any modern evergreen browser (Chrome, Firefox, Safari, Edge). Mobile Safari and Chrome on Android.

* **Development host:** Any OS with Node.js and pnpm installed. No Docker dependency — the database is Supabase-hosted, not local.

* **Production deployment target (future work, not in scope):** Vercel or AWS Lambda for the Next.js server; Supabase remains the database and auth provider.

## **2.5 Design and Implementation Constraints**

* **Frontend stack:** Next.js \+ Tailwind CSS v4

* **Backend approach:** Next.js Route Handlers

* **Database:** Supabase (PostgreSQL), Prisma 7.8.0

* **Auth:** Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`)

* **Two-week timeline:** May 22 – June 8, 2026\. This constrains scope more than any other factor. Stretch goals are only attempted after the core deliverables are complete.

* **Solo-pair development:** Matthew Garcia and Duane Cabahug. The documentation must be unambiguous for future readers.

* **AI tooling permitted:** Per the assignment, AI tools may be used freely, but the team is responsible for understanding all submitted code.

## **2.6 Assumptions and Dependencies**

Key assumptions underlying the requirements in this document:

* The user has Node.js and pnpm installed and can run `pnpm install` / `pnpm dev` from the `Full-Stack-PoC/` directory.

* A `.env.local` file with the four required environment variables (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) is present before running the app.

* An active internet connection to Supabase is required at runtime (database and auth are cloud-hosted).

* The team's prior experience with full stack development reduces the learning curve enough that two weeks is achievable without overscoping.

Why Next.js Route Handlers was chosen

* Co-location of frontend and backend in one repository reduces context-switching and deployment complexity. This allows for one build, one artifact, one process to run locally.

* Server components and route handlers in the same project allow read paths (document listings) to use direct Prisma calls during render, while write paths (submissions) remain proper HTTP endpoints that can be tested in isolation.

* Express was considered and rejected because it would introduce a second server, CORS configuration, and a second deployment artifact.

* Django, FastAPI, and Go were rejected because all the planned future integrations (Prisma, Supabase, Stripe, AWS SDK) have the most support in the Node.js ecosystem.

## **2.7 User Documentation**

N/A for end users. The system has no learning curve that warrants a user manual (one linear flow with a single CTA per step). Documentation delivered with the codebase serves the reviewer:

* README.md — setup, run, and test instructions, plus high-level architecture.

* This SRS — requirements specification.

* Architecture diagram and ERD — visual references for system shape and data model.

* API documentation — endpoint reference with request and response shapes.

* Security and scalability writeup — production-mode considerations not implemented in the PoC.

# **3\. System Features and Requirements**

*Authors: Matthew Garcia, Duane Cabahug*

Functional requirements are organized by user-facing features. Each system feature contains one or more user requirements. Each user requirement decomposes into system requirements that the implementation must satisfy. Mandatory requirements use 'shall'; desirable but non-blocking requirements use 'should'.

Implementation status is noted where the current state on branch `production-main` differs from the original specification.

## **3.1 System Feature 1 — Landing and Browse**

*Authors: Matthew Garcia, Duane Cabahug*

### **3.1.1 User Requirement: The user shall be able to view a landing page that explains the pay-what-you-want model.**

* System requirement 1.1.1: The route GET / shall render a page containing a hero section, an explanation of the PWYW model, and a primary CTA labeled 'Browse Documents'. **Status: Implemented.** The hero renders via the `Hero` component in `app/page.tsx` with the tagline "Pay what you think it's worth." and a three-step explainer.

* System requirement 1.1.2: The CTA shall link to /documents. **Status: Implemented.**

* System requirement 1.1.3: The landing page shall be usable at viewport widths of 360px and above without horizontal scrolling. **Status: Implemented.** Responsive layout via Tailwind `max-sm:` breakpoints down to 360px.

### **3.1.2 User Requirement: The user shall be able to view all available documents with their metadata.**

* System requirement 1.2.1: The route GET /documents shall render a list of all Document rows, displaying title, description, category, and suggested price for each. **Status: Implemented.**

* System requirement 1.2.2: ~~The page shall use server-side rendering with a direct Prisma query.~~ **Deviation:** The documents page (`app/documents/page.tsx`) is a `"use client"` component that fetches from `GET /api/documents` on mount using `useEffect`. Six skeleton placeholders (`DocumentItemSkeleton`) are shown during the loading state. Direct server-side Prisma access was not used; the API route is the data source.

* System requirement 1.2.3: Each document card shall include a 'Select' button that initiates the payment flow for that document. **Status: Implemented.** The `DocumentItem` card renders a "Select" button that opens a `PaymentForm` dialog.

* System requirement 1.2.4: The endpoint GET /api/documents shall exist and return document data as JSON. **Status: Implemented.** Returns all documents ordered by `created_at DESC`. `Decimal` fields are serialized to `number`; `Date` fields to ISO 8601 strings.

## **3.2 System Feature 2 — Document Selection and Payment**

*Authors: Matthew Garcia, Duane Cabahug*

**Schema note:** `prisma db pull` is not supported on this project. The `submissions_user_id_fkey` foreign key crosses from the `public` schema into Supabase's `auth` schema, which breaks Prisma's introspection. Schema changes must be made by (1) editing `prisma/schema.prisma` manually, (2) applying the SQL in the Supabase dashboard or via `prisma migrate dev`, then (3) running `npx prisma generate`.

### **3.2.1 User Requirement: The user shall be able to select a document and enter a payment amount.**

* System requirement 2.1.1: Selecting a document shall reveal an inline payment input on the same page (no navigation to a separate route is required). **Status: Implemented.** Clicking "Select" opens a `Dialog` component (`components/documents/PaymentForm.tsx`) on the same page.

* System requirement 2.1.2: The payment input shall pre-populate with the document's suggestedPrice if available, but the user may overwrite it. **Status: Partial.** The suggested price is displayed as a label ("Suggested price: $X") but the input field does not pre-populate with it; the initial value is `0`.

* System requirement 2.1.3: The payment input shall validate client-side that the amount is a number strictly greater than 0 before the submit button is enabled. **Status: Implemented.** The "Submit Payment" button is disabled when `paymentAmount <= 0`.

* System requirement 2.1.4: The payment input shall be operable via keyboard (focusable, submittable via Enter). **Status: Implemented via Radix UI primitives.**

### **3.2.2 User Requirement: The user shall be able to retrieve a single document by ID via the API.**

* System requirement 2.2.1: The endpoint GET /api/documents/\[id\] shall return a 200 response with the document object when the ID is valid. **Status: Implemented.**

* System requirement 2.2.2: The endpoint shall return a 404 response with a JSON error body when the ID does not correspond to an existing document. **Status: Implemented.** Also returns 400 with `{ error: "Invalid document ID" }` when the ID is non-numeric.

## **3.3 System Feature 3 — Submission and Download Access**

*Authors: Matthew Garcia, Duane Cabahug*

**Current status — two tiers of implementation:**

* **Implemented on `production-main` (direct-submission flow):** `POST /api/submissions`, `GET /api/download/[documentId]`, `GET /api/submissions/[id]` (ownership check), and the `PaymentForm` component that POSTs directly to `/api/submissions`. The `DocumentItem` component checks ownership on mount and renders a `DownloadButton` for owned documents.

* **Implemented on `feature/transaction-flow`, not yet merged to `production-main` (Stripe-backed flow):** `POST /api/stripe/checkout`, `POST /api/stripe/webhook`, `app/documents/success/page.tsx`, signed Supabase Storage URLs (1-hour TTL). On this branch, `PaymentForm` redirects to Stripe checkout instead of POSTing directly; submissions are created by the webhook after payment, not by the client. The `submissions` schema is extended with `status` (default `"active"`), `stripe_session_id` (unique), and `stripe_payment_intent_id` (unique) columns. A `charge.refunded` webhook event sets `status` to `"refunded"`, revoking download access.

### **3.3.1 User Requirement: The user shall be able to submit a payment amount and have it validated server-side.**

* System requirement 3.1.1: The endpoint POST /api/submissions shall accept a JSON body of the shape { documentId: number, amount: number }. **Status: Implemented on production-main.** The route accepts `document_id` and `amount` (snake\_case). Requires an authenticated session; returns 401 if not authenticated.

* System requirement 3.1.2: The endpoint shall validate that documentId is present and a positive integer; absent or malformed values shall produce a 400 response. **Status: Implemented on production-main.**

* System requirement 3.1.3: The endpoint shall validate that amount is present and a finite number strictly greater than zero; failures shall produce a 400 response. **Status: Implemented on production-main.**

* System requirement 3.1.4: The endpoint shall verify that a Document row with the given documentId exists; if not, it shall return 404\. **Status: Implemented on production-main.** A Prisma P2003 foreign-key violation (document not found) is caught and returned as 404.

* System requirement 3.1.5: All validation shall execute before any database write. **Status: Implemented on production-main.** Input validation runs before the auth check; auth runs before the database write.

### **3.3.2 User Requirement: A valid submission shall be persisted to the database.**

* System requirement 3.2.1: On successful validation, the endpoint shall insert a new Submission row containing the documentId, amount, and an auto-generated createdAt timestamp. The request must be authenticated; the user's Supabase UUID is stored in `user_id`. **Status: Implemented on production-main.**

* System requirement 3.2.2: The endpoint shall return a 201 response with a body containing the submission object and a download URL. **Deviation:** The actual response is the full submission row (id, document\_id, user\_id, amount, created\_at) plus a `download_url` field (snake\_case) pointing to `GET /api/download/[documentId]`. The shape `{ success: true, downloadUrl, submissionId }` originally specified was not used. **Status: Implemented on production-main (with deviation).**

* System requirement 3.2.3: The Submission table shall maintain a foreign-key constraint to the Document table at the database level; orphaned submissions shall be impossible. **Status: Implemented at the schema level.** The `documents` relation uses `onDelete: Cascade`.

### **3.3.3 User Requirement: The user shall be able to download the document after a successful submission.**

* System requirement 3.3.1: On receiving a 201 from the submission endpoint, the UI shall replace the submit control with a download button linking to the file URL returned in the response. **Status: Implemented on production-main.** The `PaymentForm` dialog calls an `onSuccess()` callback on 201. `DocumentItem` checks submission ownership on mount via `GET /api/submissions/[id]`; when ownership is confirmed, it renders the `DownloadButton` component in place of the "Select" button. The `DownloadButton` fetches a signed URL from `GET /api/download/[documentId]` and opens it in a new tab.

* System requirement 3.3.2: The download button shall be operable via keyboard and labeled with the document title for assistive technology. **Status: Implemented on production-main** via Radix UI primitives in the `DownloadButton` component.

* System requirement 3.3.3: ~~The Submission.downloadToken column shall exist in the schema from initial migration as nullable.~~ **Deviation (production-main):** The `submissions` schema does not include a `downloadToken` column. Current schema: `id` (UUID), `document_id`, `user_id`, `amount`, `created_at`. **Deviation (feature/transaction-flow):** Rather than adding a `downloadToken` column, this branch generates signed Supabase Storage URLs on-demand at `GET /api/download/[documentId]` using the service-role key (1-hour TTL). The `submissions` schema on this branch additionally carries `status` (STRING, default `"active"`), `stripe_session_id` (STRING, unique), and `stripe_payment_intent_id` (STRING, unique).

### **3.3.4 Additional Routes Introduced on `feature/transaction-flow` (not yet on production-main)**

The Stripe-backed payment flow on `feature/transaction-flow` introduces four additional routes and one new page not captured in earlier requirements:

* **POST /api/stripe/checkout** — Requires authentication (401 if not). Accepts `{ document_id: number, amount: number }`. Validates amount ≥ $0.50 (Stripe minimum); returns 400 otherwise. Returns 404 if document does not exist. On success, creates a Stripe Checkout Session with `document_id` and `user_id` stored in metadata, and returns `{ url: string }` for client-side redirect.

* **POST /api/stripe/webhook** — Verifies the Stripe webhook signature via `STRIPE_WEBHOOK_SECRET`; returns 400 on invalid signature. Handles two event types: (1) `checkout.session.completed` — extracts `document_id`, `user_id`, and `amount_total` from session metadata and creates a Submission row; idempotent via unique `stripe_session_id` constraint (duplicate delivery returns 200 without error). (2) `charge.refunded` — sets the matching submission's `status` to `"refunded"` via `stripe_payment_intent_id`; ignores events without a payment intent. All other event types return 200 with no database writes.

* **GET /api/submissions/[id]** — Auth required (401 if not). The `id` parameter is the `document_id`. Returns `{ owned: true, submission: {...} }` if the authenticated user has an `active` submission for that document, or `{ owned: false }` otherwise. Used by `DocumentItem` on mount to determine whether to show the `DownloadButton` or the `PaymentForm`.

* **GET /documents/success** (page route, not API) — Server component. Reads `session_id` from the query string, retrieves the Stripe Checkout Session, validates payment status, and renders document details with a `DownloadButton`. Returns inline error states for invalid session\_id, unpaid sessions, and missing documents.

## **3.4 System Feature 4 — Cross-Cutting Concerns**

*Authors: Matthew Garcia, Duane Cabahug*

### **3.4.1 User Requirement: The application shall be usable on mobile viewports.**

* System requirement 4.1.1: All pages shall reflow without horizontal scroll at viewport widths from 360px upward. **Status: Implemented.** Responsive layout verified at 360px on landing and documents pages.

* System requirement 4.1.2: Touch targets (buttons, inputs) shall be at least 44x44 logical pixels. **Status: Implemented via shadcn/ui `size="lg"` button variants.**

* System requirement 4.1.3: Text shall meet a minimum contrast ratio of 4.5:1 against its background. **Status: Implemented via OKLCH color palette defined in `app/globals.css`.**

### **3.4.2 User Requirement: The codebase shall include automated tests covering the required cases.**

* System requirement 4.2.1: The test suite shall cover all eight high-priority test cases from the assignment brief: valid submission, amount of zero, negative amount, missing documentId, invalid documentId, missing amount, valid submission persists, and valid submission returns download access. **Status: Implemented on `tests` branch** (`tests/api/submissions.post.test.ts`). All eight cases are present, plus additional cases covering auth enforcement and foreign-key violation handling.

* System requirement 4.2.2: The test suite shall cover the three medium-priority test cases: GET /api/documents returns an array, GET /api/documents/\[id\] with a valid ID returns the document, and GET /api/documents/\[id\] with an invalid ID returns 404\. **Status: Implemented on `tests` branch** (`tests/api/documents.test.ts`). Also covers the 400 case for non-numeric IDs and the 500 case for database failures.

* System requirement 4.2.3: Tests shall run against the real Next.js route handlers via Supertest (or equivalent), with Prisma either mocked or pointed at a separate test database. **Status: Implemented with deviation on `tests` branch.** Vitest (not Supertest) is the test runner. Route handlers are imported directly and invoked with the Node.js `Request` API in a `node` Vitest environment — no live HTTP server required. Prisma is fully mocked via `vi.hoisted()`; Supabase auth and admin clients are also mocked. Production data is never written during a test run. Additional test files cover `GET /api/download/[documentId]` (`download.test.ts`), `POST /api/stripe/checkout` (`stripe.checkout.test.ts`), and `POST /api/stripe/webhook` (`stripe.webhook.test.ts`). A Playwright E2E suite (`e2e/`) covers the full authenticated user flow and login error states against a running dev server.

## **3.5 System Feature 5 — Authentication**

*Authors: Matthew Garcia, Duane Cabahug*

Authentication was originally listed as out of scope. It has been added to the project and is fully implemented on `production-main`.

### **3.5.1 User Requirement: The user shall be able to create an account using email and password.**

* System requirement 5.1.1: The route GET /auth/register shall render a registration form with email, password, and confirm-password fields. **Status: Implemented.** (`app/auth/register/page.tsx`)

* System requirement 5.1.2: Submitting the form shall call `supabase.auth.signUp()` via the `signUpWithEmail` helper in `lib/auth.ts`. **Status: Implemented.**

* System requirement 5.1.3: Confirm-password client-side validation (ensuring both fields match before submit) shall be enforced. **Status: Not yet implemented.** The form renders both fields but does not compare them before submitting.

### **3.5.2 User Requirement: The user shall be able to sign in using email and password.**

* System requirement 5.2.1: The route GET /auth/login shall render a login form with email and password fields. **Status: Implemented.** (`app/auth/login/page.tsx`)

* System requirement 5.2.2: Auth errors shall be displayed inline below the form fields. **Status: Implemented.** An error message renders when `signInWithEmail` returns an `AuthError`.

### **3.5.3 User Requirement: The user shall be able to sign in using Google OAuth.**

* System requirement 5.3.1: The login page shall include a "Sign in with Google" button that initiates the Supabase Google OAuth flow. **Status: Implemented.** Calls `continueWithGoogle()` from `lib/auth.ts`.

* System requirement 5.3.2: The route GET /auth/callback shall exchange the Supabase OAuth code for a session and redirect to `/` on success. **Status: Implemented.** (`app/auth/callback/route.ts`)

### **3.5.4 User Requirement: The application shall reflect auth state in the navigation header.**

* System requirement 5.4.1: When a user is authenticated, the header shall display an avatar showing the user's email initial, with a dropdown menu containing the email address and a "Sign out" option. **Status: Implemented.** (`components/site-header.tsx`)

* System requirement 5.4.2: When a user is not authenticated, the header shall display a "Sign in" button linking to `/auth/login`. **Status: Implemented.**

* System requirement 5.4.3: Auth state changes (sign-in, sign-out) shall update the header without a full page reload. **Status: Implemented.** The header subscribes to `supabase.auth.onAuthStateChange`.

### **3.5.5 User Requirement: Sessions shall be persisted and refreshed across requests.**

* System requirement 5.5.1: The Next.js middleware (`proxy.ts`) shall call `updateSession()` on every non-static request to refresh the Supabase session cookie. **Status: Implemented.** Middleware matches all routes except `_next/static`, `_next/image`, `favicon.ico`, and image file extensions.

## **3.6 Summary of User Requirements**

Consolidated view of the user-facing requirements above, with priorities, authorship, and current implementation status.

| \# | User Requirement | User Scenario (Normal Path) | Priority | Status | Author |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | 3.1.1 The system shall display a landing page that explains the pay-what-you-want model and provides a CTA to browse documents. | A first-time visitor lands on the home page, reads a single hero section explaining the model, and clicks 'Browse Documents' to advance. | High | Done | M.G. / D.C. |
| 2 | 3.1.2 The system shall display all available documents with title, description, category, and suggested price. | User navigates to /documents. The page fetches and renders all seeded documents as cards, each showing the metadata and a 'Select' action. | High | Done | M.G. / D.C. |
| 3 | 3.2.1 The system shall allow the user to enter a payment amount greater than $0 for a selected document. | User clicks 'Select' on a document card. A payment dialog appears with a numeric input. User enters an amount and the submit button enables. | High | Partial — input does not pre-populate with suggested price | M.G. / D.C. |
| 4 | 3.3.1 / 3.3.2 The system shall validate submissions server-side and persist them in the database. | On submit, the client POSTs to /api/submissions. The server validates amount \> 0 and document existence before writing a Submission row. | High | Done (production-main, direct flow); Stripe-backed flow on feature/transaction-flow (pending merge) | M.G. / D.C. |
| 5 | 3.3.3 The system shall reveal a download button only after a valid submission is accepted by the server. | After 201 Created, the PaymentForm calls onSuccess(); DocumentItem checks ownership on mount and renders DownloadButton for owned documents; DownloadButton fetches a signed URL from GET /api/download/[documentId]. | High | Done (production-main) | M.G. / D.C. |
| 6 | 3.4.1 The system shall be usable on mobile viewports (≥ 360px). | User on a phone visits the site. The landing page, documents grid, and payment dialog all reflow without horizontal scroll or clipped controls. | Medium | Done | M.G. / D.C. |
| 7 | 3.5.1–3.5.5 The system shall support user authentication via email/password and Google OAuth. | User registers or signs in. The header reflects their session. Middleware refreshes the session on every request. | Medium | Done | M.G. / D.C. |

# **4\. Nonfunctional Requirements**

*Authors: Matthew Garcia, Duane Cabahug*

## **4.1 Performance**

* 4.1.1 The documents listing page (/documents) shall return data from GET /api/documents in under 500ms on the server when the database contains fewer than 100 documents (the seeded PoC scale).

* 4.1.2 The submission endpoint (POST /api/submissions) shall respond in under 300ms for valid submissions and under 100ms for validation rejections (no DB write required).

* 4.1.3 The system is not required to meet these targets under concurrent load above ten simultaneous requests in the PoC. Scalability under higher load is addressed in the security and scalability writeup, not enforced as a runtime requirement here.

Rationale: Performance targets at PoC scale should be tight enough to demonstrate that the implementation is reasonable, but not so aggressive that they force premature optimization. The 500ms and 300ms targets are achievable with a straightforward Prisma query and no caching layer.

## **4.2 Safety**

N/A. The system does not control physical equipment, manage hazardous materials, or operate in any context where software failure could cause physical harm.

## **4.3 Security**

Security requirements are stated for the PoC as built and as it would be hardened for production. The PoC implements the baseline; production-mode changes are documented for the security writeup.

### **PoC-level requirements (in scope)**

* 4.3.1 The server shall validate every submission server-side regardless of any validation performed by the client. The eight required test cases include direct API calls bypassing the frontend, all of which shall be rejected appropriately. **Status: Implemented on production-main.** All input validation runs in the route handler before any database write.

* 4.3.2 The server shall verify the existence of the referenced Document before recording a Submission. Foreign-key violations shall be impossible by validation, not only by the database constraint. **Status: Implemented on production-main.** A Prisma P2003 foreign-key violation is caught and surfaced as a 404 before the Submission row is returned.

* 4.3.3 The server shall not return a download URL or token until after a valid Submission has been persisted. **Status: Implemented on production-main.** The `download_url` field is included only in the 201 response after the Submission row is created. `GET /api/download/[documentId]` additionally verifies an active submission exists before generating a signed URL.

* 4.3.4 Supabase Auth sessions shall be refreshed server-side on every request via the Next.js middleware. **Status: Implemented.** (`proxy.ts` + `lib/supabase/proxy.ts`)

* 4.3.5 Auth credentials (Supabase URL, anon key) shall be loaded from environment variables and never hardcoded in source. **Status: Implemented.**

### **Production-mode requirements (designed for, not implemented)**

* 4.3.6 In production, the submission endpoint should require an authenticated session and reject anonymous submissions or attach `user_id` to the row.

* 4.3.7 In production, the response to a successful submission should return a download token rather than the file URL. The token should be single-use, time-limited (10 minutes), and resolved via a separate endpoint that returns a signed S3 URL.

* 4.3.8 In production, all static files should live in a private S3 bucket. The `/public/files/` directory used in the PoC is a known limitation, documented and intentional.

* 4.3.9 In production, CORS shall be locked to the production origin; the PoC permits same-origin only.

Rationale for the dual-mode approach: The schema and code structure are designed so that the production-mode path can be implemented as a forward addition rather than a rewrite.

## **4.4 Quality**

* 4.4.1 Testability: All API endpoints shall be exercisable by Supertest (or equivalent HTTP-level test client) without requiring a running development server. Database access in tests shall be either mocked or pointed at a separate test database; production data shall never be written to during a test run.

* 4.4.2 Maintainability: Route handlers shall be organized one-per-file in the `app/api/` directory tree. Business logic complex enough to warrant separate testing shall be extracted from route handlers into pure functions in `lib/`.

* 4.4.3 Usability: A first-time visitor shall be able to complete the core flow (land → browse → select → pay → download) without reading any documentation.

* 4.4.4 Accessibility: The application shall use semantic HTML elements (button, nav, main, article) and shall be operable by keyboard alone. Screen-reader perfect support is not in scope for the PoC.

* 4.4.5 Reliability: The development environment shall come up via `pnpm install` followed by `pnpm dev`. The README's setup section shall be verified by a fresh checkout before submission.

# **5\. User Interaction and Design**

*Authors: Matthew Garcia, Duane Cabahug*

Visual mockups, wireframes, and prototype artifacts will be developed in Figma during sprint Days 1–2 and embedded in this section before submission. Placeholder list of planned artifacts:

* Landing page wireframe (desktop and 360px mobile).

* Documents listing page wireframe with card grid layout.

* Document detail and inline payment dialog wireframe, including the post-submission success state with the download button revealed.

* Login and register page wireframes.

* Architecture diagram (frontend ↔ Next.js server ↔ Supabase PostgreSQL ↔ Supabase Auth ↔ static file storage).

* Entity-relationship diagram (Document and Submission tables, primary and foreign keys, cardinality).

Design direction: clean, restrained, single dominant CTA per page. OKLCH-based green accent palette (defined in `app/globals.css`). Dark mode supported via `.dark` class. shadcn/ui `radix-nova` component style. The visual goal is 'intentional and considered,' not 'agency-built'; the audience for these decisions is the reviewer, who values judgment and restraint.

# **6\. Open Questions**

*Authors: Matthew Garcia, Duane Cabahug*

| Question                                                                              | Answer                                                                                                                                                                                                                                                  | Date Answered |
| :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------ |
| Does Leo expect a deployed instance, or is a local-only PoC acceptable?               | Pending. Deployment is a stretch goal per the assignment; will revisit on Day 12 based on schedule.                                                                                                                                                     | —             |
| Should the documents page support sorting or filtering by category / suggested price? | Pending. Not required by the spec; will implement only if core work is complete.                                                                                                                                                                        | —             |
| What format should the seeded sample PDFs take?                                       | Resolved. Static placeholder PDFs (1–2 page lorem ipsum). The assignment explicitly states document content does not matter.                                                                                                                            | May 22, 2026  |
| Should anonymous submissions be permitted, or is auth required to submit?             | Resolved. Submissions require authentication on all active branches. `POST /api/submissions` returns 401 for unauthenticated requests. The `user_id` column remains nullable at the schema level but the route enforces auth before any database write. | June 4, 2026  |
| Should confirm-password validation be added to the register page?                     | Pending. The form renders both fields but does not validate they match before submitting.                                                                                                                                                               | —             |

# **7\. Out of Scope**

*Authors: Matthew Garcia, Duane Cabahug*

The following are explicitly out of scope for this PoC, per the assignment brief and the team's scope decisions.

## **Out of scope per assignment**

* Real payment processing (no Stripe integration). **Note:** Stripe checkout and webhook are implemented on `feature/transaction-flow` but not yet merged to `production-main`.

* Admin dashboard.

* Email receipts.

* File upload system (documents are seeded, not uploaded by users).

* Production deployment, unless core deliverables are complete with time remaining.

## **Previously out of scope — now implemented**

* User accounts and authentication via Supabase (email/password and Google OAuth) — added during the `feature/auth` sprint and merged to `production-main` via PR \#4.

* Submission validation, persistence, and download access — implemented on `production-main` (direct-submission flow). See Section 3.3.

## **Implemented on `feature/transaction-flow` — pending merge to production-main**

* Stripe payment integration — `POST /api/stripe/checkout` creates a Stripe Checkout Session; `POST /api/stripe/webhook` handles `checkout.session.completed` (creates submission) and `charge.refunded` (revokes access). The `submissions` table gains `status`, `stripe_session_id`, and `stripe_payment_intent_id` columns.

* Signed Supabase Storage URLs for downloads — `GET /api/download/[documentId]` generates 1-hour signed URLs via the service-role key instead of returning static file paths.

* Require authentication before submission — `POST /api/submissions` and `POST /api/stripe/checkout` both return 401 for unauthenticated requests.

## **Future work (post-PoC, designed for but not implemented)**

* Vercel or AWS deployment: Lambda \+ API Gateway \+ RDS (Postgres) \+ S3 \+ CloudFront.

* Single-use download token with expiry (schema migration required to add `downloadToken` column; not on any current branch).

* Email and name capture before download (assignment stretch goal).

* Confirm-password validation on the register page.

* Search and category filter on documents page (assignment stretch goal).

* Admin seed script (assignment stretch goal).
