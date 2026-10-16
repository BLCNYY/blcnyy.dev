import Link from "next/link";

import { formatIsoDate } from "@/lib/date";
import { getDictionary } from "@/lib/dictionaries";
import { toArticlePreviews } from "@/lib/explore-content";
import { localizePath, type Locale } from "@/lib/i18n";
import { fetchPosts } from "@/lib/notion";

export async function BlogIndexPage({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const articles = toArticlePreviews(await fetchPosts(), locale);

  return (
    <main className="reading-page article-index-page" lang={locale}>
      <header className="reading-header article-index-header">
        <p className="scene-kicker">{dictionary.blog.kicker}</p>
        <h1>{dictionary.blog.title}</h1>
        <p>{dictionary.blog.intro}</p>
      </header>

      <div className="article-index-grid">
        {articles.map((article, index) => {
          const date = formatIsoDate(article.date, locale);
          const languageNote =
            article.language && article.language !== locale
              ? dictionary.languageNames[article.language]
              : "";
          const meta = [
            index === 0 ? dictionary.blog.latest : "",
            date,
            languageNote,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Link
              key={article.id}
              href={localizePath(locale, `/blog/${article.slug}`)}
              className={`article-index-card ${index === 0 ? "is-latest" : ""}`}
            >
              <div className="article-preview-meta">
                <span>{meta}</span>
                <span aria-hidden="true">→</span>
              </div>
              <h2 lang={article.language ?? undefined}>{article.title}</h2>
              {article.summary ? (
                <p lang={article.language ?? undefined}>{article.summary}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
