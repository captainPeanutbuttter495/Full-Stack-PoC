import Link from "next/link";

function Wordmark() {
  return (
    <div className="pwyw-row pwyw-gap-2 pwyw-items-center">
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--accent)",
          display: "inline-block",
        }}
      />
      <span className="pwyw-font-medium pwyw-tracking-tight pwyw-text-base">
        Openleaf
      </span>
    </div>
  );
}

function Header() {
  return (
    <header className="pwyw-header">
      <Wordmark />
      <nav className="pwyw-row pwyw-gap-1" aria-label="Primary">
        <Link
          href="/"
          className="pwyw-nav-link"
          data-active="true"
          aria-current="page"
        >
          Home
        </Link>
        <Link href="/documents" className="pwyw-nav-link">
          Documents
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="pwyw-footer">
      <span className="pwyw-mono pwyw-text-xs pwyw-muted">
        © 2026 Openleaf · Pay what you want
      </span>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="pwyw-page">
      <Header />
      <Footer />
    </main>
  );
}
