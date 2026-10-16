import { notFound } from "next/navigation";

// Sends unknown /tr URLs to the Turkish not-found page.
export default function MissingPage() {
  notFound();
}
