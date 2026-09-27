import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";

import { SiteNavigation } from "@/components/site-navigation";

import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blcnyy.dev"),
  title: {
    default: "BLCNYY — Ömer Balkan",
    template: "%s | BLCNYY",
  },
  description:
    "Explore Ömer Balkan's story, projects, writing, and personal AI profile.",
  applicationName: "BLCNYY",
  authors: [{ name: "Ömer Balkan", url: "https://blcnyy.dev" }],
  creator: "Ömer Balkan",
  publisher: "BLCNYY",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BLCNYY — Ömer Balkan",
    description:
      "Explore Ömer Balkan's story, projects, writing, and personal AI profile.",
    url: "/",
    siteName: "BLCNYY",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BLCNYY — Ömer Balkan",
    description:
      "Explore Ömer Balkan's story, projects, writing, and personal AI profile.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteNavigation />
        {children}
      </body>
    </html>
  );
}
