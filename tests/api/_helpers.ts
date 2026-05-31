import { vi } from "vitest";

/**
 * Shared helpers for API route-handler tests.
 *
 * These are plain factories — they must NOT import any module that the test
 * files mock (e.g. `@/lib/prisma`, `@/lib/supabase/server`), so they stay
 * mock-agnostic and can be reused across suites.
 */

const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";

/** Build a mocked Supabase server client with a controllable auth user. */
export function makeSupabaseClient(user: { id: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  };
}

export const authedUser = { id: TEST_USER_ID };

/** A document row as returned by `lib/documents.ts` (already serialized). */
export function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Sample Doc",
    description: "A sample document",
    file_url: "docs/sample.pdf",
    category: "guides",
    suggested_price: 9.99,
    created_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Build a POST Request for the submissions route. */
export function postSubmission(body: unknown) {
  return new Request("http://localhost/api/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** A Prisma "P2003" foreign-key violation, mimicking a missing document_id. */
export function fkViolation() {
  return Object.assign(new Error("Foreign key constraint failed"), {
    code: "P2003",
  });
}

/**
 * A Prisma "P2002" unique-constraint violation. The Stripe webhook relies on
 * the unique `stripe_session_id` / `stripe_payment_intent_id` columns to stay
 * idempotent, so a duplicate delivery surfaces as P2002 from `prisma...create`.
 */
export function uniqueViolation() {
  return Object.assign(new Error("Unique constraint failed"), {
    code: "P2002",
  });
}

/** Build a POST Request for the Stripe checkout route. */
export function postCheckout(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

/** Build a POST Request for the Stripe webhook route (raw text body). */
export function webhookRequest(rawBody = "{}", sig = "test_signature") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body: rawBody,
  });
}

/**
 * Build a mocked Supabase service-role (admin) client whose storage layer
 * returns `signedUrlResult` from `createSignedUrl`. Returns the inner mocks so
 * tests can assert `from("documents")` and `createSignedUrl(path, 3600)`.
 */
export function makeAdminClient(
  signedUrlResult: { data: { signedUrl: string } | null; error: unknown },
) {
  const createSignedUrl = vi.fn().mockResolvedValue(signedUrlResult);
  const from = vi.fn().mockReturnValue({ createSignedUrl });
  const adminClient = { storage: { from } };
  return { adminClient, from, createSignedUrl };
}

/** A Stripe `checkout.session.completed` event, shaped as the webhook reads it. */
export function checkoutCompletedEvent({
  document_id = 1,
  user_id = TEST_USER_ID,
  amount_total = 500,
  session_id = "cs_test_123",
  payment_intent = "pi_test_123",
}: {
  document_id?: number;
  user_id?: string;
  amount_total?: number | null;
  session_id?: string;
  payment_intent?: string;
} = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: session_id,
        amount_total,
        payment_intent,
        metadata: { document_id: String(document_id), user_id },
      },
    },
  };
}

/** A Stripe `charge.refunded` event. Pass `payment_intent: null` to omit it. */
export function chargeRefundedEvent({
  payment_intent = "pi_test_123",
}: { payment_intent?: string | null } = {}) {
  return {
    type: "charge.refunded",
    data: { object: { payment_intent } },
  };
}
