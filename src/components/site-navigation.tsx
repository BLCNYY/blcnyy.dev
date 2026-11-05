"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { initSound, toggleSound, useSoundEnabled } from "@/lib/ambient-sound";
import { requestTiltPermission } from "@/lib/device-tilt";
import { getDictionary } from "@/lib/dictionaries";
import { SECRET_IDS, useFoundSecrets } from "@/lib/easter-eggs";
import {
  getLocaleFromPath,
  localeNames,
  locales,
  localizePath,
  rememberLocale,
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

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="site-sound-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z" />
      {on ? (
        <>
          <path className="site-sound-wave" d="M15.6 9.2a4 4 0 0 1 0 5.6" />
          <path className="site-sound-wave is-outer" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
        </>
      ) : (
        <path d="m16 9.5 5 5m0-5-5 5" />
      )}
    </svg>
  );
}

// Off by default. Turning it on is also the tap iPhones need before they share
// tilt with the particles.
function SoundToggle({ locale }: { locale: Locale }) {
  const isOn = useSoundEnabled();
  const dictionary = getDictionary(locale);
  const label = isOn ? dictionary.nav.soundOff : dictionary.nav.soundOn;

  useEffect(() => {
    initSound();
  }, []);

  return (
    <button
      type="button"
      className="site-sound-button"
      aria-pressed={isOn}
      aria-label={label}
      title={label}
      onClick={() => {
        toggleSound();

        if (!isOn) {
          requestTiltPermission();
        }
      }}
    >
      <SoundIcon on={isOn} />
    </button>
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
  const foundSecrets = useFoundSecrets();

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
                onClick={() => {
                  rememberLocale(option);
                  setIsOpen(false);
                }}
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
        {foundSecrets.length ? (
          <li
            className="site-language-secrets"
            aria-label={dictionary.eggs.secretsCount(
              foundSecrets.length,
              SECRET_IDS.length,
            )}
          >
            <span aria-hidden="true">🥚</span>
            <span aria-hidden="true">
              {foundSecrets.length}/{SECRET_IDS.length}
            </span>
          </li>
        ) : null}
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
      <SoundToggle locale={locale} />
      <LanguageMenu key={pathname} basePath={basePath} locale={locale} />
    </nav>
  );
}
