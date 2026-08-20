const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory fixed window rate limiter (single-instance MVP).
 * Returns true if the request is allowed.
 */
export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(input.key);

  if (!current || current.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true, remaining: input.limit - 1, retryAfterSec: 0 };
  }

  if (current.count >= input.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(input.key, current);
  return {
    ok: true,
    remaining: Math.max(0, input.limit - current.count),
    retryAfterSec: 0,
  };
}

/** Test helper */
export function resetRateLimitBuckets() {
  buckets.clear();
}
