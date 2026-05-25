import Link from "next/link";
import Wordmark from "@/components/wordmark";

export default function SiteHeader({
  activePage,
}: {
  activePage: "home" | "documents";
}) {
  return (
    <header className="pwyw-header">
      <Wordmark />
      <nav className="pwyw-row pwyw-gap-1" aria-label="Primary">
        <Link
          href="/"
          className="pwyw-nav-link"
          data-active={activePage === "home" ? "true" : undefined}
          aria-current={activePage === "home" ? "page" : undefined}
        >
          Home
        </Link>
        <Link
          href="/documents"
          className="pwyw-nav-link"
          data-active={activePage === "documents" ? "true" : undefined}
          aria-current={activePage === "documents" ? "page" : undefined}
        >
          Documents
        </Link>
      </nav>
    </header>
  );
}
