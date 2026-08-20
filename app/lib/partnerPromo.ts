// app/lib/partnerPromo.ts
//
// Which promo codes each partner owns.
//
// Codes are scoped by prefix rather than enumerated, so a new launch code works
// the moment it is created in Stripe — no deploy. Enumerating them in code is
// exactly why HITIO500 and HITIO300 were never on the site.
//
// Keyed by `gymSlug`, the stable partner join key. Never key on the display name.
// Verified against the live account 2026-08-19. Two gyms carry TWO prefixes:
// Iron Wolf's standing code is IWGPTDISCOUNT but its launch codes are
// IRONWOLF500/300, and Muscle Bound is MBGPTDISCOUNT vs MUSCLEBOUND500/300.
// A single prefix each would refuse their own launch codes.
export const PARTNER_PROMO_PREFIXES: Record<string, string[]> = {
  "6fit": ["6FIT"],
  "ebor": ["EBOR"],
  "gym-n-go": ["GYMNGO"],
  "hitio-orpington": ["HITIO"],
  "ironwolf": ["IWG", "IRONWOLF"],
  "mof": ["MOF"],
  "muscle-bound": ["MBG", "MUSCLEBOUND"],
  "superflex": ["SUPERFLEX"],
  "xcelerate": ["XCELERATE"],
};

/** The code applied automatically on each partner's page, with no typing. */
export const PARTNER_STANDING_CODE: Record<string, string> = {
  "6fit": "6FITPTDISCOUNT",
  "ebor": "EBORPTDISCOUNT",
  "gym-n-go": "GYMNGOPT",
  "hitio-orpington": "HITIOPT",
  "ironwolf": "IWGPTDISCOUNT",
  "mof": "MOFPTDISCOUNT",
  "muscle-bound": "MBGPTDISCOUNT",
  "superflex": "SUPERFLEXPT",
  "xcelerate": "XCELERATEPT",
};
