export type ChatStreamEvent =
  | {
      type: "text" | "error" | "done";
      data: string;
    }
  | null;

export function parseStreamEvent(rawEvent: string): ChatStreamEvent {
  const lines = rawEvent.split(/\r?\n/);
  const eventType =
    lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "text";
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) {
    return null;
  }

  if (
    eventType !== "text" &&
    eventType !== "error" &&
    eventType !== "done"
  ) {
    return null;
  }

  try {
    return {
      type: eventType,
      data: JSON.parse(data) as string,
    };
  } catch {
    return null;
  }
}

// Streams an Ask answer, calling onText with the full answer so far.
export async function streamChatAnswer({
  message,
  locale,
  signal,
  onText,
}: {
  message: string;
  locale: string;
  signal?: AbortSignal;
  onText: (answer: string) => void;
}) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Site-Locale": locale,
    },
    body: JSON.stringify({ message, locale }),
    signal,
  });

  if (!response.ok || !response.body) {
    let error = "";

    try {
      error = ((await response.json()) as { error?: string }).error ?? "";
    } catch {}

    throw new Error(error);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");

    while (boundary !== -1) {
      const event = parseStreamEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      if (event?.type === "text") {
        answer += event.data;
        onText(answer);
      } else if (event?.type === "error") {
        throw new Error(event.data);
      } else if (event?.type === "done") {
        return answer;
      }
    }
  }

  return answer;
}
