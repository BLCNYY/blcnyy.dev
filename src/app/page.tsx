import type { Metadata } from "next";

import { ExploreExperience } from "@/components/explore-experience";
import {
  exploreProjects,
  exploreStory,
  exploreTagline,
  getArticlePreviews,
} from "@/lib/explore-content";
import { fetchPosts } from "@/lib/notion";
import { serializeJsonLd, siteConfig, socialLinks } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.author,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  image: `${siteConfig.avatarUrl}?size=480`,
  description: exploreTagline,
  homeLocation: {
    "@type": "Place",
    name: "İstanbul, Türkiye",
  },
  sameAs: socialLinks.map(({ url }) => url),
};

export default async function Home() {
  const posts = await fetchPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd) }}
      />
      <ExploreExperience
        articles={getArticlePreviews(posts)}
        projects={exploreProjects}
        story={exploreStory}
        tagline={exploreTagline}
      />
    </>
  );
}
