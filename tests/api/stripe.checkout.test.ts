import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  makeSupabaseClient,
  authedUser,
  makeDocument,
  postCheckout,
} from "./_helpers";

/**
 * POST /api/stripe/checkout — creates a Stripe Checkout Session.
 *
 * Mocked layers: the Stripe SDK (no network), Supabase auth, and the document
 * lookup helper. No real Stripe, Supabase, DB, or network is touched.
 *
 * ⚠️ Pinned current behavior (differs from the assignment `/api/submissions`
 * route — documented inline so a future reader knows it is intentional here):
 *   1. This route checks AUTH BEFORE VALIDATION, so an unauthenticated request
 *      with a malformed body returns 401 (not 400). `/api/submissions` does the
 *      opposite (validates first → 400).
 *   2. This route rejects `amount < 0.5` (Stripe's $0.50 minimum charge), not
 *      `amount <= 0`. `/api/submissions` rejects `amount <= 0`.
 */

// `new Stripe(...)` returns this shared mock; `sessions.create` is asserted on.
const stripeMock = vi.hoisted(() => ({
  checkout: { sessions: { create: vi.fn() } },
}));
// Regular function (not arrow) so it is usable with `new Stripe(...)`.
vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return stripeMock;
  }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/documents", () => ({ getDocumentById: vi.fn() }));

import { POST } from "@/app/api/stripe/checkout/route";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/documents";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetDocumentById = vi.mocked(getDocumentById);

function withUser(user: { id: string } | null) {
  const client = makeSupabaseClient(user);
  mockedCreateClient.mockResolvedValue(client as never);
  return client;
}

/** A resolved Stripe Checkout Session. */
function stripeSession() {
  return { id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123" };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/stripe/checkout — auth (checked before validation)", () => {
  it("returns 401 for an unauthenticated request with a valid body", async () => {
    withUser(null);

    const res = await POST(postCheckout({ document_id: 1, amount: 5 }));

    expect(res.status).toBe(401);
    // Guardrail: no Stripe session may be created without an authenticated user.
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 401 for an unauthenticated request with a malformed body", async () => {
    // Auth runs BEFORE validation here, so a bad body still 401s (not 400).
    withUser(null);

    const res = await POST(postCheckout({ amount: 5 })); // missing document_id

    expect(res.status).toBe(401);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/checkout — validation failures (no Stripe call)", () => {
  it("returns 400 for amount of 0", async () => {
    withUser(authedUser);

    const res = await POST(postCheckout({ document_id: 1, amount: 0 }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid input" });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 400 for amount below Stripe's $0.50 minimum (0.4)", async () => {
    // Pinned: checkout enforces `amount < 0.5`, unlike /api/submissions (<= 0).
    withUser(authedUser);

    const res = await POST(postCheckout({ document_id: 1, amount: 0.4 }));

    expect(res.status).toBe(400);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when document_id is missing / not a number", async () => {
    withUser(authedUser);

    const res = await POST(postCheckout({ amount: 5 }));

    expect(res.status).toBe(400);
    // Guardrail: Stripe must not be called on invalid input.
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when amount is missing (not a number)", async () => {
    withUser(authedUser);

    const res = await POST(postCheckout({ document_id: 1 }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid input" });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/checkout — document existence", () => {
  it("returns 404 when the document does not exist (no Stripe call)", async () => {
    withUser(authedUser);
    mockedGetDocumentById.mockResolvedValue(null);

    const res = await POST(postCheckout({ document_id: 999, amount: 5 }));

    expect(res.status).toBe(404);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/checkout — valid request", () => {
  it("creates a Stripe Checkout Session and returns its url", async () => {
    withUser(authedUser);
    mockedGetDocumentById.mockResolvedValue(makeDocument());
    stripeMock.checkout.sessions.create.mockResolvedValue(stripeSession());

    const res = await POST(postCheckout({ document_id: 1, amount: 5 }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it("accepts the exact $0.50 minimum (unit_amount -> 50)", async () => {
    // Boundary: `amount < 0.5` is rejected, so 0.5 itself must be accepted.
    withUser(authedUser);
    mockedGetDocumentById.mockResolvedValue(makeDocument());
    stripeMock.checkout.sessions.create.mockResolvedValue(stripeSession());

    const res = await POST(postCheckout({ document_id: 1, amount: 0.5 }));

    expect(res.status).toBe(200);
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
    const arg = stripeMock.checkout.sessions.create.mock.calls[0][0];
    expect(arg.line_items[0].price_data.unit_amount).toBe(50);
  });

  it("converts dollars to integer cents (5.00 -> 500)", async () => {
    withUser(authedUser);
    mockedGetDocumentById.mockResolvedValue(makeDocument());
    stripeMock.checkout.sessions.create.mockResolvedValue(stripeSession());

    await POST(postCheckout({ document_id: 1, amount: 5 }));

    const arg = stripeMock.checkout.sessions.create.mock.calls[0][0];
    expect(arg.line_items[0].price_data.unit_amount).toBe(500);
  });

  it("rounds fractional cents (12.34 -> 1234)", async () => {
    withUser(authedUser);
    mockedGetDocumentById.mockResolvedValue(makeDocument());
    stripeMock.checkout.sessions.create.mockResolvedValue(stripeSession());

    await POST(postCheckout({ document_id: 1, amount: 12.34 }));

    const arg = stripeMock.checkout.sessions.create.mock.calls[0][0];
    expect(arg.line_items[0].price_data.unit_amount).toBe(1234);
  });

  it("passes document_id and user_id through to Stripe metadata", async () => {
    withUser(authedUser);
    mockedGetDocumentById.mockResolvedValue(makeDocument({ id: 7 }));
    stripeMock.checkout.sessions.create.mockResolvedValue(stripeSession());

    await POST(postCheckout({ document_id: 7, amount: 5 }));

    const arg = stripeMock.checkout.sessions.create.mock.calls[0][0];
    // The route serializes document_id to a string in metadata.
    expect(arg.metadata).toEqual({ document_id: "7", user_id: authedUser.id });
  });
});
