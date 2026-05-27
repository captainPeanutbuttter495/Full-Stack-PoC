"use client";
import { getAllDocuments } from "@/lib/documents";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Document } from "@/lib/types";
import DocumentItem from "@/components/documents/DocumentItem";
import DocumentItemSkeleton from "@/components/documents/DocumentItemSkeleton";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      const result = await getAllDocuments();

      if (result instanceof Error) {
        console.error("Error fetching documents:", result);
      } else {
        setDocuments(result);
      }
      setIsLoading(false);
    }
    fetchDocuments();
  }, []);

  return (
    <div className='w-full flex flex-col items-center gap-4 p-4 max-w-7xl mx-auto  min-h-svh'>
      <div className='w-full flex flex-col gap-4'>
        <h1 className='text-2xl font-bold'>Documents</h1>
        <p className='text-muted-foreground'>
          {documents.length} documents, each with a suggested price. Pay what feels fair.
        </p>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <DocumentItemSkeleton key={i} />)
          : documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                category={doc.category}
                title={doc.title}
                description={doc.description}
                suggested_price={doc.suggested_price}
              />
            ))}
      </section>
    </div>
  );
}
