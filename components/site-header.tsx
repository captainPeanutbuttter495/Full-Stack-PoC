"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/wordmark";
import { Button } from "./ui/button";

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDocs = pathname.startsWith("/documents");

  return (
    <header className="flex items-center justify-between gap-3 pb-4 border-b border-border min-w-0 w-full max-w-[1120px] mx-auto max-sm:pb-3">
      <Wordmark />
      <nav className="flex gap-1" aria-label="Primary">
        <Button variant={isHome ? "default" : "ghost"} asChild>
          <Link href="/" aria-current={isHome ? "page" : undefined}>
            Home
          </Link>
        </Button>
        <Button variant={isDocs ? "default" : "ghost"} asChild>
          <Link href="/documents" aria-current={isDocs ? "page" : undefined}>
            Documents
          </Link>
        </Button>
      </nav>
    </header>
  );
}
