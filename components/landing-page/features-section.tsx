"use client";
import { DollarSign, Zap, Database, ShieldCheck } from "lucide-react";
import { Reveal, SectionTag } from "./primitives";

const FEATURES = [
  {
    title: "Name your price",
    desc: "You decide what it's worth. No minimum beyond $0, and no suggested price you have to match.",
    Icon: DollarSign,
  },
  {
    title: "Low friction",
    desc: "Sign in once, then it's select, name your price, pay. No upsells, no five-step checkout in the way.",
    Icon: Zap,
  },
  {
    title: "Real infrastructure",
    desc: "PostgreSQL, Prisma, Supabase, Stripe, Next.js App Router. This is how production apps are actually built.",
    Icon: Database,
  },
  {
    title: "Designed for trust",
    desc: "Server-side validation on every submission. You only get the download once the server confirms.",
    Icon: ShieldCheck,
  },
];

export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-muted py-[clamp(72px,9vw,128px)]">
      <div className="mx-auto w-full max-w-[1120px] px-10 max-sm:px-[18px]">
        <Reveal className="max-w-[56ch]">
          <SectionTag>Why it works</SectionTag>
          <h2 className="mt-[18px] text-[clamp(28px,3.6vw,46px)] font-medium leading-[1.04] tracking-[-0.035em] text-foreground [text-wrap:balance]">
            Designed with intention.
          </h2>
          <p className="mt-4 max-w-[50ch] text-[16.5px] leading-[1.55] text-muted-foreground [text-wrap:pretty]">
            Every decision here removes friction or earns trust. Nothing else
            made the cut.
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-[52px] grid grid-cols-4 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {FEATURES.map(({ title, desc, Icon }) => (
              <article
                key={title}
                tabIndex={0}
                className="rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="grid size-10 place-items-center rounded-[10px] bg-primary/7 text-primary">
                  <Icon size={20} strokeWidth={1.9} />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-[11px] text-sm leading-[1.6] text-muted-foreground">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
