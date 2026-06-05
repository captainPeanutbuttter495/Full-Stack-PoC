import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createSubmission, revokeSubmission } from "@/lib/submissions";

// Construct the Stripe client lazily (on first request) rather than at module
// load. `next build` collects route data by importing this module, and the
// secret is intentionally absent at build time — eager construction would throw.
let stripeClient: Stripe | undefined;
function getStripe(): Stripe {
  return (stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { document_id, user_id } = session.metadata!;
    const amount = (session.amount_total ?? 0) / 100;

    await createSubmission(
      parseInt(document_id),
      amount,
      user_id,
      session.id,
      session.payment_intent as string,
    );
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    if (charge.payment_intent) {
      await revokeSubmission(charge.payment_intent as string);
    }
  }

  return NextResponse.json({ received: true });
}
