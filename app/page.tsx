import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

const STEPS = [
  ["01", "Browse", "Skim the library and open anything that looks useful."],
  ["02", "Name your price", "Type any amount over $0 — a dollar, ten, fifty."],
  ["03", "Download", "Submit and the file unlocks. That's the whole flow."],
] as const;

function Hero() {
  return (
    <section className="flex flex-1 flex-col pt-8 pb-4 w-full max-w-[1120px] mx-auto max-sm:pt-2 max-sm:pb-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[oklch(0.52_0.012_80)]">
        A small experiment in fair pricing
      </span>
      <h1 className="mt-3.5 font-medium leading-none tracking-[-0.035em] text-[clamp(40px,5.4vw,64px)] [text-wrap:balance] break-words max-sm:text-[40px] max-sm:leading-[1.02]">
        Pay what you think
        <br />
        it&apos;s worth.
      </h1>
      <p className="mt-[18px] text-[17px] leading-relaxed text-[oklch(0.32_0.012_80)] max-w-[52ch] [text-wrap:pretty] max-sm:text-[15.5px] max-sm:mt-3.5">
        Choose a document, enter any amount greater than&nbsp;$0, and unlock the
        download. No accounts, no upsells.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3 max-sm:mt-5">
        <Link
          href="/documents"
          className="group inline-flex items-center justify-center gap-2 h-11 min-h-11 px-[18px] rounded-[9px] text-[14.5px] font-medium tracking-[-0.005em] no-underline whitespace-nowrap bg-[oklch(0.45_0.13_155)] text-[oklch(0.97_0.02_155)] hover:bg-[oklch(0.4_0.13_155)] active:translate-y-px transition-all duration-[120ms] ease-out"
          style={{
            boxShadow:
              "inset 0 1px 0 oklch(0.35 0.13 155), 0 1px 1px oklch(0.4 0.13 155 / 0.2)",
          }}
        >
          Browse Documents
          <span
            className="font-mono text-sm opacity-90 transition-transform duration-[160ms] ease-out group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            →
          </span>
        </Link>
        <span className="font-mono text-[11px] text-[oklch(0.52_0.012_80)]">
          6 seeded documents · proof of concept
        </span>
      </div>

      <ol
        className="mt-14 pt-7 border-t border-[oklch(0.9_0.006_95)] grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-7"
        aria-label="How it works"
      >
        {STEPS.map(([num, title, desc]) => (
          <li key={num} className="flex gap-3.5 items-start">
            <span className="font-mono shrink-0 mt-0.5 rounded-md border border-[oklch(0.85_0.008_95)] px-1.5 py-0.5 text-[11px] leading-none text-[oklch(0.52_0.012_80)]">
              {num}
            </span>
            <div>
              <div className="text-[15px] font-medium">{title}</div>
              <div className="mt-0.5 text-[13.5px] leading-relaxed text-[oklch(0.52_0.012_80)]">
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
  return (
    <main className="flex min-h-screen flex-col gap-8 bg-[oklch(0.985_0.005_95)] px-10 pt-8 pb-6 font-sans text-[oklch(0.2_0.012_80)] tracking-[-0.005em] overflow-x-hidden max-sm:px-[18px] max-sm:pt-5 max-sm:pb-4 max-sm:gap-6">
      <SiteHeader activePage="home" />
      <Hero />
      <SiteFooter />
    </main>
  );
}
