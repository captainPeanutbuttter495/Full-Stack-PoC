"use client";
import { Document } from "@/lib/types";
import {
  Dialog,
  DialogClose,
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
import React, { useState } from "react";
import { Loader2 } from "lucide-react";

type PaymentFormProps = { doc: Document; onSuccess: () => void };

function PaymentForm({ doc, onSuccess }: PaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const numericAmount = parseFloat(paymentAmount) || 0;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setPaymentAmount("");
      setError(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^\d*\.?\d{0,2}$/.test(val)) return;
    // Strip leading zeros before a non-zero digit (e.g. "012" -> "12"), but allow "0."
    setPaymentAmount(val.replace(/^0+(\d)/, "$1"));
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: doc.id,
        amount: numericAmount,
      }),
    });

    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setError("Failed to start payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full bg-card">
          Select{" "}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="">
          <div className="w-full flex items-center justify-between font-mono">
            <p>{doc.category?.toUpperCase()}</p>
          </div>
          <DialogTitle className="text-xl font-bold">{doc.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {doc.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="font-bold">Enter your payment amount:</p>
          <p className="font-mono text-xs text-muted-foreground">
            Suggested price: <strong>${doc.suggested_price}</strong>
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePayment();
          }}
          className="flex flex-col gap-4"
        >
          <InputGroup>
            <InputGroupInput
              placeholder="0.50"
              type="text"
              inputMode="decimal"
              value={paymentAmount}
              onChange={handleAmountChange}
            />
            <InputGroupAddon>
              <p>$</p>
            </InputGroupAddon>
          </InputGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="default"
              disabled={numericAmount < 0.5 || loading}
              type="submit"
            >
              {loading ? (
                <>
                  Processing... <Loader2 className="animate-spin" />
                </>
              ) : (
                "Submit Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentForm;
