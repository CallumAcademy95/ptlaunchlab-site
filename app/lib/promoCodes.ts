// app/lib/promoCodes.ts
//
// Resolving a customer-facing promo code to the Stripe promotion code ID that
// `discounts[0][promotion_code]` needs.
//
// This decides what someone pays, so the selection logic is kept pure and the
// network call is a thin wrapper around it (see resolvePromoCode below). The
// account has three properties that shape it: duplicated code strings with one
// active version each, slot-capped launch codes, and guessable per-gym patterns.

export type PromoRefusal = "unknown" | "wrong-partner" | "exhausted" | "inactive";

export interface StripePromotionCode {
  id: string;
  code: string;
  active: boolean;
  times_redeemed: number;
  max_redemptions: number | null;
  coupon: { amount_off: number | null; valid: boolean };
}

export type PromoResolution =
  | { ok: true; promoId: string; code: string; amountOffPence: number }
  | { ok: false; reason: PromoRefusal };

/**
 * Pick the promotion code a learner may use.
 *
 * Order matters. Existence is checked before ownership so that the server log
 * accurately says "no such code" or "not this gym's code" — only one of those
 * is ever true. Both reasons map to the same learner-facing message, so the
 * distinction leaks nothing; it is purely for accurate logging.
 */
export function selectPromoCode(
  list: StripePromotionCode[],
  code: string,
  prefixes: string[],
): PromoResolution {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return { ok: false, reason: "unknown" };

  // Existence first, ownership second. Both refusals return the SAME message to
  // the learner (see the validate route), so ordering leaks nothing — but it
  // decides whether the server log says "no such code" or "not this gym's code",
  // and only one of those is true in each case.
  const matches = list.filter((p) => p.code.trim().toUpperCase() === wanted);
  if (matches.length === 0) return { ok: false, reason: "unknown" };

  // A list of prefixes, not one: Iron Wolf's standing code is IWGPTDISCOUNT but
  // its launch codes are IRONWOLF500/300, and Muscle Bound is MBG vs MUSCLEBOUND.
  // A single prefix would refuse those gyms their own launch discounts.
  if (!prefixes.some((p) => wanted.startsWith(p.trim().toUpperCase()))) {
    return { ok: false, reason: "wrong-partner" };
  }

  // A duplicated string always has exactly one active version and an archived
  // twin — verified across all 18 duplicates in the account. Preferring the
  // active one is what stops us resolving to a coupon that no longer applies.
  const live = matches.find((p) => p.active && p.coupon.valid && p.coupon.amount_off !== null);
  if (!live) return { ok: false, reason: "inactive" };

  if (live.max_redemptions !== null && live.times_redeemed >= live.max_redemptions) {
    return { ok: false, reason: "exhausted" };
  }

  return { ok: true, promoId: live.id, code: live.code, amountOffPence: live.coupon.amount_off! };
}
