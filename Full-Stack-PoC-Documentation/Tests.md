# Testing Frameworks Reference Guide

A reference of every testing tool used in [[Momentum]], what it does, and when to use it in a future project.

---

## Test Runners

### Vitest

- **What it does:** Runs your test files, provides `describe`/`it`/`expect` syntax, and handles mocking (`vi.fn()`, `vi.mock()`, `vi.hoisted()`). Think of it as the engine that finds and executes tests.
- **Used in Momentum:** Backend tests (`backend/test/*.test.js`)
- **When to use it:** Any JavaScript/TypeScript project, especially ones using Vite or ESM. It's fast, has native TypeScript support, and its mocking API is powerful. Best choice for Next.js, Vite, or any modern Node.js backend.
- **Package:** `vitest`

### Jest

- **What it does:** Same role as Vitest — runs tests, provides assertions, handles mocking (`jest.fn()`, `jest.mock()`). Jest is the older, more established option.
- **Used in Momentum:** Mobile tests (`mobile/__tests__/*.test.js`) via the `jest-expo` preset
- **When to use it:** React Native projects (via `jest-expo`), or any project already using Jest. If starting fresh on a web/Node project, Vitest is generally the better choice now. Jest is still the standard for React Native because `jest-expo` handles all the native module transforms.
- **Packages:** `jest` + `jest-expo` (for React Native)

### When to Pick Which

| Project Type | Use |
|---|---|
| React Native / Expo | Jest (via `jest-expo`) |
| Next.js / Vite / Node.js | Vitest |
| Express backend | Either works; Momentum uses Vitest |

---

## UI / Component Testing

### React Testing Library (`@testing-library/react`)

- **What it does:** Renders React components in a simulated DOM and lets you query them the way a user would — by text, role, label, or placeholder. Provides `render()`, `screen`, `fireEvent`, and `waitFor`.
- **Used in Momentum:** Mobile tests use the React Native variant (`@testing-library/react-native`), which has the same API but renders native components instead of DOM elements.
- **When to use it:** Any React project (web or native). It's the standard way to test React components. You render a component, find elements by their visible text or accessibility roles, simulate clicks/typing, and assert what's on screen.
- **Packages:** `@testing-library/react` (web) or `@testing-library/react-native` (React Native)

### jest-dom (`@testing-library/jest-dom`)

- **What it does:** Adds DOM-specific assertion matchers to your test runner — things like `.toBeInTheDocument()`, `.toBeDisabled()`, `.toHaveTextContent()`, `.toBeVisible()`. Without it, you'd have to write clunky manual assertions.
- **Used in Momentum:** Mobile uses the React Native equivalent (`@testing-library/jest-native`) which provides `.toBeOnTheScreen()`.
- **When to use it:** Always pair it with React Testing Library on web projects. It makes assertions readable.
- **Package:** `@testing-library/jest-dom`

### userEvent (`@testing-library/user-event`)

- **What it does:** Simulates realistic user interactions (typing character-by-character, clicking with pointer events, tabbing). More accurate than `fireEvent` because it fires the full event sequence a real browser would (focus, keydown, input, keyup, change).
- **Used in Momentum:** Referenced but Momentum mobile mostly uses `fireEvent`. `userEvent` is the recommended upgrade.
- **When to use it:** Whenever testing interactive forms, inputs, or complex user flows. Use `fireEvent` for simple clicks; use `userEvent` for typing into inputs, multi-step interactions, or when you need realistic event ordering.
- **Package:** `@testing-library/user-event`

### jsdom

