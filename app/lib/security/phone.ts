/**
 * UK-first phone validation.
 *
 * Strips spaces / dashes / parens, then accepts:
 *   - +44 followed by 10 digits          (international UK)
 *   - 44 followed by 10 digits           (some forms strip the +)
 *   - 0 followed by 10 digits            (domestic UK)
 *
 * For gym-partnership we relax the rule to "any digit string of 7-15 chars
 * (E.164 length range) with an optional leading +" because some partners are
 * outside the UK.
 */

const STRIP_RE = /[\s\-().]/g;

export type PhoneCheck = {
  ok: boolean;
  normalised: string | null;  // E.164ish: +44XXXXXXXXXX, never null when ok
  reason?: "empty" | "too-short" | "too-long" | "non-uk" | "invalid";
};

export function validateUKPhone(input: unknown): PhoneCheck {
  if (typeof input !== "string") return { ok: false, normalised: null, reason: "empty" };
  const cleaned = input.replace(STRIP_RE, "");
  if (!cleaned) return { ok: false, normalised: null, reason: "empty" };
  if (cleaned.length < 10) return { ok: false, normalised: null, reason: "too-short" };
  if (cleaned.length > 14) return { ok: false, normalised: null, reason: "too-long" };

  // +44XXXXXXXXXX  or  44XXXXXXXXXX  → normalise to +44XXXXXXXXXX
  if (/^\+?44\d{10}$/.test(cleaned)) {
    const digits = cleaned.replace(/^\+?44/, "");
    return { ok: true, normalised: `+44${digits}` };
  }
  // 0XXXXXXXXXX → +44XXXXXXXXXX
  if (/^0\d{10}$/.test(cleaned)) {
    return { ok: true, normalised: `+44${cleaned.slice(1)}` };
  }
  return { ok: false, normalised: null, reason: "non-uk" };
}

/** Looser check for international leads (gym-partnership). */
export function validateAnyPhone(input: unknown): PhoneCheck {
  if (typeof input !== "string") return { ok: false, normalised: null, reason: "empty" };
  const cleaned = input.replace(STRIP_RE, "");
  if (!cleaned) return { ok: false, normalised: null, reason: "empty" };
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return { ok: false, normalised: null, reason: "invalid" };
  }
  // Try UK first — most gym partners will be UK
  const uk = validateUKPhone(input);
  if (uk.ok) return uk;
  return { ok: true, normalised: cleaned.startsWith("+") ? cleaned : `+${cleaned}` };
}
