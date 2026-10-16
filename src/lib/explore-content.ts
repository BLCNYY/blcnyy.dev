import type { Locale } from "@/lib/i18n";
import type { Language } from "@/lib/languages";
import type { NotionPost } from "@/lib/notion";

export type ExploreProjectLink = {
  label: string;
  url: string;
};

export type ExploreProject = {
  id: string;
  name: string;
  tags?: string[];
  statement: string;
  summary: string;
  links: ExploreProjectLink[];
};

export type ArticlePreview = {
  id: string;
  title: string;
  summary: string;
  date: string | null;
  slug: string;
  tags: string[];
  language: Language | null;
};

type ExploreContent = {
  tagline: string;
  story: {
    heading: string;
    body: string;
  };
  projects: ExploreProject[];
};

export const DULY_URL = "https://useduly.app";
export const DULY_TESTFLIGHT_URL = "https://testflight.apple.com/join/kfb4yZDc";
export const SALAH_NOW_URL = "https://salahnow.app";

const exploreContent: Record<Locale, ExploreContent> = {
  en: {
    tagline: "Vibe-coder and tech enthusiast from day one",
    story: {
      heading: "Technology has always been part of how I explore.",
      body: "I grew up in Istanbul, curious about science, experiments, technology, and video editing. Creating content online led me to writing, design, and building software. Today, I use AI tools to turn ideas into projects and share what I learn.",
    },
    projects: [
      {
        id: "duly",
        name: "Duly",
        tags: ["iPhone & iPad", "Public beta"],
        statement: "Say it once. It's organized.",
        summary:
          "An app that turns a quick voice ramble into reminders, lists, ideas, and notes. The public beta is open on TestFlight.",
        links: [
          { label: "Join the TestFlight beta", url: DULY_TESTFLIGHT_URL },
          { label: "useduly.app", url: DULY_URL },
        ],
      },
      {
        id: "salah-now",
        name: "Salah[Now]",
        statement: "Prayer times, kept clear.",
        summary:
          "A minimal, ad-free prayer times service with location support and a Qibla finder.",
        links: [{ label: "salahnow.app", url: SALAH_NOW_URL }],
      },
    ],
  },
  tr: {
    tagline: "İlk günden beri vibe-coder ve teknoloji meraklısı",
    story: {
      heading: "Teknoloji, keşfetme biçimimin hep bir parçası oldu.",
      body: "İstanbul'da bilime, deneylere, teknolojiye ve video kurgusuna meraklı biri olarak büyüdüm. İnternette içerik üretmek beni yazmaya, tasarıma ve yazılım geliştirmeye götürdü. Bugün fikirlerimi projelere dönüştürmek için yapay zekâ araçlarını kullanıyor, öğrendiklerimi paylaşıyorum.",
    },
    projects: [
      {
        id: "duly",
        name: "Duly",
        tags: ["iPhone ve iPad", "Herkese açık beta"],
        statement: "Bir kere söyle, gerisi düzenli.",
        summary:
          "Sesli anlattıklarını hatırlatmalara, listelere, fikirlere ve notlara dönüştüren bir uygulama. Herkese açık betası TestFlight'ta.",
        links: [
          { label: "TestFlight betasına katıl", url: DULY_TESTFLIGHT_URL },
          { label: "useduly.app", url: DULY_URL },
        ],
      },
      {
        id: "salah-now",
        name: "Salah[Now]",
        statement: "Namaz vakitleri, sade ve net.",
        summary:
          "Konum desteği ve kıble bulucusuyla sade, reklamsız bir namaz vakitleri servisi.",
        links: [{ label: "salahnow.app", url: SALAH_NOW_URL }],
      },
    ],
  },
};

export const getExploreContent = (locale: Locale) => exploreContent[locale];

export const exploreTagline = exploreContent.en.tagline;

const fallbackArticles: ArticlePreview[] = [
  {
    id: "what-if-a-transplant-didnt-mean-a-lifetime-of-pills",
    title: "What If a Transplant Didn't Mean a Lifetime of Pills?",
    summary:
      "A look at transplant tolerance research and emerging paths toward reducing lifelong immunosuppressant use.",
    date: "2026-07-13",
    slug: "what-if-a-transplant-didnt-mean-a-lifetime-of-pills",
    tags: ["Science", "Personal"],
    language: "en",
  },
  {
    id: "3-years-with-chatgpt",
    title: "3 Years with ChatGPT: How OpenAI ‘Turned On’ AI for Everyone",
    summary:
      "A timeline of ChatGPT's rise and the updates that turned AI into an everyday personal assistant.",
    date: "2025-11-30",
    slug: "3-years-with-chatgpt-how-openai-turned-on-ai-for-everyone",
    tags: ["AI"],
    language: "en",
  },
  {
    id: "why-does-nostalgia-exist",
    title: "Why Does Nostalgia Exist?",
    summary:
      "A short essay about how memory changes over time and why the past can feel warmer than it was.",
    date: "2025-11-05",
    slug: "why-does-nostalgia-exist",
    tags: ["Opinion"],
    language: "en",
  },
  {
    id: "x-micro-summary",
    title: "X",
    summary:
      "A quick update on Twitter's shift to X, Threads, rate limits, and creator monetization.",
    date: "2023-08-01",
    slug: "x-micro-summary",
    tags: ["Social Media"],
    language: "en",
  },
  {
    id: "x-monopoly",
    title: "X = Monopoly",
    summary:
      "A reflection on the everything-app idea and whether it risks creating a new monopoly.",
    date: "2023-04-18",
    slug: "x-monopoly",
    tags: ["Opinion"],
    language: "en",
  },
];

export function toArticlePreviews(
  posts: readonly NotionPost[],
  locale: Locale = "en",
): ArticlePreview[] {
  if (!posts.length) {
    return fallbackArticles;
  }

  return posts.map((post) => {
    const version =
      post.versions.find((entry) => entry.language === locale) ??
      post.versions[0];

    return {
      id: post.id,
      title: version?.title || post.title,
      summary: version?.summary ?? post.summary,
      date: post.date,
      slug: post.slug,
      tags: post.tags,
      language: version?.language ?? post.displayLanguage,
    };
  });
}

export function getArticlePreviews(
  posts: readonly NotionPost[],
  locale: Locale = "en",
) {
  return toArticlePreviews(posts, locale).slice(0, 5);
}

export function getFallbackArticle(slug: string) {
  return fallbackArticles.find((article) => article.slug === slug) ?? null;
}

export function getFallbackArticleSlugs() {
  return fallbackArticles.map(({ slug }) => slug);
}
