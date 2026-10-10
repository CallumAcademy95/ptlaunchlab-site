// The October 2026 price drop, shown as "was £1,599" next to £999.99 on our own
// pages for one month after the change, then automatically hidden.
//
// Why it ends: a "was" price is only honest while the higher price is recent.
// £1,599 was the listed price until 8 October 2026. Showing it after 9 November
// would turn a genuine price drop into a misleading reference price, so the
// date is the control, not a reminder to someone. There is deliberately no
// "limited time" wording anywhere: the new price is not going back up.
//
// Not used on gym academy pages, which run their own offers.

export const WAS_PRICE_LABEL = "£1,599";
export const PRICE_DROP_NOTE = "New lower price from October 2026";
/** First moment the "was" price stops showing: 9 November 2026, 00:00 UK. */
export const WAS_PRICE_ENDS_MS = Date.UTC(2026, 10, 9, 0, 0, 0);

export function wasPriceActive(nowMs: number): boolean {
  return Number.isFinite(nowMs) && nowMs < WAS_PRICE_ENDS_MS;
}
