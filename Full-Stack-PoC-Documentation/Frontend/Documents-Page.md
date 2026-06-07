The documents page is the main browsing interface of the Pay-What-You-Want PoC. It displays all available documents in a responsive card grid and lets visitors initiate a payment.

**Route:** `/documents` (`app/documents/page.tsx`)

## Components

| Component              | File                                            | Reusable | Description                                                     |
| ---------------------- | ----------------------------------------------- | -------- | --------------------------------------------------------------- |
| `DocumentsPage`        | `app/documents/page.tsx`                        | No       | Page composition — client component, fetches documents on mount |
| `DocumentItem`         | `components/documents/DocumentItem.tsx`         | Yes      | Card displaying category, title, description, suggested price   |
| `DocumentItemSkeleton` | `components/documents/DocumentItemSkeleton.tsx` | Yes      | Shimmer placeholder matching DocumentItem layout                |
| `PaymentForm`          | `components/documents/PaymentForm.tsx`          | Yes      | Dialog modal with numeric input, cancel/submit, loading spinner |

## Layout

The page uses a centered container capped at `max-w-7xl` (1280px) with `min-h-svh` and 16px padding on all sides.

**Header area:**

- "Documents" heading in 2xl bold
- Dynamic subtitle showing document count (e.g. "6 documents available")

**Grid breakpoints:**

| Breakpoint        | Columns | Gap  |
| ----------------- | ------- | ---- |
| Default (< 640px) | 1       | 16px |
| `sm` (>= 640px)   | 2       | 16px |
| `lg` (>= 1024px)  | 3       | 16px |

**Loading state:** 6 `DocumentItemSkeleton` placeholders render while `isLoading` is true.

## State Management

| State       | Type         | Initial | Purpose                              |
| ----------- | ------------ | ------- | ------------------------------------ |
| `documents` | `Document[]` | `[]`    | Holds fetched document list          |
| `isLoading` | `boolean`    | `true`  | Controls skeleton vs. content render |

- `useEffect` on mount calls `GET /api/documents`
- On success: populates `documents`, sets `isLoading` to false
- On error: logs to console, clears loading state via `finally` block

## DocumentItem Card Anatomy

| Section | Content                                                                  |
| ------- | ------------------------------------------------------------------------ |
| Header  | Category (uppercased, mono font, muted) on left; "suggested $X" on right |
| Content | Title (`lg` semibold), description paragraph                             |
| Footer  | "Select" button (full-width, outline variant) — opens PaymentForm        |

Props use `Pick<Document, "title" | "description" | "suggested_price" | "category">`.

## PaymentForm Dialog

The payment form renders inside a shadcn `Dialog` triggered by the "Select" button on each document card.

| State           | Type      | Initial | Purpose                           |
| --------------- | --------- | ------- | --------------------------------- |
| `paymentAmount` | `number`  | `0`     | Tracks user-entered dollar amount |
| `loading`       | `boolean` | `false` | Disables submit, shows spinner    |

**Dialog structure:**

| Area          | Content                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| Header        | Category (uppercased mono), title (xl bold), description                      |
| Input         | Number type, `min={0}`, `step={0.01}`, placeholder "0.00", `$` addon          |
| Helper text   | "Suggested price: $X" displayed below input                                   |
| Submit button | Disabled when `paymentAmount <= 0` or `loading === true`                      |
| Submit label  | "Submit Payment" normally; "Processing..." with animated Loader2 when loading |
| Cancel button | Closes dialog via `DialogClose`                                               |

> **Note:** The payment form is UI-only. The submit handler sets `loading` to true but does not yet call a backend endpoint. The `POST /api/submissions` route is planned but not built.
