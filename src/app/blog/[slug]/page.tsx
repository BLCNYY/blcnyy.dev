import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArticleReader,
  type ArticleReaderVersion,
} from "@/components/article-reader";
import { PostRichContent } from "@/components/post-rich-content";
import { formatIsoDate } from "@/lib/date";
import {
  getFallbackArticle,
  getFallbackArticleSlugs,
} from "@/lib/explore-content";
import { getLanguageLabel, getLanguageOption } from "@/lib/languages";
import {
  fetchPostBlocks,
  fetchPostBySlug,
  fetchPosts,
  isNotionConfigured,
  type NotionPost,
} from "@/lib/notion";
import {
  absoluteUrl,
  baseOpenGraph,
  serializeJsonLd,
  siteConfig,
} from "@/lib/site";
import { truncateAtWord } from "@/lib/text";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getFallback = (slug: string) =>
  isNotionConfigured() ? null : getFallbackArticle(slug);

export async function generateStaticParams() {
  const posts = await fetchPosts();
  const slugs = posts.length
    ? posts.map((post) => post.slug)
    : isNotionConfigured()
      ? []
      : getFallbackArticleSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  const article = post ?? getFallback(slug);

  if (!article) {
    return { title: "Article Not Found", robots: { index: false } };
  }

  const description =
    article.summary || truncateAtWord(post?.content ?? "", 155);
  const path = `/blog/${article.slug}`;

  return {
    title: article.title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      url: path,
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

function buildVersions(
  post: NotionPost,
  blocks: Awaited<ReturnType<typeof fetchPostBlocks>>,
): ArticleReaderVersion[] {
  const blocksLanguage =
    post.originalLanguage &&
    post.versions.some((version) => version.language === post.originalLanguage)
      ? post.originalLanguage
      : (post.versions[0]?.language ?? null);

  return post.versions.map((version, index) => {
    const option = version.language ? getLanguageOption(version.language) : null;
    const isOriginal = Boolean(
      version.language && version.language === post.originalLanguage,
    );
    const useBlocks = blocks.length > 0 && version.language === blocksLanguage;
    const note =
      version.language &&
      post.originalLanguage &&
      version.language !== post.originalLanguage
        ? `Translated from ${getLanguageLabel(post.originalLanguage)} by AI.`
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
}

function BackLink() {
  return (
    <Link href="/blog" className="article-back-link">
      <span aria-hidden="true">←</span> All articles
    </Link>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    const fallback = getFallback(slug);

    if (!fallback) {
      notFound();
    }

    return (
      <main className="reading-page">
        <article className="article-page">
          <BackLink />
          <ArticleReader
            dateLabel={formatIsoDate(fallback.date) || "Undated"}
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
                body: (
                  <p>
                    The full article isn&apos;t available right now. Please check
                    back soon.
                  </p>
                ),
              },
            ]}
          />
        </article>
      </main>
    );
  }

  const blocks = await fetchPostBlocks(post.id);
  const path = `/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary || truncateAtWord(post.content, 155),
    datePublished: post.date ?? undefined,
    inLanguage: post.displayLanguage ?? undefined,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl(`${path}/opengraph-image`),
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.url,
    },
    isBasedOn: post.originalUrl || undefined,
  };

  return (
    <main className="reading-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <article className="article-page">
        <BackLink />
        <ArticleReader
          dateLabel={formatIsoDate(post.date) || "Undated"}
          tags={post.tags}
          versions={buildVersions(post, blocks)}
          source={
            post.originalSource && post.originalUrl ? (
              <a
                href={post.originalUrl}
                rel="noreferrer"
                target="_blank"
                className="scene-text-link article-source-link"
              >
                Read the original on {post.originalSource}
                <span aria-hidden="true"> ↗</span>
              </a>
            ) : null
          }
        />
      </article>
    </main>
  );
}
