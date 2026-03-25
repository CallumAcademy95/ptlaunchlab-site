/**
 * Simple in-memory IP-based rate limiter.
 *
 * Each serverless function instance keeps its own store — good enough to block
 * most abuse at this scale. For multi-region/high-traffic upgrade to Upstash Redis.
 */

type Entry = { count: number; reset: number };

export function createRateLimiter(max: number, windowMs: number) {
  const store = new Map<string, Entry>();

  // Periodically purge expired entries to avoid unbounded memory growth
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (now > entry.reset) store.delete(key);
      }
    }, windowMs * 2);
  }

  return function allow(ip: string): boolean {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.reset) {
      store.set(ip, { count: 1, reset: now + windowMs });
      return true;
    }

    if (entry.count >= max) return false;
    entry.count++;
    return true;
  };
}

/** Extract the real client IP from Vercel / standard proxy headers. */
export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
