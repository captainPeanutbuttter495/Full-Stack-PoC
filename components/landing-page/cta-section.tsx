"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./primitives";

export function CtaSection() {
  return (
    <section className="bg-background py-[clamp(72px,9vw,128px)]">
      <Reveal className="mx-auto flex w-full max-w-[1120px] flex-col items-center px-10 text-center max-sm:px-[18px]">
        <h2 className="mt-[22px] max-w-[16ch] text-[clamp(32px,5vw,64px)] font-medium leading-[0.98] tracking-[-0.045em] text-foreground [text-wrap:balance]">
          Find something worth paying for.
        </h2>
        <p className="mt-5 max-w-[40ch] text-[17px] text-muted-foreground [text-wrap:pretty]">
          Browse the full catalog and name your price.
        </p>
        <Button
          size="lg"
          className="mt-[34px] h-[52px] rounded-[11px] px-6 text-[15.5px] max-sm:w-full"
          asChild
        >
          <Link href="/documents">
            Browse Documents <ArrowRight size={17} />
          </Link>
        </Button>
        <span className="mt-[18px] font-mono text-xs text-muted-foreground">
          Quick sign-in · Secure Stripe checkout · Instant download
        </span>
      </Reveal>
    </section>
  );
}
