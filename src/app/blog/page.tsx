import type { Metadata } from "next";
import Link from "next/link";

import { formatIsoDate } from "@/lib/date";
import { toArticlePreviews } from "@/lib/explore-content";
import { fetchPosts } from "@/lib/notion";
import { baseOpenGraph } from "@/lib/site";

const title = "Articles";
const description = "Writing by Ömer Balkan about technology, AI, and life.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    ...baseOpenGraph,
    type: "website",
    url: "/blog",
    title: `${title} | BLCNYY`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | BLCNYY`,
    description,
  },
};

export default async function BlogPage() {
  const articles = toArticlePreviews(await fetchPosts());

  return (
    <main className="reading-page article-index-page">
      <header className="reading-header article-index-header">
        <p className="scene-kicker">Writing</p>
        <h1>Articles</h1>
        <p>Notes and essays about technology, AI, and life.</p>
      </header>

      <div className="article-index-grid">
        {articles.map((article, index) => {
          const date = formatIsoDate(article.date);

          return (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className={`article-index-card ${index === 0 ? "is-latest" : ""}`}
            >
              <div className="article-preview-meta">
                <span>
                  {index === 0 ? ["Latest", date].filter(Boolean).join(" · ") : date}
                </span>
                <span aria-hidden="true">→</span>
              </div>
              <h2>{article.title}</h2>
              {article.summary ? <p>{article.summary}</p> : null}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
