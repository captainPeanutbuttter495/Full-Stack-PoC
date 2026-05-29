import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/documents";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { document_id, amount } = await request.json();

  if (typeof document_id !== "number" || typeof amount !== "number" || amount < 0.5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const document = await getDocumentById(document_id);

  if (!document || document instanceof Error) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: document.title,
            description: document.description,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${origin}/documents/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/documents`,
    metadata: {
      document_id: document_id.toString(),
      user_id: user.id,
    },
  });

  return NextResponse.json({ url: session.url });
}
