/**
 * Honeypot + time-trap server-side check.
 *
 * The client embeds two security fields in the form payload under a
 * dedicated `_sec` key:
 *
 *   {
 *     _sec: {
 *       hp: string,   // honeypot field — MUST be empty for a real human
 *       t:  number,   // ms since form component mounted
 *       n:  string,   // small JS-generated nonce — proves JS ran
 *     }
 *   }
 *
 * - hp non-empty → bot (silent block)
 * - t < MIN_FILL_MS → too fast (silent block)
 * - t missing or n missing → no JS ran (silent block on most forms; allow
 *   on enrolments since the JS is more complex and we never want to lose
 *   a real enrolment to overzealous gating)
 */

export const SEC_KEY = "_sec";

export type SecPayload = {
  hp?: string;
  t?: number;
  n?: string;
};

export type SecCheck = {
  ok: boolean;
  reason?: "honeypot" | "too-fast" | "missing" | "no-js";
};

export const DEFAULT_MIN_FILL_MS = 1500;

export function checkHoneypot(
  sec: unknown,
  opts: { minFillMs?: number; requireNonce?: boolean } = {}
): SecCheck {
  const minFillMs = opts.minFillMs ?? DEFAULT_MIN_FILL_MS;
  const requireNonce = opts.requireNonce ?? true;

  if (!sec || typeof sec !== "object") {
    return { ok: false, reason: "missing" };
  }
  const s = sec as SecPayload;

  // Honeypot must be a string and must be empty. Bots fill every field.
  if (typeof s.hp === "string" && s.hp.length > 0) {
    return { ok: false, reason: "honeypot" };
  }

  // Time-trap. Allow generous slop for slow connections / autofill.
  if (typeof s.t === "number" && s.t >= 0 && s.t < minFillMs) {
    return { ok: false, reason: "too-fast" };
  }

  // Nonce should be a non-empty string of plausible length. We don't verify
  // the value cryptographically — it just proves JS executed.
  if (requireNonce) {
    if (typeof s.n !== "string" || s.n.length < 4 || s.n.length > 64) {
      return { ok: false, reason: "no-js" };
    }
  }

  return { ok: true };
}

/**
 * Decide what response to return when a honeypot/time-trap trips.
 *
 * We return 200 OK with `{success: true}` so bots don't learn what tripped
 * them and don't retry intelligently. The lead is silently dropped — no
 * Zapier, no WhatsApp, no email. Caller is responsible for logging.
 */
export function silentSuccess() {
  return { success: true } as const;
}
