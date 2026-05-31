import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  authedUser,
  webhookRequest,
  checkoutCompletedEvent,
  chargeRefundedEvent,
  uniqueViolation,
} from "./_helpers";

/**
 * POST /api/stripe/webhook — verifies the signature, then on
 * `checkout.session.completed` persists a submission and on `charge.refunded`
 * revokes access.
 *
 * Mocked layers: the Stripe SDK's `webhooks.constructEvent` (signature
 * verification) and Prisma. We assert persistence via `prisma.submissions.*`
 * rather than a real DB, following the existing test convention.
 */

const stripeMock = vi.hoisted(() => ({
  webhooks: { constructEvent: vi.fn() },
}));
// Regular function (not arrow) so it is usable with `new Stripe(...)`.
vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return stripeMock;
  }),
}));

// The webhook calls createSubmission / revokeSubmission, which call these.
const prismaMock = vi.hoisted(() => ({
  submissions: {
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { POST } from "@/app/api/stripe/webhook/route";

/** A successful Prisma create result (createSubmission serializes amount/date). */
function createdRow() {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    document_id: 1,
    user_id: authedUser.id,
    amount: { toString: () => "5" } as never,
    stripe_session_id: "cs_test_123",
    stripe_payment_intent_id: "pi_test_123",
    status: "active",
    created_at: new Date("2025-01-01T00:00:00.000Z"),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/stripe/webhook — signature verification", () => {
  it("returns 400 and writes nothing when the signature is invalid", async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Webhook signature verification failed");
    });

    const res = await POST(webhookRequest("{}", "bad_sig"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
    // Guardrail: an unverified event must never mutate DB state.
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
    expect(prismaMock.submissions.updateMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/webhook — unhandled event type", () => {
  it("returns 200 and writes nothing", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.created",
      data: { object: {} },
    });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
    expect(prismaMock.submissions.updateMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/webhook — checkout.session.completed", () => {
  it("creates a submission from the session metadata and amount_total", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue(
      checkoutCompletedEvent({
        document_id: 1,
        user_id: authedUser.id,
        amount_total: 500, // cents → $5.00
        session_id: "cs_test_123",
        payment_intent: "pi_test_123",
      }),
    );
    prismaMock.submissions.create.mockResolvedValue(createdRow());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(prismaMock.submissions.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.submissions.create).toHaveBeenCalledWith({
      data: {
        document_id: 1,
        amount: 5, // amount_total / 100
        user_id: authedUser.id,
        stripe_session_id: "cs_test_123",
        stripe_payment_intent_id: "pi_test_123",
      },
    });
  });

  it("returns 200 without crashing on duplicate delivery (Prisma P2002)", async () => {
    // The unique `stripe_session_id` / `stripe_payment_intent_id` columns reject
    // a replayed event with P2002. createSubmission's catch block has no
    // P2002-specific branch — it returns any non-P2003 error as an Error VALUE
    // (it does not rethrow). The webhook ignores createSubmission's return value,
    // so the route still returns 200.
    //
    // ⚠️ This proves NO-CRASH only. It does NOT prove "no duplicate row" — that
    // guarantee comes from the DB unique constraint and can only be verified by
    // a real-DB integration test (see deferred follow-up).
    stripeMock.webhooks.constructEvent.mockReturnValue(checkoutCompletedEvent());
    prismaMock.submissions.create.mockRejectedValue(uniqueViolation());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});

describe("POST /api/stripe/webhook — charge.refunded", () => {
  it("revokes the submission by payment_intent (status -> refunded)", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue(
      chargeRefundedEvent({ payment_intent: "pi_test_123" }),
    );
    prismaMock.submissions.updateMany.mockResolvedValue({ count: 1 });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(prismaMock.submissions.updateMany).toHaveBeenCalledWith({
      where: { stripe_payment_intent_id: "pi_test_123" },
      data: { status: "refunded" },
    });
  });

  it("does nothing when the refunded charge has no payment_intent", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue(
      chargeRefundedEvent({ payment_intent: null }),
    );

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(prismaMock.submissions.updateMany).not.toHaveBeenCalled();
  });
});
