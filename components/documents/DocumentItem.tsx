"use client";
import { Document } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import PaymentForm from "./PaymentForm";

type DocumentItemProps = {
  doc: Document;
}

function DocumentItem({
  doc
}: DocumentItemProps) {
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
        <PaymentForm doc={doc} />
      </CardContent>
    </Card>
  );
}

export default DocumentItem;
