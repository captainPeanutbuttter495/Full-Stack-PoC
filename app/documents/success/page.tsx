import Stripe from "stripe";
import { getDocumentById } from "@/lib/documents";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DownloadButton from "@/components/documents/DownloadButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let doc = null;
  let amountPaid: number | null = null;
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const document_id = parseInt(session.metadata?.document_id ?? "");
      amountPaid = session.amount_total != null ? session.amount_total / 100 : null;
      if (!isNaN(document_id)) {
        const result = await getDocumentById(document_id);
        if (result && !(result instanceof Error)) {
          doc = result;
        }
      }
    } catch {
      // session lookup failed — fall through to generic success message
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <h1 className="text-2xl font-bold">Payment successful</h1>
      <p className="text-muted-foreground">
        Your document is now unlocked and ready to download.
      </p>
      {doc && (
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
      )}
      <Button asChild variant="ghost">
        <Link href="/documents">Back to documents</Link>
      </Button>
    </main>
  );
}
