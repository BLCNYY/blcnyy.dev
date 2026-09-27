type RateLimitOptions = {
  namespace: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

export function getClientIp(request: Request) {
  return (
    getFirstHeaderValue(request.headers.get("x-real-ip")) ||
    getFirstHeaderValue(request.headers.get("x-vercel-forwarded-for")) ||
    "anonymous"
  );
}

export function checkRateLimit(
  request: Request,
  { namespace, limit, windowMs }: RateLimitOptions,
) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${namespace}:${ip}`;
  const existingEntry = rateLimitStore.get(key);
  const entry =
    existingEntry && existingEntry.resetAt > now
      ? {
          count: existingEntry.count + 1,
          resetAt: existingEntry.resetAt,
        }
      : {
          count: 1,
          resetAt: now + windowMs,
        };

  rateLimitStore.set(key, entry);

  if (rateLimitStore.size > 1000) {
    for (const [storedKey, storedEntry] of rateLimitStore.entries()) {
      if (storedEntry.resetAt <= now) {
        rateLimitStore.delete(storedKey);
      }
    }
  }

  const remaining = Math.max(limit - entry.count, 0);
  const retryAfterSeconds = Math.max(
    Math.ceil((entry.resetAt - now) / 1000),
    1,
  );
  const headers = new Headers({
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
  });

  if (entry.count > limit) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return {
    allowed: entry.count <= limit,
    headers,
    retryAfterSeconds,
  };
}
