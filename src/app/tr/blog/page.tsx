import { BlogIndexPage } from "@/components/pages/blog-index-page";
import { blogIndexMetadata } from "@/lib/page-metadata";

export const metadata = blogIndexMetadata("tr");

export default function Page() {
  return <BlogIndexPage locale="tr" />;
}
