// Today's bot and junk gates for POST /api/lead, as a spam FLAG, not a rejection.
//
// Each intent runs exactly the checks its legacy route ran
// (app/lib/security/validate.ts):
//   contact                       → validateContact: full `_sec` check, validateName, validateEmail
//   prospectus, gym_callback      → validateProspectus: same
//   quiz                          → validateQuiz: same
//   live                          → validateLiveRegister: same
//   gym_partnership               → full `_sec` check (25 Nov 2026: bots got through the honeypot-only
//                                   check), validateName, validateBusinessName(gymName), validateEmail
//                                   allowRole, and looksRandom on gymName / location / referredBy
//   call, salary, whatsapp, …     → none (PhoneCallbackForm and /api/salary-calculator had no gates)
// Phone format is NOT a spam signal here: validateLead already requires a valid phone.
//
// A hit returns a reason (e.g. "sec:no-js", "email:disposable"); processLead saves the
// lead with is_spam = true and extra.spamReason, and sends nothing external.
//
// The checks themselves are injected, never reimplemented: the route passes the real
// functions from app/lib/security/*. That keeps this file free of `@/` imports and of
// email.ts's JSON import, so node --test can load it.

type Check = { ok: boolean; reason?: string };

export type SpamValidators = {
  /** honeypot.ts checkHoneypot — `_sec` hp + time-trap + nonce. */
  checkHoneypot(sec: unknown): Check;
  /** name.ts validateName. */
  validateName(input: unknown): Check;
  /** name.ts validateBusinessName. */
  validateBusinessName(input: unknown, opts?: { min?: number; max?: number }): Check;
  /** email.ts validateEmail. */
  validateEmail(input: unknown, opts?: { allowRole?: boolean }): Check;
};

/** Intents whose legacy route ran the full sec + name + email gates. */
export const FULL_GATE_INTENTS: ReadonlySet<string> = new Set(["contact", "prospectus", "gym_callback", "quiz", "live"]);

/**
 * True for a bot-generated filler token such as "xImCAnWnzDyqEADMmrcBU": one word of 12+
 * letters with 3+ lower-to-upper case flips inside it. Real names have spaces or at most
 * one or two internal capitals ("McDonald", "PureGym", "Meridian FItness").
 */
export function looksRandom(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const s = input.trim();
  if (s.length < 12 || /\s/.test(s) || !/^[A-Za-z]+$/.test(s)) return false;
  return (s.match(/[a-z](?=[A-Z])/g) ?? []).length >= 3;
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function spamReasonFor(raw: unknown, v: SpamValidators): string | null {
  const r = obj(raw);
  const intent = typeof r.intent === "string" ? r.intent : "";

  if (FULL_GATE_INTENTS.has(intent)) {
    const sec = v.checkHoneypot(r._sec);
    if (!sec.ok) return `sec:${sec.reason ?? "fail"}`;
    const name = v.validateName(r.name);
    if (!name.ok) return `name:${name.reason ?? "fail"}`;
    const email = v.validateEmail(r.email);
    if (!email.ok) return `email:${email.reason ?? "fail"}`;
    return null;
  }

  if (intent === "gym_partnership") {
    // PartnershipForm sends `_sec` (hp + time-trap + nonce), so the full check applies.
    const sec = v.checkHoneypot(r._sec);
    if (!sec.ok) return `sec:${sec.reason ?? "fail"}`;
    const ex = obj(r.extra);
    for (const f of ["gymName", "location", "referredBy"]) if (looksRandom(ex[f])) return `random:${f}`;
    const name = v.validateName(r.name);
    if (!name.ok) return `name:${name.reason ?? "fail"}`;
    const gym = v.validateBusinessName(obj(r.extra).gymName, { min: 2, max: 200 });
    if (!gym.ok) return `gym:${gym.reason ?? "fail"}`;
    const email = v.validateEmail(r.email, { allowRole: true });
    if (!email.ok) return `email:${email.reason ?? "fail"}`;
    return null;
  }

  return null;
}
