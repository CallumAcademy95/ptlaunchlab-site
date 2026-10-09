// Raw Stripe Payment Links — the fail-safe path only.
//
// Every buyer normally goes through /api/checkout, which creates a Checkout
// Session in code. If that fails (Stripe outage, key permission, bad price id)
// the enrol page falls back to the raw Payment Link for the plan they chose.
//
// From the October 2026 change-over there are exactly two links, one per plan,
// and they are read from env. There is deliberately NO hardcoded default and
// NO fallback to any older link: every older link sells a retired price (£1,599,
// £599 + £200s, £1,399, £99, £999 Black Friday). If a link is unset the buyer
// is shown an error with a way to reach us, never a wrong price.
//
// Client-safe: the enrol page reads this in the browser. NEXT_PUBLIC_ values
// must be referenced literally so Next can inline them at build time.

import type { CoursePlanChoice } from "./pricing.ts";

export function fallbackPaymentLink(plan: CoursePlanChoice): string | null {
  const url =
    plan === "monthly"
      ? process.env.NEXT_PUBLIC_STRIPE_LINK_MONTHLY_999
      : process.env.NEXT_PUBLIC_STRIPE_LINK_PIF_999;
  return url && /^https:\/\/buy\.stripe\.com\//.test(url) ? url : null;
}

/**
 * Every Payment Link the site has ever sent buyers to, all now retired.
 *
 * Nothing in the app links to these any more. They are listed so the e2e
 * completeness check (e2e/payment-link-redirects.spec.ts) can tell "a retired
 * link someone still needs to deactivate in Stripe" apart from "a new link the
 * code knows nothing about". Deactivating them is a human job in the Stripe
 * Dashboard — this repo never changes live Stripe objects.
 */
export const RETIRED_PAYMENT_LINKS: readonly string[] = [
  "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f", // £1,599 pay-in-full (shared, gym pages)
  "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // £599 deposit
  "https://buy.stripe.com/fZuaER6ME7hi0Ma0o2fEk06", // £1,399 funnel-promo pay-in-full
  "https://buy.stripe.com/4gMaER2wocBCdyWfiWfEk0r", // £99 September entry
  "https://buy.stripe.com/cNi28ldb27hi1Qe8UyfEk0t", // £999 Black Friday
  "https://buy.stripe.com/5kQ14h9YQ0SUgL89YCfEk0s", // £99 October entry
];
