import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="reading-page not-found-page">
      <div className="reading-header not-found-copy">
        <p className="scene-kicker">404</p>
        <h1>This page wandered off.</h1>
        <p>
          The link may be old or mistyped. Try one of these instead.
        </p>
        <div className="not-found-links">
          <Link href="/" className="scene-text-link">
            Explore <span aria-hidden="true">→</span>
          </Link>
          <Link href="/blog" className="scene-text-link">
            All articles <span aria-hidden="true">→</span>
          </Link>
          <Link href="/ask" className="scene-text-link">
            Ask anything <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
