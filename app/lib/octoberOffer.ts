// The October entry offer: £99 to start, then 5 × £300. £1,599 in total.
//
// Deliberately NOT a discount. September was £99 + 5 × £200 = £1,099, a £500
// cut, and it produced one click and no sales from 1,750 emails — so there is
// no evidence price is this list's barrier. Repeating it would also leave
// Black Friday nothing to offer, and Black Friday is the one week of the year
// a discount costs no credibility.
//
// What October lowers is the amount needed to START. The total is unchanged,
// which is why nothing here may ever be described as a discount, a sale, or
// "£1,500 off".

/** Entry payment, in whole pounds. */
export const OCT99_ENTRY = 99;
/** Monthly instalment, in whole pounds. */
export const OCT99_MONTHLY = 300;
/** How many of them. */
export const OCT99_INSTALMENTS = 5;
/** £99 + 5 × £300 = £1,599, the same as the pay-in-full price. */
export const OCT99_TOTAL = OCT99_ENTRY + OCT99_MONTHLY * OCT99_INSTALMENTS;

/**
 * The Stripe Payment Link. Also registered in PAYMENT_LINK_PRICES, which is
 * what decides the monthly price that follows it — keep the two in step.
 */
export const OCT99_PAYMENT_LINK = "https://buy.stripe.com/5kQ14h9YQ0SUgL89YCfEk0s";

const parseInstant = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : fallback;
};

// Opens with the first campaign email on 13 Oct and closes at the end of the
// 31st. Overridable so a rehearsal does not need a deploy, and so the window
// can be pulled forward or extended without a code change.
export const OCT99_OPENS_AT = parseInstant(
  process.env.OCT99_OPENS_AT,
  Date.parse("2026-10-13T06:00:00Z"),
);
export const OCT99_CLOSES_AT = parseInstant(
  process.env.OCT99_CLOSES_AT,
  Date.parse("2026-11-01T00:00:00Z"),
);

export function isOctoberOfferOpen(now: number = Date.now()): boolean {
  return now >= OCT99_OPENS_AT && now < OCT99_CLOSES_AT;
}

/** For the closing email: "closes Friday 31 October". */
export function octoberClosesLabel(): string {
  return new Date(OCT99_CLOSES_AT - 1).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
