import type { Metadata } from "next";

import { ChatShell } from "@/components/chat-shell";
import { baseOpenGraph } from "@/lib/site";

const title = "Ask";
const description =
  "Ask an AI profile about Ömer Balkan, his projects, writing, tools, and public story.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/ask",
  },
  openGraph: {
    ...baseOpenGraph,
    type: "website",
    url: "/ask",
    title: `${title} | BLCNYY`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | BLCNYY`,
    description,
  },
};

export default function AskPage() {
  return <ChatShell />;
}
