import { ogImageSize } from "@/lib/og-card";
import { renderSiteOgImage } from "@/lib/og-images";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = ogImageSize;
export const contentType = "image/png";

export default function Image() {
  return renderSiteOgImage("tr");
}
