import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";

const DEFAULT_OPENROUTER_TTS_MODEL = "google/gemini-3.1-flash-tts-preview";
const DEFAULT_OPENROUTER_TTS_VOICE = "Zephyr";
const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const MAX_SPEECH_TEXT_LENGTH = 6000;
const SPEECH_RATE_LIMIT = {
  namespace: "speech",
  limit: 8,
  windowMs: 60_000,
};
const FRIENDLY_SPEECH_ERROR =
  "I couldn't generate speech for that answer. Please try again in a moment.";

function buildOpenRouterHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(process.env.OPENROUTER_SITE_URL
      ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
      : {}),
    ...(process.env.OPENROUTER_SITE_NAME
      ? { "X-Title": process.env.OPENROUTER_SITE_NAME }
      : {}),
  };
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, SPEECH_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many spoken-answer requests from this connection. Please wait a bit and try again.",
      },
      { status: 429, headers: rateLimit.headers },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send JSON with a text field." },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const rawText =
    typeof payload === "object" &&
    payload !== null &&
    "text" in payload &&
    typeof payload.text === "string"
      ? payload.text
      : "";

  if (rawText.length > MAX_SPEECH_TEXT_LENGTH) {
    return NextResponse.json(
      {
        error: `Please keep the text to ${MAX_SPEECH_TEXT_LENGTH} characters or fewer.`,
      },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const text = rawText.trim();

  if (!text) {
    return NextResponse.json(
      { error: "There is no answer text to speak yet." },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Speech is not configured yet. Add OPENROUTER_API_KEY on the server.",
      },
      { status: 500, headers: rateLimit.headers },
    );
  }

  try {
    const response = await fetch(OPENROUTER_SPEECH_URL, {
      method: "POST",
      headers: buildOpenRouterHeaders(apiKey),
      body: JSON.stringify({
        model:
          process.env.OPENROUTER_TTS_MODEL ?? DEFAULT_OPENROUTER_TTS_MODEL,
        input: text,
        voice:
          process.env.OPENROUTER_TTS_VOICE ?? DEFAULT_OPENROUTER_TTS_VOICE,
        response_format: "pcm",
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: FRIENDLY_SPEECH_ERROR,
        },
        { status: response.status, headers: rateLimit.headers },
      );
    }

    const audio = await response.arrayBuffer();
    const generationId = response.headers.get("x-generation-id");
    const headers = new Headers({
      "Content-Type": response.headers.get("content-type") ?? "audio/pcm",
      "Cache-Control": "no-store",
    });

    rateLimit.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    if (generationId) {
      headers.set("X-Generation-Id", generationId);
    }

    return new Response(audio, { headers });
  } catch {
    return NextResponse.json(
      { error: FRIENDLY_SPEECH_ERROR },
      { status: 502, headers: rateLimit.headers },
    );
  }
}
