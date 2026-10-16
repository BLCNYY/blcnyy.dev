import { NextResponse } from "next/server";

import { isValidAnswerSignature, signAnswer } from "@/lib/answer-signature";
import { buildProfileContext } from "@/lib/blcnyy-profile";
import { getDictionary } from "@/lib/dictionaries";
import { exploreTagline } from "@/lib/explore-content";
import type { Locale } from "@/lib/i18n";
import {
  MAX_CHAT_HISTORY_ANSWER_LENGTH,
  MAX_CHAT_HISTORY_TURNS,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/limits";
import { buildOpenRouterHeaders } from "@/lib/openrouter";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLocale, isCrossSiteRequest } from "@/lib/request-guard";

const DEFAULT_OPENROUTER_MODEL = "google/gemini-3.8-flash";
const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const CHAT_RATE_LIMIT = {
  namespace: "chat",
  limit: 12,
  windowMs: 60_000,
};

const SYSTEM_PROMPT = `You are the public AI assistant for BLCNYY. You power the Ask experience on Ömer Balkan's personal website, blcnyy.dev.

Use the website context and provided profile context as your grounding. Answer like a helpful, natural personal AI profile.

Website context:
- The shared top navigation has three items: Explore, Writing, and Ask, plus a globe button that opens a language menu for switching the whole site between English and Turkish. The Turkish version lives under /tr (for example /tr, /tr/blog, and /tr/ask).
- Explore is the default experience at /. It presents Ömer's profile as focused scenes: his identity with links to his X, Instagram, and GitHub, the tagline "${exploreTagline}," his story, his projects Duly and Salah[Now], his Turkish tech and AI content on Instagram, his latest articles, and a final invitation to use Ask.
- Visitors move through Explore with a mouse wheel, trackpad, touch gestures, keyboard controls, or the on-screen section controls. The scenes transition progressively instead of using conventional document scrolling.
- Ask is available at /ask. It is the AI conversation the visitor is currently using, powered through OpenRouter and grounded in the public profile information stored in this codebase.
- Writing is the complete article index at /blog, and individual articles are at /blog/[slug]. Articles are loaded from Notion and most can be read in English, Turkish, Spanish, German, and Italian with the language buttons on each article.
- When a visitor asks where to find something on the website, point them to the relevant Explore scene or route.

Rules:
- Treat the website context and profile context as the sources of truth for their respective subjects.
- Any line or value that begins with [TODO] is missing information and must not be repeated as fact.
- You may summarize, connect related facts, explain themes, and make obvious common-sense inferences from the profile context.
- You may perform simple calculations directly supported by the profile context, such as calculating current ages from provided birth dates and the current date.
- For age questions, answer directly with the calculated age. Do not say the current age is missing if the profile includes a birth date and current date.
- If a specific fact is missing, say that briefly, then share any useful related context from the profile instead of stopping immediately.
- Never invent private facts, exact numbers, credentials, partnerships, contact details, or biographical claims that are not grounded in the profile.
- Earlier turns in this conversation may be included. Use them to resolve follow-up questions like "tell me more" or "why?".
- Prefer direct, informative answers. Use 1-3 short paragraphs by default, or bullets when the user asks for a list.
- Keep the tone warm, clear, and human. Do not sound overly defensive or like a compliance disclaimer.`;

const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  en: "Reply in the language the visitor writes in.",
  tr: "The visitor is using the Turkish version of the site. Reply in Turkish unless the visitor writes in another language.",
};

type HistoryTurn = {
  question: string;
  answer: string;
};

type MessageContentPart =
  | string
  | {
      type?: string;
      text?: string;
    };

type OpenRouterStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | MessageContentPart[];
    };
    finish_reason?: string | null;
  }>;
  error?: {
    message?: string;
  };
};

function extractTextContent(content?: string | MessageContentPart[]) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part.type === "text" && part.text) {
        return part.text;
      }

      return "";
    })
    .join("");
}

// Only earlier answers this site signed are accepted as conversation history,
// so visitors cannot inject fabricated assistant turns.
function parseHistory(payload: object): HistoryTurn[] {
  if (!("history" in payload) || !Array.isArray(payload.history)) {
    return [];
  }

  return payload.history.slice(-MAX_CHAT_HISTORY_TURNS).flatMap((turn) => {
    if (
      typeof turn !== "object" ||
      turn === null ||
      typeof turn.question !== "string" ||
      typeof turn.answer !== "string" ||
      turn.answer.length > MAX_CHAT_HISTORY_ANSWER_LENGTH ||
      !isValidAnswerSignature(turn.answer, turn.signature)
    ) {
      return [];
    }

    const question = turn.question.slice(0, MAX_CHAT_MESSAGE_LENGTH).trim();
    const answer = turn.answer.trim();

    return question && answer ? [{ question, answer }] : [];
  });
}

