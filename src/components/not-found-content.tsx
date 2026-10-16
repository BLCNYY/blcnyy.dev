"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getDictionary } from "@/lib/dictionaries";
import { getLocaleFromPath, localizePath, type Locale } from "@/lib/i18n";

export function NotFoundContent({ locale: fixedLocale }: { locale?: Locale }) {
  const pathname = usePathname();
  const locale = fixedLocale ?? getLocaleFromPath(pathname);
  const copy = getDictionary(locale).notFound;

  return (
    <main className="reading-page not-found-page" lang={locale}>
      <div className="reading-header not-found-copy">
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <div className="not-found-links">
          <Link href={localizePath(locale, "/")} className="scene-text-link">
            {copy.explore} <span aria-hidden="true">→</span>
          </Link>
          <Link href={localizePath(locale, "/blog")} className="scene-text-link">
            {copy.articles} <span aria-hidden="true">→</span>
          </Link>
          <Link href={localizePath(locale, "/ask")} className="scene-text-link">
            {copy.ask} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
