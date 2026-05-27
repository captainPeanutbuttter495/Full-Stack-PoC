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
import React from "react";
import { Loader2 } from "lucide-react";

type PaymentFormProps = { doc: Document };

function PaymentForm({ doc }: PaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: doc.id,
        amount: paymentAmount,
      }),
    });

    if (!res.ok) {
      console.error("Payment failed:", res.statusText);
      setError("Payment failed. Please try again.");
    }

    setLoading(false);
  };

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
          className='flex flex-col gap-4'
        >
          <InputGroup>
            <InputGroupInput
              placeholder="0.00"
              type="number"
              min={0}
              step={0.01}
              value={paymentAmount}
              onChange={(e) =>
                setPaymentAmount(parseFloat(e.target.value) || 0)
              }
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
              disabled={paymentAmount <= 0 || loading}
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
