import { createHmac, timingSafeEqual } from "node:crypto";

// Answers are signed when the chat route finishes streaming them, so the
// speech route and follow-up history only accept text this site generated.
function getSigningKey() {
  const secret =
    process.env.ANSWER_SIGNING_SECRET || process.env.OPENROUTER_API_KEY;

  return secret
    ? createHmac("sha256", secret).update("blcnyy:answer-signature").digest()
    : null;
}

export function signAnswer(answer: string) {
  const key = getSigningKey();

  return key
    ? createHmac("sha256", key).update(answer.trim()).digest("base64url")
    : "";
}

export function isValidAnswerSignature(answer: string, signature: unknown) {
  if (typeof signature !== "string" || !signature) {
    return false;
  }

  const expected = signAnswer(answer);

  if (!expected) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
