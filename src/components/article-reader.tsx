"use client";

import { type ReactNode, useEffect, useState } from "react";

export type ArticleReaderVersion = {
  id: string;
  lang: string | null;
  label: string;
  short: string;
  isOriginal: boolean;
  title: string;
  summary: string;
  note: string | null;
  body: ReactNode;
};

type ArticleReaderProps = {
  dateLabel: string;
  source: ReactNode;
  tags: readonly string[];
  versions: readonly ArticleReaderVersion[];
};

const LANGUAGE_QUERY_KEY = "lang";

export function ArticleReader({
  dateLabel,
  source,
  tags,
  versions,
}: ArticleReaderProps) {
  const defaultId = versions[0]?.id ?? "";
  const [activeId, setActiveId] = useState(defaultId);
  const active =
    versions.find((version) => version.id === activeId) ?? versions[0];

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      LANGUAGE_QUERY_KEY,
    );

    if (!requested || !versions.some((version) => version.id === requested)) {
      return;
    }

    const timeoutId = window.setTimeout(() => setActiveId(requested), 0);

    return () => window.clearTimeout(timeoutId);
  }, [versions]);

  function selectVersion(id: string) {
    setActiveId(id);

    const url = new URL(window.location.href);

    if (id === defaultId) {
      url.searchParams.delete(LANGUAGE_QUERY_KEY);
    } else {
      url.searchParams.set(LANGUAGE_QUERY_KEY, id);
    }

    window.history.replaceState(window.history.state, "", url);
  }

  if (!active) {
    return null;
  }

  const lang = active.lang ?? undefined;

  return (
    <>
      <header className="article-page-header">
        <p className="article-page-meta">
          {[dateLabel, active.label].filter(Boolean).join(" · ")}
        </p>
        <h1 lang={lang}>{active.title}</h1>
        {active.summary ? (
          <p className="article-deck" lang={lang}>
            {active.summary}
          </p>
        ) : null}
        {tags.length ? (
          <div className="article-page-tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        {versions.length > 1 ? (
          <div
            className="article-language-switcher"
            role="group"
            aria-label="Article language"
          >
            {versions.map((version) => (
              <button
                key={version.id}
                type="button"
                lang={version.lang ?? undefined}
                aria-label={`${version.label}${version.isOriginal ? " (original)" : ""}`}
                aria-pressed={version.id === active.id}
                title={version.isOriginal ? `${version.label} · original` : version.label}
                onClick={() => selectVersion(version.id)}
              >
                {version.short}
                {version.isOriginal ? (
                  <span className="article-language-original" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        {active.note ? (
          <p className="article-translation-note">{active.note}</p>
        ) : null}
        {source}
      </header>

      <div className="article-rich-content" lang={lang}>
        {active.body}
      </div>
    </>
  );
}
