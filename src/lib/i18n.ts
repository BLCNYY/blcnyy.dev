export const locales = ["en", "tr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  tr: "tr_TR",
};

export const dateLocales: Record<Locale, string> = {
  en: "en-US",
  tr: "tr-TR",
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value);

// English lives at the root and Turkish under /tr.
export function localizePath(locale: Locale, path: string) {
  if (locale === defaultLocale) {
    return path;
  }

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function getLocaleFromPath(pathname: string): Locale {
  return pathname === "/tr" || pathname.startsWith("/tr/") ? "tr" : "en";
}

export function stripLocale(pathname: string) {
  if (pathname === "/tr") {
    return "/";
  }

  return pathname.startsWith("/tr/") ? pathname.slice(3) : pathname;
}

export function languageAlternates(path: string) {
  return {
    en: localizePath("en", path),
    tr: localizePath("tr", path),
    "x-default": localizePath("en", path),
  };
}

// Set when a visitor picks a language themselves, so it wins over the
// browser's language on later visits. Read by src/proxy.ts.
export const LOCALE_COOKIE = "locale";

export function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

// The visitor's top language from an Accept-Language header, which browsers
// fill from the system language. Only the first choice counts, so someone
// who prefers English and also reads Turkish stays on English.
export function getPreferredLocale(acceptLanguage: string | null): Locale | null {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((entry, order) => {
      const [tag, ...params] = entry.trim().split(";");
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const weight = quality ? Number(quality.slice(2)) : 1;

      return {
        language: tag.trim().toLowerCase().split("-")[0],
        order,
        weight: Number.isFinite(weight) ? weight : 0,
      };
    })
    .filter(({ language, weight }) => language && language !== "*" && weight > 0)
    .sort((a, b) => b.weight - a.weight || a.order - b.order);

  const top = ranked[0]?.language;
  return isLocale(top) ? top : null;
}
