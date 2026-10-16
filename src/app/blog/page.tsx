import { BlogIndexPage } from "@/components/pages/blog-index-page";
import { blogIndexMetadata } from "@/lib/page-metadata";

export const metadata = blogIndexMetadata("en");

export default function Page() {
  return <BlogIndexPage locale="en" />;
}
