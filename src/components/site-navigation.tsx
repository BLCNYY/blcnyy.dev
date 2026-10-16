"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getDictionary } from "@/lib/dictionaries";
import {
  getLocaleFromPath,
  localizePath,
  stripLocale,
  type Locale,
} from "@/lib/i18n";

const navItems = [
  { id: "explore", href: "/" },
  { id: "writing", href: "/blog" },
  { id: "ask", href: "/ask" },
] as const;

type NavItemId = (typeof navItems)[number]["id"];

function getActiveItem(path: string): NavItemId | null {
  if (path === "/") return "explore";
  if (path.startsWith("/blog")) return "writing";
  if (path.startsWith("/ask")) return "ask";
  return null;
}

export function SiteNavigation() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const basePath = stripLocale(pathname);
  const activeItem = getActiveItem(basePath);
  const dictionary = getDictionary(locale);
  const otherLocale: Locale = locale === "en" ? "tr" : "en";

  // The root layout renders lang="en"; keep it in sync on Turkish pages.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <nav className="site-mode-nav" aria-label={dictionary.nav.label} lang={locale}>
      <div className="site-mode-control">
        <span
          aria-hidden="true"
          className={`site-mode-indicator ${activeItem ? `is-${activeItem}` : "is-none"}`}
        />
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={localizePath(locale, item.href)}
            scroll={item.id === "writing" ? undefined : false}
            aria-current={item.id === activeItem ? "page" : undefined}
            className="site-mode-link"
          >
            {dictionary.nav[item.id]}
          </Link>
        ))}
      </div>
      <Link
        href={localizePath(otherLocale, basePath)}
        hrefLang={otherLocale}
        lang={dictionary.nav.switchToLang}
        aria-label={dictionary.nav.switchToLabel}
        title={dictionary.nav.switchToLabel}
        className="site-language-link"
      >
        {dictionary.nav.switchTo}
      </Link>
    </nav>
  );
}
