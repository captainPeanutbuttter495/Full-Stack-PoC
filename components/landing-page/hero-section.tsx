"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ease, Eyebrow } from "./primitives";

const heroVisualVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.99 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.9, ease, delay: 0.22 } },
};

function HeroVisual() {

  return (
    <div className='flex items-center justify-center w-full '>

    <motion.div
      className="relative min-h-[470px] max-lg:mt-10 max-lg:scale-[0.82] max-w-sm max-lg:origin-top-left max-[374px]:scale-[0.74]"
      variants={heroVisualVariants}
      aria-hidden="true"
    >
      {/* back card 2 */}
      <motion.div
        className="absolute top-[20px] left-[-80px] w-[280px] rounded-[14px] border border-border bg-card p-[18px] shadow-sm"
        style={{ rotate: 7, opacity: 0.42 }}
        animate={{ y: [0, -13, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex justify-between items-center font-mono text-[10.5px] text-muted-foreground">
          <span>WHITEPAPER</span>
          <span>suggested <strong className="text-foreground font-medium">$6</strong></span>
        </div>
        <h4 className="mt-3 text-base font-semibold tracking-tight leading-snug text-foreground">Postgres Performance Field Notes</h4>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">Indexing, query plans, and the gotchas nobody warns you about.</p>
        <div className="mt-[15px] h-[38px] grid place-items-center rounded-[9px] border border-border bg-background text-[13px] font-medium">Select</div>
      </motion.div>

      {/* back card 1 */}
      <motion.div
        className="absolute top-[40px] right-[-80px] w-[280px] rounded-[14px] border border-border bg-card p-[18px] shadow-sm"
        style={{ rotate: -3, opacity: 0.92 }}
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex justify-between items-center font-mono text-[10.5px] text-muted-foreground">
          <span>GUIDE</span>
          <span>suggested <strong className="text-foreground font-medium">$12</strong></span>
        </div>
        <h4 className="mt-3 text-base font-semibold tracking-tight leading-snug text-foreground">The Design Systems Handbook</h4>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">From tokens to components — a practical build order.</p>
        <div className="mt-[15px] h-[38px] grid place-items-center rounded-[9px] border border-border bg-background text-[13px] font-medium">Select</div>
      </motion.div>

      {/* payment dialog */}
      <motion.div
        className="absolute left-[-150px] bottom-1.5 w-[320px] rounded-2xl border border-border bg-card p-[22px] shadow-lg"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="font-mono text-[10.5px] text-muted-foreground tracking-[0.08em]">PLAYBOOK</p>
        <p className="mt-2 text-[19px] font-semibold tracking-tight text-foreground">The SaaS Pricing Playbook</p>
        <p className="mt-4 text-[13px] font-semibold text-foreground">Enter your payment amount</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          Suggested price: <strong className="text-foreground font-medium">$9.00</strong>
        </p>
        <div className="mt-[11px] flex items-center rounded-[10px] border border-border bg-background overflow-hidden">
          <div className="w-[42px] self-stretch grid place-items-center border-r border-border bg-muted font-mono text-[15px] text-muted-foreground">$</div>
          <div className="flex flex-1 items-center px-[14px] h-11 font-mono text-[17px] text-foreground tracking-tight">
            24.00
            <motion.span
              className="inline-block w-[1.5px] h-[19px] bg-primary ml-0.5"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.45, 0.5, 1] }}
            />
          </div>
        </div>
        <div className="mt-[14px] h-11 grid place-items-center rounded-[10px] bg-primary text-primary-foreground text-sm font-medium">
          Submit Payment
        </div>
      </motion.div>
    </motion.div>
    </div>
  );
}

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const heroCopy = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function HeroSection() {
  return (
    <section className="bg-background pt-[clamp(48px,7vw,96px)] pb-[clamp(56px,8vw,110px)]">
      <motion.div
        className="mx-auto grid w-full max-w-[1120px] grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] px-10 lg:grid-cols-2 max-sm:px-[18px]"
        variants={heroContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={heroCopy}>
          <Eyebrow>A small experiment in fair pricing</Eyebrow>
          <h1 className="mt-[22px] text-[clamp(44px,6.6vw,88px)] font-medium leading-[0.96] tracking-[-0.045em] text-foreground [text-wrap:balance] max-sm:text-[40px]">
            Pay what you think <span className="text-primary">it&rsquo;s worth.</span>
          </h1>
          <p className="mt-[26px] text-[clamp(16.5px,1.3vw,19px)] leading-[1.55] text-muted-foreground max-w-[44ch] [text-wrap:pretty] max-sm:text-[15.5px]">
            Choose a document, enter any amount greater than&nbsp;$0, and unlock the download. Secure Stripe checkout, no upsells.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-[22px] gap-y-4 max-sm:mt-7">
            <Button size="lg" className="h-[52px] rounded-[11px] px-6 text-[15.5px] max-sm:w-full" asChild>
              <Link href="/documents">Browse Documents <ArrowRight size={17} /></Link>
            </Button>
          </div>
        </motion.div>

        <HeroVisual />
      </motion.div>
    </section>
  );
}
