import Link from "next/link";
import Wordmark from "@/components/wordmark";
import { Button } from "./ui/button";


export default function SiteHeader({
  activePage,
}: {
  activePage: "home" | "documents";
}) {
  return (
    <header className="flex items-center justify-between gap-3 pb-4 border-b border-[oklch(0.9_0.006_95)] min-w-0 w-full max-w-[1120px] mx-auto max-sm:pb-3">
      <Wordmark />
      <nav className="flex gap-1" aria-label="Primary">
        <Button variant={ activePage == 'home' ? 'default' : 'ghost' } asChild>
          <Link
            href="/"
            aria-current={activePage === "home" ? "page" : undefined}
          >
            Home
          </Link>
        </Button>
        <Button variant={ activePage == 'documents' ? 'default' : 'ghost' } asChild>
          <Link
            href="/documents"
            aria-current={activePage === "documents" ? "page" : undefined}
          >
            Documents
          </Link>
        </Button>
      </nav>
    </header>
  );
}
