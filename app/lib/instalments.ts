// Deposit-plan instalment settings, shared by the browser and the server.
//
// Deliberately tiny and dependency-free: the enrol page (a client component)
// needs the flag to decide whether to promise the buyer an automatic monthly
// charge, and app/lib/stripeCheckout.ts needs the same flag to decide whether
// to actually take the mandate. Keeping it here means the promise and the
// behaviour cannot drift apart, without pulling the Stripe API helpers into
// the client bundle.

// NEXT_PUBLIC_ so the same value is readable in both places. It's a feature
// flag, not a credential.
export const INSTALMENTS_ENABLED =
  process.env.NEXT_PUBLIC_STRIPE_INSTALMENTS_ENABLED === "true";

// £599 + 5 × £200 = £1,599. Always five.
//
// Discounts do not apply to deposit plans — the deposit plan IS the concession,
// and the full course price is what's spread. Promo codes only ever reduce a
// pay-in-full price. Confirmed by Callum 2026-07-26 while correcting a learner
// whose manual plan had been capped at four instalments.
//
// Note this contradicts older comments elsewhere in the repo which describe an
// admin cancelling the 5th instalment for funnel-promo deposit buyers. That
// practice is retired; those comments have been corrected.
export const DEFAULT_INSTALMENTS = 5;

export function instalmentTarget(): number {
  return DEFAULT_INSTALMENTS;
}
