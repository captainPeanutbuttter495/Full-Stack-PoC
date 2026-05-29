import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight} from 'lucide-react'

const STEPS = [
  ["01", "Browse", "Skim the library and open anything that looks useful."],
  ["02", "Name your price", "Type any amount over $0 — a dollar, ten, fifty."],
  ["03", "Download", "Submit and the file unlocks. That's the whole flow."],
] as const;

function Hero() {
  return (
    <section className="flex h-svh min-h-[400px] flex-col justify-center pt-8 pb-4 w-full max-w-[1120px] mx-auto max-sm:pt-2 max-sm:pb-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        A small experiment in fair pricing
      </span>
      <h1 className="mt-3.5 font-medium leading-none tracking-[-0.035em] text-[clamp(40px,5.4vw,64px)] [text-wrap:balance] break-words max-sm:text-[40px] max-sm:leading-[1.02]">
        Pay what you think
        <br />
        it&apos;s worth.
      </h1>
      <p className="mt-[18px] text-[17px] leading-relaxed text-foreground/80 max-w-[52ch] text-pretty max-sm:text-[15.5px] max-sm:mt-3.5">
        Choose a document, enter any amount greater than&nbsp;$0, and unlock the
        download. No accounts, no upsells.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3 max-sm:mt-5">
        <Button size='lg' asChild>
          <Link href="/documents">
            Browse Documents
            <ArrowRight className="ml-2" size={16} />
          </Link>
        </Button>
        <span className="font-mono text-[11px] text-muted-foreground">
          6 seeded documents · proof of concept
        </span>
      </div>

      <ol
        className="mt-14 pt-7 border-t border-border grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-7"
        aria-label="How it works"
      >
        {STEPS.map(([num, title, desc]) => (
          <li key={num} className="flex gap-3.5 items-start">
            <span className="font-mono shrink-0 mt-0.5 rounded-md border border-border px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">
              {num}
            </span>
            <div>
              <div className="text-[15px] font-medium">{title}</div>
              <div className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {desc}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Home() {
  return <Hero />;
}
