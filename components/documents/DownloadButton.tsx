"use client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function DownloadButton({ documentId }: { documentId: number }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    const res = await fetch(`/api/download/${documentId}`);
    if (res.ok) {
      const { signedUrl } = await res.json();
      window.open(signedUrl, "_blank");
    } else {
      setError("Download not ready yet. Please try again in a moment.");
    }
    setDownloading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Download File <Download />
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
