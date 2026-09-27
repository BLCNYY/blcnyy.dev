import type { Metadata } from "next";
import Link from "next/link";

import { formatIsoDate } from "@/lib/date";
import { getArticlePreviews } from "@/lib/explore-content";
import { fetchPosts } from "@/lib/notion";

export const metadata: Metadata = {
  title: "Articles",
  description: "Writing by Ömer Balkan about technology, AI, and life.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await fetchPosts();
  const articles = posts.length
    ? posts.map(({ id, title, summary, date, slug, tags }) => ({
        id,
        title,
        summary,
        date,
        slug,
        tags,
      }))
    : getArticlePreviews(posts);

  return (
    <main className="reading-page article-index-page">
      <header className="reading-header article-index-header">
        <p className="scene-kicker">Writing</p>
        <h1>Articles</h1>
        <p>Notes and essays about technology, AI, and life.</p>
      </header>

      <div className="article-index-grid">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            className={`article-index-card ${index === 0 ? "is-latest" : ""}`}
          >
            <div className="article-preview-meta">
              <span>{index === 0 ? "Latest" : formatIsoDate(article.date)}</span>
              <span aria-hidden="true">↗</span>
            </div>
            <h2>{article.title}</h2>
            {article.summary ? <p>{article.summary}</p> : null}
          </Link>
        ))}
      </div>
    </main>
  );
}

