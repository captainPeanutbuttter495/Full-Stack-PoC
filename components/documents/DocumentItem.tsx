"use client";
import { Document } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import PaymentForm from "./PaymentForm";
import { Download, FileIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type DocumentItemProps = {
  doc: Document;
};

function DocumentItem({ doc }: DocumentItemProps) {
  const [owned, setOwned] = useState(false);
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
      try {
        const response = await fetch(`/api/submissions/${doc.id}`);

        if (!response.ok) {
          console.error(
            "Error fetching submission status:",
            response.statusText,
          );
          return;
        }

        const { owned } = await response.json();
        setOwned(owned);
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
            suggested <strong>${doc.suggested_price}</strong>
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
