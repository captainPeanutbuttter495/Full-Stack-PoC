import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/submissions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
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

    await createSubmission(parseInt(document_id), amount, user_id, session.id);
  }

  return NextResponse.json({ received: true });
}
