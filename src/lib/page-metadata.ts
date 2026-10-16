import type { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import {
  getFallbackArticle,
  toArticlePreviews,
} from "@/lib/explore-content";
import {
  languageAlternates,
  localizePath,
  ogLocales,
  type Locale,
} from "@/lib/i18n";
import { fetchPostBySlug, isNotionConfigured } from "@/lib/notion";
import { baseOpenGraph, siteConfig } from "@/lib/site";
import { truncateAtWord } from "@/lib/text";

type PageMetadataOptions = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
};

function buildPageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const url = localizePath(locale, path);
  const fullTitle = absoluteTitle ? title : `${title} | BLCNYY`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      ...baseOpenGraph,
      locale: ogLocales[locale],
      type: "website",
      url,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      creator: siteConfig.xHandle,
    },
  };
}

export function homeMetadata(locale: Locale): Metadata {
  return buildPageMetadata({
    locale,
    path: "/",
    title: siteConfig.title,
    description: getDictionary(locale).meta.siteDescription,
    absoluteTitle: true,
  });
}

export function blogIndexMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);

  return buildPageMetadata({
    locale,
    path: "/blog",
    title: meta.blogTitle,
    description: meta.blogDescription,
  });
}

export function askMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);

  return buildPageMetadata({
    locale,
    path: "/ask",
    title: meta.askTitle,
    description: meta.askDescription,
  });
}

export async function articleMetadata(
  slug: string,
  locale: Locale,
): Promise<Metadata> {
  const post = await fetchPostBySlug(slug);
  const article = post
    ? toArticlePreviews([post], locale)[0]
    : isNotionConfigured()
      ? null
      : getFallbackArticle(slug);

  if (!article) {
    return {
      title: getDictionary(locale).meta.articleNotFound,
      robots: { index: false },
    };
  }

  const version = post?.versions.find((entry) => entry.language === article.language);
  const description =
    article.summary ||
    truncateAtWord(version ? version.content.map((item) => item.plain_text).join("") : "", 155);
  const path = `/blog/${article.slug}`;
  const url = localizePath(locale, path);

  return {
    title: article.title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      ...baseOpenGraph,
      locale: ogLocales[locale],
      type: "article",
      url,
      title: article.title,
      description,
      publishedTime: article.date ?? undefined,
      authors: [siteConfig.url],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      creator: siteConfig.xHandle,
    },
  };
}
