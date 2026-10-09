// Legacy deposit-plan instalment settings, shared by the browser and the server.
//
// Since the October 2026 change-over nothing NEW is sold on a deposit plan: the
// course is £999.99 in full or 10 × £99.99 a month (app/lib/pricing.ts), and the
// monthly plan is always a subscription regardless of this flag.
//
// The flag survives for one reason: the webhook's missing-mandate alarm for
// LEGACY £599/£99-entry deposits that arrived as one-off payments. It is a
// feature flag, not a credential.
export const INSTALMENTS_ENABLED =
  process.env.NEXT_PUBLIC_STRIPE_INSTALMENTS_ENABLED === "true";

// Legacy plans: £599 + 5 × £200 = £1,599. Always five. Discounts never applied
// to deposit plans. Confirmed by Callum 2026-07-26.
export const DEFAULT_INSTALMENTS = 5;

export function instalmentTarget(): number {
  return DEFAULT_INSTALMENTS;
}
