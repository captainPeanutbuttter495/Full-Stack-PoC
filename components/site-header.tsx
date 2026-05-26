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
    <header className="flex items-center justify-between gap-3 border-b min-w-0 w-full p-4 sticky top-0 z-10 bg-background">
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
