import Link from "next/link";
import Wordmark from "@/components/wordmark";

const linkBase =
  "text-sm px-2.5 py-1.5 rounded-md no-underline whitespace-nowrap text-[oklch(0.32_0.012_80)] hover:bg-[oklch(0.965_0.006_95)] hover:text-[oklch(0.2_0.012_80)] max-sm:px-2";
const linkActive = "text-[oklch(0.2_0.012_80)] bg-[oklch(0.965_0.006_95)]";

export default function SiteHeader({
  activePage,
}: {
  activePage: "home" | "documents";
}) {
  return (
    <header className="flex items-center justify-between gap-3 pb-4 border-b border-[oklch(0.9_0.006_95)] min-w-0 w-full max-w-[1120px] mx-auto max-sm:pb-3">
      <Wordmark />
      <nav className="flex gap-1" aria-label="Primary">
        <Link
          href="/"
          className={`${linkBase} ${activePage === "home" ? linkActive : ""}`}
          aria-current={activePage === "home" ? "page" : undefined}
        >
          Home
        </Link>
        <Link
          href="/documents"
          className={`${linkBase} ${activePage === "documents" ? linkActive : ""}`}
          aria-current={activePage === "documents" ? "page" : undefined}
        >
          Documents
        </Link>
      </nav>
    </header>
  );
}
