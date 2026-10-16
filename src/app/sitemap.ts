import type { MetadataRoute } from "next";

import { toArticlePreviews } from "@/lib/explore-content";
import { localizePath, locales } from "@/lib/i18n";
import { fetchPosts } from "@/lib/notion";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedEntries(
  path: string,
  entry: Omit<SitemapEntry, "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(localizePath(locale, path))]),
  );

  return locales.map((locale) => ({
    ...entry,
    url: absoluteUrl(localizePath(locale, path)),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPosts();
  // Fallback previews have no full article, so only real posts are listed.
  const articles = posts.length ? toArticlePreviews(posts) : [];
  const latestArticleDate = articles[0]?.date ?? undefined;

  return [
    ...localizedEntries("/", {
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 1,
    }),
    ...localizedEntries("/blog", {
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    ...localizedEntries("/ask", {
      changeFrequency: "monthly",
      priority: 0.6,
    }),
    ...articles.flatMap((article) =>
      localizedEntries(`/blog/${article.slug}`, {
        lastModified: article.date ?? undefined,
        changeFrequency: "yearly",
        priority: 0.7,
      }),
    ),
  ];
}