- **What it does:** A pure-JavaScript implementation of the browser DOM. Vitest (or Jest) uses it to create a fake `document`, `window`, etc. so React components can render without a real browser.
- **Used in Momentum:** Not directly (mobile tests use React Native's renderer). Needed for web React component tests with Vitest.
- **When to use it:** Any web React project tested with Vitest. Set `environment: "jsdom"` in your Vitest config. Jest includes jsdom by default.
- **Package:** `jsdom`

### @vitejs/plugin-react

- **What it does:** Enables JSX/TSX transformation in Vitest so it can understand React component syntax. Without it, Vitest can't parse `<Component />`.
- **Used in Momentum:** Not needed (backend tests have no JSX; mobile uses Jest which handles transforms via `jest-expo`).
- **When to use it:** Any Vitest project that tests React components. Add it as a plugin in `vitest.config.ts`.
- **Package:** `@vitejs/plugin-react`

---

## HTTP / API Testing

### Supertest

- **What it does:** Spins up your Express app in-memory and sends real HTTP requests to it. You write `request(app).get("/api/profile").expect(200)` and it makes the request, checks the status code, and gives you the response body.
- **Used in Momentum:** All backend route tests (`backend/test/profile.test.js`, `workouts.test.js`, etc.)
- **When to use it:** Express or any Node.js HTTP server where you want to test routes end-to-end without starting a real server. **Not needed for Next.js** — Next.js route handlers are plain async functions you can call directly (see below).
- **Package:** `supertest`

### Testing Next.js API Routes (No Extra Package Needed)

Next.js App Router route handlers export functions like `export async function GET(request, { params })`. You test them by importing and calling them directly:

```ts
import { GET } from "../route";

const response = await GET();
expect(response.status).toBe(200);
expect(await response.json()).toEqual([...]);
```

No Supertest, no HTTP server. The `Request` and `Response` objects are built into Node.js 18+.

---

## Mocking

### vi.fn() / jest.fn()

- **What it does:** Creates a mock function that records how it was called (arguments, call count, return values). You can then assert `expect(mockFn).toHaveBeenCalledWith(...)`.
- **When to use it:** Anytime you need to replace a real function with a fake one — callbacks, event handlers, API clients.

### vi.mock() / jest.mock()

- **What it does:** Replaces an entire module import with a mock. Every test file that imports that module gets the mock version instead.
- **When to use it:** To replace external dependencies (database clients, auth libraries, API clients) so tests don't need real connections.

### vi.hoisted() (Vitest Only)

- **What it does:** Moves code to the top of the file BEFORE any imports run. This solves the problem where you need mock values to exist before the module you're testing imports its dependencies.
- **Used in Momentum:** Every backend test uses this for Prisma mocking:

```js
const prismaMock = vi.hoisted(() => ({
  userProfile: { findUnique: vi.fn(), create: vi.fn() }
}));
vi.mock("../db.js", () => ({ default: prismaMock }));
```

- **When to use it:** Whenever your mock values need to exist before `vi.mock()` replaces a module. This is the standard pattern for mocking database clients, auth middleware, or any module with side effects on import.

### Prisma Mocking Pattern (Momentum vs Next.js)

Momentum's `db.js` uses a **default export**, so the mock returns `{ default: prismaMock }`:

```js
vi.mock("../db.js", () => ({ default: prismaMock }));
```

If a project uses a **named export** (e.g., `export const prisma`), the mock must match:

```js
vi.mock("../prisma", () => ({ prisma: prismaMock }));
```

The `vi.hoisted()` pattern stays exactly the same — only the export shape changes.

---

## Network Mocking

### MSW (Mock Service Worker)

- **What it does:** Intercepts `fetch()` calls at the network level and returns fake responses. Unlike `vi.mock()`, it doesn't replace the module — your code makes real `fetch()` calls, and MSW intercepts them before they leave the process.
- **Used in Momentum:** Mobile test setup (`mobile/test/msw/`). Has `setupServer()`, handlers, and fixtures. Currently handlers are empty (Phase 1), but the infrastructure is ready for integration tests.
- **When to use it:** Integration tests where you want to test the full data-fetching flow (component calls fetch, gets response, renders result). Great for testing React components that call APIs without mocking the API client module. Also useful for testing error states (500s, timeouts, malformed responses).
- **Package:** `msw`

---

## Summary Table

| Tool | Purpose | Use With | Momentum Location |
|---|---|---|---|
| **Vitest** | Test runner + mocking | Web / Node projects | `backend/test/` |
| **Jest** | Test runner + mocking | React Native | `mobile/__tests__/` |
| **@testing-library/react** | Component rendering + queries | Web React | -- |
| **@testing-library/react-native** | Component rendering + queries | React Native | `mobile/__tests__/` |
| **@testing-library/jest-dom** | DOM assertion matchers | Web React + Vitest/Jest | -- |
| **@testing-library/jest-native** | RN assertion matchers | React Native + Jest | `mobile/test/setup.js` |
| **@testing-library/user-event** | Realistic interaction simulation | Web React | -- |
| **jsdom** | Fake browser DOM | Web React + Vitest | -- |
| **@vitejs/plugin-react** | JSX transform for Vitest | Web React + Vitest | -- |
| **Supertest** | HTTP testing for Express | Express backends | `backend/test/` |
| **MSW** | Network-level fetch mocking | Integration tests | `mobile/test/msw/` |
| **vi.hoisted()** | Pre-import mock setup | Vitest + Prisma/DB mocking | `backend/test/` |

---

## For Full-Stack-PoC

### E2E Tests (Playwright) — Currently Set Up

The project uses **Playwright** for end-to-end browser tests. These tests run against the real dev server and Supabase backend.

**Installation (already done):**

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install chromium
```

**Running tests:**

```bash
# Run all E2E tests (starts dev server automatically)
pnpm test:e2e

# Run with Playwright's visual debugger (great for troubleshooting)
pnpm test:e2e:ui

# Run a specific test file
pnpm test:e2e -- e2e/login-errors.spec.ts

# Run in headed mode (see the browser)
pnpm test:e2e -- --headed

# View the HTML report after a run
pnpm dlx playwright show-report
```

**Prerequisites:**
- Database must be running (documents page fetches from `/api/documents` via Prisma)
- `.env.local` must contain `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` — a dedicated Supabase email/password test user

**Test files:**

| File | What it tests | Auth needed? |
|---|---|---|
| `e2e/auth.setup.ts` | Logs in with test user, saves session for other tests | — (setup step) |
| `e2e/authenticated-documents-flow.spec.ts` | Homepage → documents → payment modal → sign out | Yes (uses saved session) |
| `e2e/login-errors.spec.ts` | Wrong password, non-existent email | No (tests unauthenticated) |

**How auth works in tests:**
- `auth.setup.ts` runs first, logs in via the real login form, and saves the browser session (cookies) to `.auth/user.json`
- Authenticated tests load that session automatically — they start already logged in
- Unauthenticated tests (like `login-errors.spec.ts`) override this with `test.use({ storageState: { cookies: [], origins: [] } })`

**Configuration:** `playwright.config.ts` at project root. Uses `pnpm dev` as the webServer and loads `.env.local` via `@next/env`.

---

### Unit / Component Tests (Vitest) — Future

When ready to add component-level tests, install these packages:

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

This gives you everything needed to test:
- **Server functions** (`lib/documents.ts`) with mocked Prisma via `vi.hoisted()`
- **API route handlers** (`app/api/documents/`) by calling exported functions directly
- **React components** (`components/documents/`) with render + query + interact patterns
