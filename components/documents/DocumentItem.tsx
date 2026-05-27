"use client";
import { Document } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import PaymentForm from "./PaymentForm";

type DocumentItemProps = Pick<
  Document,
  "title" | "description" | "suggested_price" | 'category'
>;

function DocumentItem({
  title,
  description,
  suggested_price,
  category
}: DocumentItemProps) {
  return (
    <Card className="w-full">
      <CardHeader className="font-mono text-muted-foreground">
        <div className="flex justify-between items-center">
          <p>{category?.toUpperCase()}</p>
          <p>
            suggested <strong>${suggested_price}</strong>
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p>{description}</p>
        <PaymentForm title={title} description={description} suggested_price={suggested_price} category={category} />
      </CardContent>
    </Card>
  );
}

export default DocumentItem;