function createSseEvent(
  type: "text" | "error" | "done",
  payload: string = "",
) {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function readSseData(rawEvent: string) {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  if (!dataLines.length) {
    return null;
  }

  return dataLines.join("\n");
}

function findSseBoundary(buffer: string) {
  const lfBoundary = buffer.indexOf("\n\n");
  const crlfBoundary = buffer.indexOf("\r\n\r\n");

  if (lfBoundary === -1 && crlfBoundary === -1) {
    return null;
  }

  if (lfBoundary === -1) {
    return { index: crlfBoundary, length: 4 };
  }

  if (crlfBoundary === -1 || lfBoundary < crlfBoundary) {
    return { index: lfBoundary, length: 2 };
  }

  return { index: crlfBoundary, length: 4 };
}

export async function POST(request: Request) {
  const locale = getRequestLocale(request);
  const messages = getDictionary(locale).api;

  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: messages.crossSite }, { status: 403 });
  }

  const rateLimit = checkRateLimit(request, CHAT_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: messages.tooManyQuestions,
      },
      { status: 429, headers: rateLimit.headers },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: messages.badJson },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const rawMessage =
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : "";

  if (rawMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        error: messages.tooLong(MAX_CHAT_MESSAGE_LENGTH),
      },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const message = rawMessage.trim();
  const history =
    typeof payload === "object" && payload !== null ? parseHistory(payload) : [];

  if (!message) {
    return NextResponse.json(
      { error: messages.emptyMessage },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: messages.notConfigured,
      },
      { status: 500, headers: rateLimit.headers },
    );
  }

  const abortController = new AbortController();
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;

  try {
    const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: buildOpenRouterHeaders(apiKey),
      signal: abortController.signal,
      body: JSON.stringify({
        model,
        temperature: 0.45,
        max_tokens: 800,
        stream: true,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n- ${LANGUAGE_INSTRUCTIONS[locale]}\n\nProfile context:\n${buildProfileContext(new Date())}`,
          },
          ...history.flatMap((turn) => [
            { role: "user", content: turn.question },
            { role: "assistant", content: turn.answer },
          ]),
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: messages.modelError,
        },
        { status: response.status, headers: rateLimit.headers },
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: messages.startFailed },
        { status: 502, headers: rateLimit.headers },
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let fullAnswer = "";
        let streamClosed = false;

        const enqueueEvent = (
          type: "text" | "error" | "done",
          payload: string = "",
        ) => {
          controller.enqueue(encoder.encode(createSseEvent(type, payload)));
        };

        const closeStream = () => {
          if (streamClosed) {
            return;
          }

          enqueueEvent("done", signAnswer(fullAnswer));
          controller.close();
          streamClosed = true;
        };

        const processEvent = (rawEvent: string) => {
          const data = readSseData(rawEvent);

          if (!data) {
            return false;
          }

          if (data === "[DONE]") {
            closeStream();
            return true;
          }

          let parsedChunk: OpenRouterStreamChunk;

          try {
            parsedChunk = JSON.parse(data) as OpenRouterStreamChunk;
          } catch {
            return false;
          }

          if (parsedChunk.error?.message) {
            enqueueEvent("error", messages.modelError);

            if (parsedChunk.choices?.[0]?.finish_reason === "error") {
              controller.close();
              streamClosed = true;
              return true;
            }

            return false;
          }

          const textDelta = extractTextContent(
            parsedChunk.choices?.[0]?.delta?.content,
          );

          if (textDelta) {
            fullAnswer += textDelta;
            enqueueEvent("text", textDelta);
          }

          return false;
        };

        try {
          while (true) {
            const { value, done } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            while (true) {
              const boundary = findSseBoundary(buffer);

              if (!boundary) {
                break;
              }

              const rawEvent = buffer.slice(0, boundary.index);
              buffer = buffer.slice(boundary.index + boundary.length);

              if (processEvent(rawEvent)) {
                return;
              }
            }
          }

          buffer += decoder.decode();

          if (!streamClosed && buffer.trim()) {
            processEvent(buffer);
          }

          closeStream();
        } catch {
          if (!streamClosed) {
            enqueueEvent(
              "error",
              messages.interrupted,
            );
            controller.close();
          }
        } finally {
          reader.releaseLock();
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    rateLimit.headers.set("Content-Type", "text/event-stream; charset=utf-8");
    rateLimit.headers.set("Cache-Control", "no-cache, no-transform");
    rateLimit.headers.set("Connection", "keep-alive");
    rateLimit.headers.set("X-Accel-Buffering", "no");

    return new Response(stream, {
      headers: rateLimit.headers,
    });
  } catch {
    return NextResponse.json(
      { error: messages.modelError },
      { status: 502, headers: rateLimit.headers },
    );
  }
}
