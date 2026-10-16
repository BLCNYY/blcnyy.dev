import { NextResponse } from "next/server";

import { isValidAnswerSignature } from "@/lib/answer-signature";
import { MAX_CHAT_HISTORY_ANSWER_LENGTH } from "@/lib/limits";
import { buildOpenRouterHeaders } from "@/lib/openrouter";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/dictionaries";
import { getRequestLocale, isCrossSiteRequest } from "@/lib/request-guard";

const DEFAULT_OPENROUTER_TTS_MODEL = "google/gemini-3.1-flash-tts-preview";
const DEFAULT_OPENROUTER_TTS_VOICE = "Zephyr";
const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const MAX_SPEECH_TEXT_LENGTH = MAX_CHAT_HISTORY_ANSWER_LENGTH;
const SPEECH_RATE_LIMIT = {
  namespace: "speech",
  limit: 8,
  windowMs: 60_000,
};

export async function POST(request: Request) {
  const messages = getDictionary(getRequestLocale(request)).api;

  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: messages.crossSite }, { status: 403 });
  }

  const rateLimit = checkRateLimit(request, SPEECH_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: messages.tooManySpeech,
      },
      { status: 429, headers: rateLimit.headers },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: messages.badSpeechJson },
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
        error: messages.speechTooLong(MAX_SPEECH_TEXT_LENGTH),
      },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const text = rawText.trim();

  if (!text) {
    return NextResponse.json(
      { error: messages.emptySpeech },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const signature =
    typeof payload === "object" && payload !== null && "signature" in payload
      ? payload.signature
      : null;

  if (!isValidAnswerSignature(text, signature)) {
    return NextResponse.json(
      {
        error: messages.unsignedSpeech,
      },
      { status: 403, headers: rateLimit.headers },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: messages.speechNotConfigured,
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
          error: messages.speechError,
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
      { error: messages.speechError },
      { status: 502, headers: rateLimit.headers },
    );
  }
}
