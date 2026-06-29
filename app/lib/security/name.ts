/**
 * Name validation — bins obvious junk without rejecting real-world names.
 *
 * What we reject:
 *   - empty / too short / too long
 *   - all-consonant strings (gibberish like "asdf qwerty")
 *   - URL fragments (http, www., ://) — bots love stuffing names with links
 *   - excessive repeated characters ("aaaaaa") or repeated short patterns
 *
 * What we deliberately don't reject:
 *   - names with apostrophes, hyphens, spaces, dots (O'Brien, Smith-Jones)
 *   - non-ASCII letters (covers most European/global names)
 *   - single-word names (some cultures use one name)
 */

const URL_FRAGMENTS = /\b(https?:|www\.|\.com\b|\.net\b|\.ru\b|\.cn\b|\.xyz\b|<|>|\[url|t\.me\/|whatsapp\.com)/i;
const REPEAT_CHAR = /(.)\1{5,}/;        // 6+ same char in a row
const REPEAT_PAIR = /(..)\1{4,}/;         // same 2-char pattern repeated 5+ times (e.g. "ababababab")
const VOWEL_RE = /[aeiouyÀ-ſ]/i; // includes common accented vowels

export type NameCheck = {
  ok: boolean;
  normalised: string | null;
  reason?: "empty" | "too-short" | "too-long" | "url" | "repeat" | "no-vowel" | "non-letter";
};

export function validateName(input: unknown, opts: { min?: number; max?: number } = {}): NameCheck {
  if (typeof input !== "string") return { ok: false, normalised: null, reason: "empty" };
  const trimmed = input.trim().replace(/\s+/g, " ");
  const min = opts.min ?? 2;
  const max = opts.max ?? 80;
  if (!trimmed) return { ok: false, normalised: null, reason: "empty" };
  if (trimmed.length < min) return { ok: false, normalised: null, reason: "too-short" };
  if (trimmed.length > max) return { ok: false, normalised: null, reason: "too-long" };
  if (URL_FRAGMENTS.test(trimmed)) return { ok: false, normalised: null, reason: "url" };
  if (REPEAT_CHAR.test(trimmed) || REPEAT_PAIR.test(trimmed)) {
    return { ok: false, normalised: null, reason: "repeat" };
  }
  if (!VOWEL_RE.test(trimmed)) return { ok: false, normalised: null, reason: "no-vowel" };
  // Must contain at least one letter (digits-only is not a name)
  if (!/[A-Za-zÀ-ſ]/.test(trimmed)) {
    return { ok: false, normalised: null, reason: "non-letter" };
  }
  return { ok: true, normalised: trimmed };
}
