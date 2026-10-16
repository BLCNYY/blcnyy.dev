import { ChatShell } from "@/components/chat-shell";
import { askMetadata } from "@/lib/page-metadata";

export const metadata = askMetadata("en");

export default function Page() {
  return <ChatShell locale="en" />;
}
