import { ChatShell } from "@/components/chat-shell";
import { askMetadata } from "@/lib/page-metadata";

export const metadata = askMetadata("tr");

export default function Page() {
  return <ChatShell locale="tr" />;
}
