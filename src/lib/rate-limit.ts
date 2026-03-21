// @ts-nocheck
// ─── In-memory rate limiter ────────────────────────────────────────
const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit by key
 * @returns true = allowed, false = blocked
 */
export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

/**
 * Get remaining requests for a key
 */
export function getRateLimitInfo(
  key: string,
  maxRequests: number,
  windowMs: number
): { remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(key);
  if (!record || now > record.resetAt) {
    return { remaining: maxRequests, resetAt: now + windowMs };
  }
  return {
    remaining: Math.max(0, maxRequests - record.count),
    resetAt: record.resetAt,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────
export function getIP(req: { headers: { get: (k: string) => string | null } }): string {
  return (
    req.headers.get("cf-connecting-ip") ||      // Cloudflare real IP
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
}, 300_000);
