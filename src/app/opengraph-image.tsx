import { ImageResponse } from "next/og";

import { exploreTagline } from "@/lib/explore-content";
import { OgCard, ogImageSize } from "@/lib/og-card";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = ogImageSize;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        title={`${exploreTagline}.`}
        description="Explore my story, projects, and writing — or ask the AI profile about anything else."
        footerLeft="blcnyy.dev"
        footerRight="Explore / Writing / Ask"
      />
    ),
    size,
  );
}
