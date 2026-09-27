import { profile } from "@/lib/blcnyy-profile";
import type { NotionPost } from "@/lib/notion";

export type ExploreProject = {
  name: string;
  url: string;
  domain: string;
  statement: string;
  summary: string;
};

export type ArticlePreview = {
  id: string;
  title: string;
  summary: string;
  date: string | null;
  slug: string;
  tags: string[];
};

export const exploreStory = {
  heading: "Technology has always been part of how I explore.",
  body:
    "I grew up in Istanbul, curious about science, experiments, technology, and video editing. Creating content online led me to writing, design, and building software. Today, I use AI tools to turn ideas into projects and share what I learn.",
} as const;

const projectPresentation: Record<
  "Salah[Now]",
  Pick<ExploreProject, "domain" | "statement" | "summary">
> = {
  "Salah[Now]": {
    domain: "salahnow.app",
    statement: "Prayer times, kept clear.",
    summary:
      "A minimal, ad-free prayer times service with location support and a Qibla finder.",
  },
};

export const exploreProjects: ExploreProject[] = (["Salah[Now]"] as const).map((name) => {
  const project = profile.projects.find((entry) => entry.name === name);

  if (!project) {
    throw new Error(`Missing Explore project: ${name}`);
  }

  return {
    name,
    url: project.url,
    ...projectPresentation[name],
  };
});

const fallbackArticles: ArticlePreview[] = [
  {
    id: "what-if-a-transplant-didnt-mean-a-lifetime-of-pills",
    title: "What If a Transplant Didn't Mean a Lifetime of Pills?",
    summary:
      "A look at transplant tolerance research and emerging paths toward reducing lifelong immunosuppressant use.",
    date: "2026-07-13",
    slug: "what-if-a-transplant-didnt-mean-a-lifetime-of-pills",
    tags: ["Science", "Personal"],
  },
  {
    id: "3-years-with-chatgpt",
    title: "3 Years with ChatGPT: How OpenAI ‘Turned On’ AI for Everyone",
    summary:
      "A timeline of ChatGPT's rise and the updates that turned AI into an everyday personal assistant.",
    date: "2025-11-30",
    slug: "3-years-with-chatgpt-how-openai-turned-on-ai-for-everyone",
    tags: ["AI"],
  },
  {
    id: "why-does-nostalgia-exist",
    title: "Why Does Nostalgia Exist?",
    summary:
      "A short essay about how memory changes over time and why the past can feel warmer than it was.",
    date: "2025-11-05",
    slug: "why-does-nostalgia-exist",
    tags: ["Opinion"],
  },
  {
    id: "x-micro-summary",
    title: "X",
    summary:
      "A quick update on Twitter's shift to X, Threads, rate limits, and creator monetization.",
    date: "2023-08-01",
    slug: "x-micro-summary",
    tags: ["Social Media"],
  },
  {
    id: "x-monopoly",
    title: "X = Monopoly",
    summary:
      "A reflection on the everything-app idea and whether it risks creating a new monopoly.",
    date: "2023-04-18",
    slug: "x-monopoly",
    tags: ["Opinion"],
  },
];

export function getArticlePreviews(posts: readonly NotionPost[]) {
  const source = posts.length
    ? posts.map(({ id, title, summary, date, slug, tags }) => ({
        id,
        title,
        summary,
        date,
        slug,
        tags,
      }))
    : fallbackArticles;

  return source.slice(0, 5);
}
