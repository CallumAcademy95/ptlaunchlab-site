// Black Friday 2026 — the one genuine price cut of the year.
//
// £1,599 → £999. Everything else in the twelve-month calendar changes the
// SHAPE of the offer (October lowered the amount needed to start, at the
// same total); this is the only moment the price itself moves, and it is
// the only week of the year when a discount costs no credibility because
// everyone expects one.
//
// A dated offer, not a promotion code. A code can be shared, screenshotted
// and redeemed in December — SUMMER500PTLL sat live with no expiry for
// months and nobody noticed. This closes itself, needs nothing typed, and
// cannot be used outside its window.
//
// Email-only by decision: if the discount is ever published on social or
// passed to partners, it needs a shareable code instead and this is the
// wrong mechanism.

/** The list price this is cut from, in whole pounds. */
export const BF_LIST_PRICE = 1599;
/** What Black Friday buyers pay, in whole pounds. */
export const BF_PRICE = 999;
/** The saving, stated once and derived everywhere else. */
export const BF_SAVING = BF_LIST_PRICE - BF_PRICE;

/**
 * The Stripe Payment Link. Also registered in PAYMENT_LINK_PRICES, which is
 * what the server reads to build the Checkout Session — keep the two in step.
 */
export const BF_PAYMENT_LINK = "https://buy.stripe.com/cNi28ldb27hi1Qe8UyfEk0t";

const parseInstant = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : fallback;
};

// Monday 23 November to the end of Monday 30 November. Black Friday itself
// is Friday 27 November 2026; Cyber Monday is the 30th. Overridable so a
// rehearsal needs no deploy.
export const BF_OPENS_AT = parseInstant(
  process.env.BF2026_OPENS_AT,
  Date.parse("2026-11-23T08:00:00Z"),
);
export const BF_CLOSES_AT = parseInstant(
  process.env.BF2026_CLOSES_AT,
  Date.parse("2026-12-01T00:00:00Z"),
);

export function isBlackFridayOpen(now: number = Date.now()): boolean {
  return now >= BF_OPENS_AT && now < BF_CLOSES_AT;
}

/** "Monday 30 November" — for the closing email. */
export function blackFridayClosesLabel(): string {
  return new Date(BF_CLOSES_AT - 1).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
