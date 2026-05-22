/**
 * Email validation: format + disposable-domain blocklist.
 *
 * The `disposable-email-domains` package is a static array of ~3,500 known
 * disposable / temp-mail providers. No API call, no rate limit, no cost.
 * It's an array literal so we load it into a Set once at module init for
 * O(1) lookup.
 */

import disposableList from "disposable-email-domains";
import wildcardList from "disposable-email-domains/wildcard.json";

const DISPOSABLE = new Set<string>(disposableList.map((d: string) => d.toLowerCase()));
// wildcardList is a list of *base* domains; any subdomain of one of these is
// also disposable (e.g. anything.tempmail.org → tempmail.org match).
const WILDCARDS: string[] = (wildcardList as string[]).map(d => d.toLowerCase());

function matchesWildcard(domain: string): boolean {
  for (const base of WILDCARDS) {
    if (domain === base || domain.endsWith("." + base)) return true;
  }
  return false;
}

// RFC 5322-ish, deliberately strict on top-level structure but permissive on
// local-part characters (allows "+", ".", "_", "-"). Caps at 254 chars (the
// SMTP limit). We're not trying to be a full parser — we're trying to bin
// obvious junk like "asdfasdf" or "asdf@asdf".
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

// Role addresses we don't want for lead capture — they're rarely real prospects
// and typically belong to a generic team inbox. Keep this short and obvious.
const ROLE_LOCALS = new Set([
  "admin", "administrator", "info", "support", "noreply", "no-reply",
  "postmaster", "webmaster", "abuse", "test", "tester", "example",
]);

export type EmailCheck = {
  ok: boolean;
  normalised: string | null;
  reason?: "empty" | "too-long" | "format" | "disposable" | "role";
  domain?: string;
};

export function validateEmail(input: unknown, opts: { allowRole?: boolean } = {}): EmailCheck {
  if (typeof input !== "string") return { ok: false, normalised: null, reason: "empty" };
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return { ok: false, normalised: null, reason: "empty" };
  if (trimmed.length > 254) return { ok: false, normalised: null, reason: "too-long" };
  if (!EMAIL_RE.test(trimmed)) return { ok: false, normalised: null, reason: "format" };

  const [local, domain] = trimmed.split("@");
  if (DISPOSABLE.has(domain) || matchesWildcard(domain)) {
    return { ok: false, normalised: null, reason: "disposable", domain };
  }
  if (!opts.allowRole && ROLE_LOCALS.has(local)) {
    return { ok: false, normalised: null, reason: "role", domain };
  }
  return { ok: true, normalised: trimmed, domain };
}

export function isDisposableDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return DISPOSABLE.has(d) || matchesWildcard(d);
}
