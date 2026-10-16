export const siteConfig = {
  url: "https://www.blcnyy.dev",
  name: "BLCNYY",
  title: "BLCNYY — Ömer Balkan",
  description:
    "Explore Ömer Balkan's story, projects, writing, and personal AI profile.",
  author: "Ömer Balkan",
  avatarUrl: "https://github.com/BLCNYY.png",
  locale: "en_US",
  xHandle: "@BLCNYY",
} as const;

export const instagram = {
  handle: "@blcnyy",
  url: "https://www.instagram.com/blcnyy/",
} as const;

export const socialLinks = [
  { label: "X", url: "https://x.com/BLCNYY" },
  { label: "Instagram", url: instagram.url },
  { label: "GitHub", url: "https://github.com/BLCNYY" },
] as const;

export const absoluteUrl = (path = "/") =>
  new URL(path, siteConfig.url).toString();

export const baseOpenGraph = {
  siteName: siteConfig.name,
  locale: siteConfig.locale,
} as const;

export function serializeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
