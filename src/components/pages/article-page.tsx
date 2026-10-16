import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArticleReader,
  type ArticleReaderVersion,
} from "@/components/article-reader";
import { PostRichContent } from "@/components/post-rich-content";
import { formatIsoDate } from "@/lib/date";
import { getDictionary } from "@/lib/dictionaries";
import {
  getFallbackArticle,
  getFallbackArticleSlugs,
} from "@/lib/explore-content";
import { localizePath, type Locale } from "@/lib/i18n";
import { getLanguageOption } from "@/lib/languages";
import {
  fetchPostBlocks,
  fetchPostBySlug,
  fetchPosts,
  isNotionConfigured,
  type NotionPost,
} from "@/lib/notion";
import { absoluteUrl, serializeJsonLd, siteConfig } from "@/lib/site";
import { truncateAtWord } from "@/lib/text";

export async function generateArticleStaticParams() {
  const posts = await fetchPosts();
  const slugs = posts.length
    ? posts.map((post) => post.slug)
    : isNotionConfigured()
      ? []
      : getFallbackArticleSlugs();

  return slugs.map((slug) => ({ slug }));
}

type ArticlePageProps = {
  slug: string;
  locale: Locale;
};

function buildVersions(
  post: NotionPost,
  blocks: Awaited<ReturnType<typeof fetchPostBlocks>>,
  locale: Locale,
): ArticleReaderVersion[] {
  const dictionary = getDictionary(locale);
  const blocksLanguage =
    post.originalLanguage &&
    post.versions.some((version) => version.language === post.originalLanguage)
      ? post.originalLanguage
      : (post.versions[0]?.language ?? null);

  const versions = post.versions.map((version, index) => {
    const option = version.language ? getLanguageOption(version.language) : null;
    const isOriginal = Boolean(
      version.language && version.language === post.originalLanguage,
    );
    const useBlocks = blocks.length > 0 && version.language === blocksLanguage;
    const note =
      version.language &&
      post.originalLanguage &&
      version.language !== post.originalLanguage
        ? dictionary.article.translatedFrom(
            dictionary.languageNames[post.originalLanguage],
          )
        : null;

    return {
      id: version.language ?? `version-${index}`,
      lang: version.language,
      label: option?.nativeLabel ?? "",
      short: option?.short ?? "",
      isOriginal,
      title: version.title || post.title,
      summary: version.summary,
      note,
      body: useBlocks ? (
        <PostRichContent blocks={blocks} />
      ) : (
        <PostRichContent content={version.content} />
      ),
    };
  });

  // Open in the site language when the article has it.
  const preferredIndex = versions.findIndex((version) => version.lang === locale);

  return preferredIndex > 0
    ? [
        versions[preferredIndex],
        ...versions.filter((_, index) => index !== preferredIndex),
      ]
    : versions;
}

function BackLink({ locale }: { locale: Locale }) {
  return (
    <Link href={localizePath(locale, "/blog")} className="article-back-link">
      <span aria-hidden="true">←</span> {getDictionary(locale).article.allArticles}
    </Link>
  );
}

export async function ArticlePage({ slug, locale }: ArticlePageProps) {
  const dictionary = getDictionary(locale);
  const labels = {
    languageGroup: dictionary.article.languageGroup,
    original: dictionary.article.original,
  };
  const post = await fetchPostBySlug(slug);

  if (!post) {
    const fallback = isNotionConfigured() ? null : getFallbackArticle(slug);

    if (!fallback) {
      notFound();
    }

    return (
      <main className="reading-page" lang={locale}>
        <article className="article-page">
          <BackLink locale={locale} />
          <ArticleReader
            dateLabel={
              formatIsoDate(fallback.date, locale) || dictionary.article.undated
            }
            labels={labels}
            source={null}
            tags={fallback.tags}
            versions={[
              {
                id: "en",
                lang: "en",
                label: "English",
                short: "EN",
                isOriginal: true,
                title: fallback.title,
                summary: fallback.summary,
                note: null,
                body: <p lang={locale}>{dictionary.article.unavailable}</p>,
              },
            ]}
          />
        </article>
      </main>
    );
  }

  const blocks = await fetchPostBlocks(post.id);
  const versions = buildVersions(post, blocks, locale);
  const primary = versions[0];
  const url = absoluteUrl(localizePath(locale, `/blog/${post.slug}`));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: primary?.title ?? post.title,
    description: primary?.summary || truncateAtWord(post.content, 155),
    datePublished: post.date ?? undefined,
    inLanguage: primary?.lang ?? undefined,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    url,
    mainEntityOfPage: url,
    image: `${url}/opengraph-image`,
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.url,
    },
    isBasedOn: post.originalUrl || undefined,
  };

  return (
    <main className="reading-page" lang={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <article className="article-page">
        <BackLink locale={locale} />
        <ArticleReader
          dateLabel={formatIsoDate(post.date, locale) || dictionary.article.undated}
          labels={labels}
          tags={post.tags}
          versions={versions}
          source={
            post.originalSource && post.originalUrl ? (
              <a
                href={post.originalUrl}
                rel="noreferrer"
                target="_blank"
                className="scene-text-link article-source-link"
              >
                {dictionary.article.originalSource(post.originalSource)}
                <span aria-hidden="true"> ↗</span>
              </a>
            ) : null
          }
        />
      </article>
    </main>
  );
}
