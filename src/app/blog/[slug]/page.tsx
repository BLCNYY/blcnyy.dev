import type { Metadata } from "next";

import {
  ArticlePage,
  generateArticleStaticParams,
} from "@/components/pages/article-page";
import { articleMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return generateArticleStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return articleMetadata(slug, "en");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <ArticlePage slug={slug} locale="en" />;
}
