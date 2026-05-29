"use client";
import { Document } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import PaymentForm from "./PaymentForm";
import { Download, FileIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

type DocumentItemProps = {
  doc: Document;
  user: User | null;  
};

function DocumentItem({ doc, user }: DocumentItemProps) {
  const [owned, setOwned] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const res = await fetch(`/api/download/${doc.id}`);
    if (res.ok) {
      const { signedUrl } = await res.json();
      window.open(signedUrl, "_blank");
    }
    setDownloading(false);
  };

  useEffect(() => {
    const fetchSubmissionStatus = async () => {
      if (!user) {
        setLoading(false);
        return
      }

      try {
        const response = await fetch(`/api/submissions/${doc.id}`);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          console.error("Error fetching submission status:", body?.error ?? response.statusText);
          return;
        }

        const { owned, submission } = await response.json();
        setOwned(owned);
        if (owned && submission?.amount != null) {
          setAmountPaid(Number(submission.amount));
        }
      } catch (error) {
        console.error("Error fetching submission status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionStatus();
  }, [doc.id]);

  return (
    <Card className="w-full">
      <CardHeader className="font-mono text-muted-foreground">
        <div className="flex justify-between items-center">
          <p>{doc.category?.toUpperCase()}</p>
          <p>
            {owned && amountPaid != null
              ? <>you paid <strong>${amountPaid.toFixed(2)}</strong></>
              : <>suggested <strong>${doc.suggested_price}</strong></>}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">{doc.title}</h3>
        <p>{doc.description}</p>
        {loading ? (
          <Button variant="outline" size="lg" disabled className="w-full">
            <Loader2 className="animate-spin" />
          </Button>
        ) : owned ? (
          <Button size="lg" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="animate-spin" /> : <>Download File <Download /></>}
          </Button>
        ) : (
          <PaymentForm doc={doc} onSuccess={() => setOwned(true)} />
        )}
      
      </CardContent>
    </Card>
  );
}

export default DocumentItem;
