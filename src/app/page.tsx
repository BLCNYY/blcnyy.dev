import { HomePage } from "@/components/pages/home-page";
import { homeMetadata } from "@/lib/page-metadata";

export const metadata = homeMetadata("en");

export default function Page() {
  return <HomePage locale="en" />;
}
