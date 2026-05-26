"use client";

import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getAllDocuments } from "@/lib/documents";

export default function DocumentsPage() {
  const handleTestClick = async () => {
    const result = await getAllDocuments();
    console.log(result);
  };

  return (
    <main className="flex min-h-screen flex-col gap-8 bg-[oklch(0.985_0.005_95)] px-10 pt-8 pb-6 font-sans text-[oklch(0.2_0.012_80)] tracking-[-0.005em] overflow-x-hidden max-sm:px-[18px] max-sm:pt-5 max-sm:pb-4 max-sm:gap-6">
      <SiteHeader activePage="documents" />

      <section className="flex flex-1 flex-col items-center justify-center w-full max-w-[1120px] mx-auto">
        <p className="font-mono text-[13px] text-[oklch(0.52_0.012_80)]">
          Documents will appear here.
        </p>
        <button onClick={handleTestClick}>test</button>
      </section>

      <SiteFooter />
    </main>
  );
}
