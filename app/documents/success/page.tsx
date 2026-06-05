import Stripe from "stripe";
import { getDocumentById } from "@/lib/documents";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DownloadButton from "@/components/documents/DownloadButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";

// Construct the Stripe client lazily (on first render) rather than at module
// load. `next build` collects page config by importing this module, and the
// secret is intentionally absent at build time — eager construction would throw.
let stripeClient: Stripe | undefined;
function getStripe(): Stripe {
  return (stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
}

function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild variant="default">
        <Link href="/documents"><ArrowLeft /> Back to documents</Link>
      </Button>
    </main>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <ErrorState
        title="Invalid link"
        description="No session ID was provided. If you completed a payment, check your email for a confirmation."
      />
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id);
  } catch {
    return (
      <ErrorState
        title="Session not found"
        description="This payment session doesn't exist or has expired. If you were charged, please contact support."
      />
    );
  }

  if (session.payment_status !== "paid") {
    return (
      <ErrorState
        title="Payment incomplete"
        description="Your payment was not completed. No charge was made — please try again."
      />
    );
  }

  const amountPaid = session.amount_total != null ? session.amount_total / 100 : null;
  const document_id = parseInt(session.metadata?.document_id ?? "");

  if (isNaN(document_id)) {
    return (
      <ErrorState
        title="Something went wrong"
        description="Your payment was received but we couldn't identify the document. Please contact support with your session ID."
      />
    );
  }

  const doc = await getDocumentById(document_id);

  if (!doc || doc instanceof Error) {
    return (
      <ErrorState
        title="Document not found"
        description="Your payment was received but the document could not be loaded. Please contact support."
      />
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <h1 className="text-2xl font-bold">Payment successful</h1>
      <p className="text-muted-foreground">
        Your document is now unlocked and ready to download.
      </p>
      <div className="w-full max-w-md">
        <Card className="w-full text-left">
          <CardHeader className="font-mono text-muted-foreground">
            <div className="flex justify-between items-center">
              <p>{doc.category?.toUpperCase()}</p>
              <p>
                {amountPaid != null
                  ? <>you paid <strong>${amountPaid.toFixed(2)}</strong></>
                  : <>suggested <strong>${doc.suggested_price}</strong></>}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">{doc.title}</h3>
            <p>{doc.description}</p>
            <DownloadButton documentId={doc.id} />
          </CardContent>
        </Card>
      </div>
      <Button asChild variant="default">
        <Link href="/documents"><ArrowLeft /> Back to documents</Link>
      </Button>
    </main>
  );
}
