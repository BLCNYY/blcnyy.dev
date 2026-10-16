import { getDictionary } from "@/lib/dictionaries";
import { ogImageSize } from "@/lib/og-card";
import { renderArticleOgImage } from "@/lib/og-images";

export const alt = getDictionary("tr").meta.articleImageAlt;
export const size = ogImageSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderArticleOgImage(slug, "tr");
}
