"use client";
import { Document } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import React from "react";

type PaymentFormProps = Pick<
  Document,
  "title" | "description" | "suggested_price" | "category"
>;

function PaymentForm({
  title,
  description,
  suggested_price,
  category,
}: PaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = React.useState(0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full bg-card">
          Select{" "}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="">
          <div className="w-full flex items-center justify-between font-mono">
            <p>{category?.toUpperCase()}</p>
          </div>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="font-bold">Enter your payment amount:</p>
          <p className="font-mono text-xs text-muted-foreground">
            Suggested price: <strong>${suggested_price}</strong>
          </p>
        </div>
        <InputGroup>
          <InputGroupInput
            placeholder="0.00"
            type="number"
            min={0}
            step={0.01}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
          />
          <InputGroupAddon>
            <p>$</p>
          </InputGroupAddon>
        </InputGroup>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="default" disabled={paymentAmount <= 0}>
            Submit Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentForm;
