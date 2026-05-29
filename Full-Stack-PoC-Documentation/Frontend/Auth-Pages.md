The authentication pages handle user sign-in, registration, and OAuth callback for the Pay-What-You-Want PoC. Authentication is powered by Supabase Auth with both email/password and Google OAuth strategies.

## Routes

| Route            | File                          | Type             |
| ---------------- | ----------------------------- | ---------------- |
| `/auth/login`    | `app/auth/login/page.tsx`     | Client component |
| `/auth/register` | `app/auth/register/page.tsx`  | Client component |
| `/auth/callback` | `app/auth/callback/route.ts`  | Route handler (GET) |

## Components

| Component      | File                           | Reusable | Description                                                        |
| -------------- | ------------------------------ | -------- | ------------------------------------------------------------------ |
| `LoginPage`    | `app/auth/login/page.tsx`      | No       | Email/password sign-in form + Google OAuth button                  |
| `RegisterPage` | `app/auth/register/page.tsx`   | No       | Registration form with password confirmation + Google OAuth        |
| `SiteHeader`   | `components/site-header.tsx`   | Yes      | Auth-aware header: avatar dropdown when signed in, button when not |

## Login Page

**Layout:** Vertically and horizontally centered, height `calc(100svh - 4rem)` to account for the sticky header. Card container at `max-w-sm` with 24px vertical padding.

**Form fields:**

| Field    | Type       | Icon   | Placeholder          | Required |
| -------- | ---------- | ------ | -------------------- | -------- |
| Email    | `email`    | `Mail` | "Enter your email"   | Yes      |
| Password | `password` | `Lock` | "Enter your password" | Yes     |

- Each field uses `InputGroup` with `InputGroupAddon` for the icon, wrapped in `Field` + `FieldLabel`
- Submit calls `signInWithEmail(email, password)` from `lib/auth.ts`
- On `AuthError`: displays `error.message` in destructive-colored text below the form fields
- On success: redirects to `/` via `router.push`

**Footer:**
- "Sign in with Google" outline button — calls `continueWithGoogle()`
- "Don't have an account?" link to `/auth/register`

## Register Page

**Layout:** Identical to login — centered card, same max-width.

**Form fields:**

| Field            | Type       | Icon   | Placeholder              | Required |
| ---------------- | ---------- | ------ | ------------------------ | -------- |
| Email            | `email`    | `Mail` | "Enter your email"       | Yes      |
| Password         | `password` | `Lock` | "Create a password"      | Yes      |
| Confirm Password | `password` | `Lock` | "Confirm your password"  | Yes      |

**Validation:**
- Client-side password match check runs before the API call
- If passwords don't match: sets error to "Passwords do not match" and aborts submission

**Loading state:**
- Submit button shows "Creating account..." with animated `Loader2` spinner
- Both submit and Google buttons are disabled while `loading` is true

- Submit calls `signUpWithEmail(email, password)` from `lib/auth.ts`
- Error handling follows the same pattern as login
- On success: redirects to `/` via `router.push`

**Footer:**
- "Sign up with Google" outline button — calls `continueWithGoogle()`
- "Already have an account?" link to `/auth/login`

## OAuth Callback

Route handler at `/auth/callback` (`app/auth/callback/route.ts`).

| Step | Detail |
| ---- | ------ |
| 1    | Reads `code` and optional `next` query parameters from the URL |
| 2    | If `next` is missing or not a relative path (doesn't start with `/`), defaults to `/` |
| 3    | Exchanges authorization code for a Supabase session via `supabase.auth.exchangeCodeForSession(code)` |
| 4    | Redirects based on environment (see below) |

**Redirect logic:**

| Condition                          | Redirect target                    |
| ---------------------------------- | ---------------------------------- |
| No `code` param or exchange error  | `/auth/auth-code-error`            |
| Development environment            | `${origin}${next}`                 |
| Production with `x-forwarded-host` | `https://${forwardedHost}${next}`  |
| Production without                 | `${origin}${next}`                 |

## Auth Library (`lib/auth.ts`)

All functions use the browser Supabase client (`lib/supabase/client.ts`) and return `AuthError | null`.

| Function             | Supabase Method                         | Description                        |
| -------------------- | --------------------------------------- | ---------------------------------- |
| `signInWithEmail`    | `signInWithPassword({ email, password })` | Signs in with email/password     |
| `signUpWithEmail`    | `signUp({ email, password })`            | Creates a new account             |
| `signOut`            | `signOut()`                              | Ends current session              |
| `continueWithGoogle` | `signInWithOAuth({ provider: 'google' })` | Initiates Google OAuth flow      |

## Auth State in Header (`components/site-header.tsx`)

The site header manages authentication state to render appropriate UI.

**Initialization:**
- On mount: calls `supabase.auth.getSession()` to populate user state
- Subscribes to `supabase.auth.onAuthStateChange` for real-time updates on login/logout
- Unsubscribes on component unmount (cleanup)

**Signed-in UI:**
- `Avatar` showing first letter of user's email (uppercase), fallback "?"
- `DropdownMenu` with:
  - User email (truncated, `max-w-48`)
  - `Separator`
  - "Sign out" destructive menu item — calls `signOut()`, then navigates to `/auth/login`

**Signed-out UI:**
- "Sign in" outline `Button` linking to `/auth/login`
