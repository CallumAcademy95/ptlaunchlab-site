// CookieYes consent → may the Meta Pixel load? Mirrors the inline gate in
// app/layout.tsx (which can't import this). Only an explicit yes counts.
export function hasAdvertisingConsent(consent: unknown): boolean {
  if (!consent || typeof consent !== "object") return false;
  const c = consent as { categories?: Record<string, unknown>; accepted?: unknown };
  if (c.categories && c.categories.advertisement === true) return true;
  return Array.isArray(c.accepted) && c.accepted.includes("advertisement");
}
