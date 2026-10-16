"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { id: "explore", href: "/", label: "Explore" },
  { id: "writing", href: "/blog", label: "Writing" },
  { id: "ask", href: "/ask", label: "Ask" },
] as const;

type NavItemId = (typeof navItems)[number]["id"];

function getActiveItem(pathname: string): NavItemId | null {
  if (pathname === "/") return "explore";
  if (pathname.startsWith("/blog")) return "writing";
  if (pathname.startsWith("/ask")) return "ask";
  return null;
}

export function SiteNavigation() {
  const pathname = usePathname();
  const activeItem = getActiveItem(pathname);

  return (
    <nav className="site-mode-nav" aria-label="Primary navigation">
      <div className="site-mode-control">
        <span
          aria-hidden="true"
          className={`site-mode-indicator ${activeItem ? `is-${activeItem}` : "is-none"}`}
        />
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            scroll={item.id === "writing" ? undefined : false}
            aria-current={item.id === activeItem ? "page" : undefined}
            className="site-mode-link"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
