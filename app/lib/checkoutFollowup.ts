// Pure selection logic for /api/checkout-followup, kept apart so it can be
// unit-tested without Stripe, MailerLite or Resend.

export interface SessionLite {
  id: string;
  status: string; // "open" | "complete" | "expired"
  created: number; // unix seconds
  expiresAt?: number; // unix seconds
  email: string | null;
  name?: string | null;
  amountTotal?: number | null; // pence
}

export interface Abandoned {
  email: string;
  name: string | null;
  amountTotal: number | null;
  expiresAt: number;
}

const norm = (e: string) => e.trim().toLowerCase();

/** Test and placeholder addresses never get a follow-up. */
export function isFollowupEligibleEmail(email: string): boolean {
  const e = norm(email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return false;
  if (/@(example\.(com|org|net|invalid)|test\.com)$/.test(e)) return false;
  if (e.endsWith(".invalid") || e.endsWith(".test")) return false;
  return true;
}

/**
 * People whose checkout expired in [sinceUnix, untilUnix) and who have no
 * completed purchase at all. One entry per email (the latest abandoned
 * session wins), so a daily run reports each abandon once.
 */
export function selectAbandoned(
  expired: SessionLite[],
  complete: SessionLite[],
  sinceUnix = 0,
  untilUnix = Number.MAX_SAFE_INTEGER,
): Abandoned[] {
  const paid = new Set(complete.filter((s) => s.email).map((s) => norm(s.email!)));
  const byEmail = new Map<string, Abandoned>();
  for (const s of expired) {
    if (!s.email || !isFollowupEligibleEmail(s.email)) continue;
    const at = s.expiresAt ?? s.created;
    if (at < sinceUnix || at >= untilUnix) continue;
    const e = norm(s.email);
    if (paid.has(e)) continue;
    const prev = byEmail.get(e);
    if (!prev || at > prev.expiresAt) {
      byEmail.set(e, { email: e, name: s.name?.trim() || null, amountTotal: s.amountTotal ?? null, expiresAt: at });
    }
  }
  return [...byEmail.values()].sort((a, b) => a.expiresAt - b.expiresAt);
}

/** Back-compat helper: just the emails. */
export function selectFollowups(expired: SessionLite[], complete: SessionLite[]): string[] {
  return selectAbandoned(expired, complete).map((a) => a.email);
}
