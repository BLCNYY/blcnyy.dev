import { ExploreExperience } from "@/components/explore-experience";
import {
  getArticlePreviews,
  getExploreContent,
} from "@/lib/explore-content";
import type { Locale } from "@/lib/i18n";
import { fetchPosts } from "@/lib/notion";
import { serializeJsonLd, siteConfig, socialLinks } from "@/lib/site";

export async function HomePage({ locale }: { locale: Locale }) {
  const posts = await fetchPosts();
  const content = getExploreContent(locale);
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    image: `${siteConfig.avatarUrl}?size=480`,
    description: content.tagline,
    homeLocation: {
      "@type": "Place",
      name: "İstanbul, Türkiye",
    },
    knowsLanguage: ["tr", "en"],
    sameAs: socialLinks.map(({ url }) => url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd) }}
      />
      <ExploreExperience
        locale={locale}
        articles={getArticlePreviews(posts, locale)}
        projects={content.projects}
        story={content.story}
        tagline={content.tagline}
      />
    </>
  );
}
