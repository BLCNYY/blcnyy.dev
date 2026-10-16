"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { getDictionary } from "@/lib/dictionaries";
import {
  getLocaleFromPath,
  localeNames,
  locales,
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

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="site-language-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M2.75 12h18.5" />
      <path d="M12 2.75c2.4 2.5 3.6 5.6 3.6 9.25S14.4 18.75 12 21.25C9.6 18.75 8.4 15.65 8.4 12S9.6 5.25 12 2.75Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="site-language-check"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function LanguageMenu({
  basePath,
  locale,
}: {
  basePath: string;
  locale: Locale;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const dictionary = getDictionary(locale);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="site-language">
      <button
        ref={buttonRef}
        type="button"
        className="site-language-button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={dictionary.nav.changeLanguage}
        title={dictionary.nav.changeLanguage}
        onClick={() => setIsOpen((open) => !open)}
      >
        <GlobeIcon />
      </button>

      <ul
        id={menuId}
        className="site-language-menu"
        aria-label={dictionary.nav.languages}
        hidden={!isOpen}
      >
        {locales.map((option) => {
          const isCurrent = option === locale;

          return (
            <li key={option}>
              <Link
                href={localizePath(option, basePath)}
                hrefLang={option}
                lang={option}
                aria-current={isCurrent ? "true" : undefined}
                className="site-language-option"
                onClick={() => setIsOpen(false)}
              >
                <span>{localeNames[option]}</span>
                {isCurrent ? (
                  <CheckIcon />
                ) : (
                  <span className="site-language-code" aria-hidden="true">
                    {option.toUpperCase()}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SiteNavigation() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const basePath = stripLocale(pathname);
  const activeItem = getActiveItem(basePath);
  const dictionary = getDictionary(locale);

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
      <LanguageMenu key={pathname} basePath={basePath} locale={locale} />
    </nav>
  );
}
