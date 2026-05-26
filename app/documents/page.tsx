"use client";
import { getAllDocuments } from "@/lib/documents";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Document } from "@/lib/types";
import { PostgrestError } from "@supabase/supabase-js";
import DocumentItem from "@/components/documents/DocumentItem";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    async function fetchDocuments() {
      const result = await getAllDocuments();

      if (result instanceof Error || result instanceof PostgrestError) {
        console.error("Error fetching documents:", result);
      } else {
        setDocuments(result);
      }
    }
    fetchDocuments();
  });

  return (
    <section className="h-min flex flex-wrap gap-4 flex-1 w-full">
      {documents.map((doc) => (
        <DocumentItem
          key={doc.id}
          category={doc.category}
          title={doc.title}
          description={doc.description}
          suggested_price={doc.suggested_price}
        />
      ))}
    </section>
  );
}
