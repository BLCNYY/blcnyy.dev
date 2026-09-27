import type { Metadata } from "next";

import { ChatShell } from "@/components/chat-shell";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask an AI profile about Ömer Balkan, his projects, writing, tools, and public story.",
  alternates: {
    canonical: "/ask",
  },
};

export default function AskPage() {
  return <ChatShell />;
}

