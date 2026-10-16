import type { MetadataRoute } from "next";

import { toArticlePreviews } from "@/lib/explore-content";
import { fetchPosts } from "@/lib/notion";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPosts();
  // Fallback previews have no full article, so only real posts are listed.
  const articles = posts.length ? toArticlePreviews(posts) : [];
  const latestArticleDate = articles[0]?.date ?? undefined;

  return [
    {
      url: absoluteUrl("/"),
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/ask"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...articles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: article.date ?? undefined,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
