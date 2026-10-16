import { ImageResponse } from "next/og";

import { formatIsoDate } from "@/lib/date";
import { getDictionary } from "@/lib/dictionaries";
import {
  getExploreContent,
  getFallbackArticle,
  toArticlePreviews,
} from "@/lib/explore-content";
import type { Locale } from "@/lib/i18n";
import { fetchPostBySlug, isNotionConfigured } from "@/lib/notion";
import { OgCard, ogImageSize } from "@/lib/og-card";

export function renderSiteOgImage(locale: Locale) {
  const dictionary = getDictionary(locale);

  return new ImageResponse(
    (
      <OgCard
        title={`${getExploreContent(locale).tagline}.`}
        description={dictionary.og.siteDescription}
        footerLeft="blcnyy.dev"
        footerRight={dictionary.og.siteFooter}
      />
    ),
    ogImageSize,
  );
}

export async function renderArticleOgImage(slug: string, locale: Locale) {
  const dictionary = getDictionary(locale);
  const post = await fetchPostBySlug(slug);
  const article = post
    ? toArticlePreviews([post], locale)[0]
    : isNotionConfigured()
      ? null
      : getFallbackArticle(slug);
  const date = formatIsoDate(article?.date ?? null, locale);

  return new ImageResponse(
    (
      <OgCard
        title={article?.title ?? dictionary.og.writingFallback}
        footerLeft={date ? `blcnyy.dev/blog · ${date}` : "blcnyy.dev/blog"}
        footerRight={dictionary.og.articleCta}
      />
    ),
    ogImageSize,
  );
}
