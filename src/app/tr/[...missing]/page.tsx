import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Repeats the not-found title so it survives client-side navigation.
export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false },
};

// Sends unknown /tr URLs to the Turkish not-found page.
export default function MissingPage() {
  notFound();
}
