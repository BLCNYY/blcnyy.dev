"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNavigation() {
  const pathname = usePathname();
  const isAsk = pathname.startsWith("/ask");

  return (
    <nav className="site-mode-nav" aria-label="Primary navigation">
      <div className="site-mode-control">
        <span
          aria-hidden="true"
          className={`site-mode-indicator ${isAsk ? "is-ask" : "is-explore"}`}
        />
        <Link
          href="/"
          scroll={false}
          aria-current={isAsk ? undefined : "page"}
          className="site-mode-link"
        >
          Explore
        </Link>
        <Link
          href="/ask"
          scroll={false}
          aria-current={isAsk ? "page" : undefined}
          className="site-mode-link"
        >
          Ask
        </Link>
      </div>
    </nav>
  );
}

