// ─── The September weekend offer ─────────────────────────────────────────────
//
// £99 to start, then 5 × £200/month = £1,099. Against a £1,599 direct price.
// Open 07:00 Fri 4 Sept 2026 → midnight Sun 6 Sept 2026, London time.
//
// SINGLE SOURCE. The landing page, the enrolment flow and the server-side gate
// in /api/checkout all read this module, so the page cannot advertise an offer
// that checkout refuses, and checkout cannot sell one the page says has closed.
//
// WHY THE GATE IS SERVER-SIDE
// ───────────────────────────
// Deactivating the Stripe price does NOT close this offer. Every caller of
// createCheckoutSession falls back to the raw Payment Link when session creation
// fails — deliberately, because a buyer must never be blocked from paying — so
// killing the price would just push buyers down the fallback and it would keep
// selling. Closing takes BOTH of:
//
//   1. this gate, enforced in /api/checkout (the only path that mints a session)
//   2. deactivating Payment Link plink_1U8Jic99z9lThumnrEWofv3y in Stripe,
//      which is what closes the fallback
//
// Do 1 first. 2 alone leaves the API path live; 1 alone leaves the fallback live.

/**
 * The £99 Payment Link. Its presence in a /api/checkout request is what marks a
 * request as this offer — the link is the identifier, not the amount.
 */
export const SEPT99_PAYMENT_LINK = "https://buy.stripe.com/4gMaER2wocBCdyWfiWfEk0r";

/** Where the emails and any social post should point. Never link Stripe directly. */
export const SEPT99_LANDING_PATH = "/september";

// Stored as absolute UTC instants rather than local strings so a server in any
// timezone agrees. Britain is on BST (UTC+1) on both dates:
//   07:00 Fri 4 Sept BST  = 06:00Z
//   24:00 Sun 6 Sept BST  = 23:00Z Sunday
//
// Env-overridable so the weekend can actually be rehearsed. A time-gated offer
// that can only be tested by waiting for the date is a time-gated offer whose
// closed state ships untested — and the closed state is the one that matters,
// because it is the one standing between a shut offer and a £99 sale.
// Production sets neither variable and gets the literals below.
const parseInstant = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const SEPT99_OPENS_AT = parseInstant(
  process.env.SEPT99_OPENS_AT, Date.parse("2026-09-04T06:00:00Z"),
);
export const SEPT99_CLOSES_AT = parseInstant(
  process.env.SEPT99_CLOSES_AT, Date.parse("2026-09-06T23:00:00Z"),
);

// Money, in whole pounds. Rendered on the page and asserted in tests, so the
// page can never drift from what Stripe charges the way the £1,399/£1,599
// partner pages did.
export const SEPT99_ENTRY = 99;
export const SEPT99_MONTHLY = 200;
export const SEPT99_INSTALMENTS = 5;
export const SEPT99_TOTAL = SEPT99_ENTRY + SEPT99_MONTHLY * SEPT99_INSTALMENTS; // 1099
export const STANDARD_TOTAL = 1599;
export const STANDARD_ENTRY = 599;
export const SEPT99_SAVING = STANDARD_TOTAL - SEPT99_TOTAL; // 500

export type OfferState = "before" | "open" | "closed";

/** Which of the three states the offer is in. Pure, so it is directly testable. */
export function septemberOfferState(now: number = Date.now()): OfferState {
  if (now < SEPT99_OPENS_AT) return "before";
  if (now >= SEPT99_CLOSES_AT) return "closed";
  return "open";
}

export function isSeptemberOfferOpen(now: number = Date.now()): boolean {
  return septemberOfferState(now) === "open";
}

/** True when a /api/checkout request is asking for this offer's price. */
export function isSeptemberOfferLink(paymentLink: string | undefined | null): boolean {
  if (!paymentLink) return false;
  try {
    const u = new URL(paymentLink);
    const bare = `${u.origin}${u.pathname}`.replace(/\/$/, "");
    return bare === SEPT99_PAYMENT_LINK;
  } catch {
    return paymentLink === SEPT99_PAYMENT_LINK;
  }
}

const LONDON: Intl.DateTimeFormatOptions = { timeZone: "Europe/London" };

export function formatCloses(): string {
  return new Date(SEPT99_CLOSES_AT - 1).toLocaleDateString("en-GB", {
    ...LONDON, weekday: "long", day: "numeric", month: "long",
  });
}

export function formatOpens(): string {
  return new Date(SEPT99_OPENS_AT).toLocaleDateString("en-GB", {
    ...LONDON, weekday: "long", day: "numeric", month: "long",
  });
}
