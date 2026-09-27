import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostRichContent } from "@/components/post-rich-content";
import { formatIsoDate } from "@/lib/date";
import { getLanguageLabel } from "@/lib/languages";
import {
  fetchPostBlocks,
  fetchPostBySlug,
  fetchPosts,
} from "@/lib/notion";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = await fetchPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  return {
    title: post.title,
    description: post.summary || post.content.slice(0, 150),
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const blocks = await fetchPostBlocks(post.id);
  const translationLine =
    post.originalLanguage &&
    post.displayLanguage &&
    post.originalLanguage !== post.displayLanguage
      ? `Translated from ${getLanguageLabel(post.originalLanguage)} to ${getLanguageLabel(post.displayLanguage)} by AI.`
      : null;

  return (
    <main className="reading-page">
      <article className="article-page">
        <Link href="/blog" className="article-back-link">
          <span aria-hidden="true">←</span> All articles
        </Link>

        <header className="article-page-header">
          <p className="article-page-meta">
            {formatIsoDate(post.date) || "Undated"}
            {post.displayLanguage
              ? ` · ${getLanguageLabel(post.displayLanguage)}`
              : ""}
          </p>
          <h1>{post.title}</h1>
          {post.summary ? <p className="article-deck">{post.summary}</p> : null}
          {post.tags.length ? (
            <div className="article-page-tags">
              {post.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          {translationLine ? (
            <p className="article-translation-note">{translationLine}</p>
          ) : null}
          {post.originalSource && post.originalUrl ? (
            <a
              href={post.originalUrl}
              rel="noreferrer"
              target="_blank"
              className="scene-text-link article-source-link"
            >
              Read the original on {post.originalSource}
              <span aria-hidden="true"> ↗</span>
            </a>
          ) : null}
        </header>

        <div className="article-rich-content">
          <PostRichContent blocks={blocks} fallbackContent={post.content} />
        </div>
      </article>
    </main>
  );
}

