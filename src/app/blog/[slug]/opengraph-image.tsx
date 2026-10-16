import { ImageResponse } from "next/og";

import { formatIsoDate } from "@/lib/date";
import { getFallbackArticle } from "@/lib/explore-content";
import { fetchPostBySlug, isNotionConfigured } from "@/lib/notion";
import { OgCard, ogImageSize } from "@/lib/og-card";
import { siteConfig } from "@/lib/site";

export const alt = `Article by ${siteConfig.author}`;
export const size = ogImageSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article =
    (await fetchPostBySlug(slug)) ??
    (isNotionConfigured() ? null : getFallbackArticle(slug));
  const date = formatIsoDate(article?.date ?? null);

  return new ImageResponse(
    (
      <OgCard
        title={article?.title ?? "Writing"}
        footerLeft={date ? `blcnyy.dev/blog · ${date}` : "blcnyy.dev/blog"}
        footerRight="Read the article →"
      />
    ),
    size,
  );
}
