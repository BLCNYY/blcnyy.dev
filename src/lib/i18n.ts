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
