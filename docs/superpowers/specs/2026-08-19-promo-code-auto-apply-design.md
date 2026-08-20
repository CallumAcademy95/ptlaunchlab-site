# Promo code auto-apply — design

**Date:** 2026-08-19
**Status:** Approved, not yet planned
**Trigger:** HITIO Gym Orpington reported "on the offer page codes don't work" while planning their launch.

## Why

Three faults stacked, found while diagnosing HITIO's report.

1. **The pre-pay page has its own promo box, and it does nothing.** A code entered there sets
   metadata and changes the displayed price. `promo_code` is passed to Stripe as **metadata only**
   (`app/lib/stripeCheckout.ts:361,382`) — never as `discounts[0][promotion_code]`. The learner
   must retype the code at Stripe. The UI says "✓ applied" and, directly underneath, "Enter this
   code at Stripe checkout to apply your discount".
2. **Launch codes were never on the site.** `EnrolmentFlow.tsx:136` validates against a hardcoded
   per-partner object. HITIO's holds only `HITIOPT`; the launch codes `HITIO500` and `HITIO300`
   return "Invalid promo code". They exist and work in Stripe. This is what HITIO hit.
3. **The deposit path over-promises £200.** With a code applied, `EnrolmentFlow.tsx:290-294`
   computes instalments as `(1399 − 599) / 200` = 4 and shows £1,399 total. The deposit link
   carries `allow_promotion_codes: false`, so Stripe bills 5 × £200 = £1,599. There is no code box
   at Stripe on that path, so the learner cannot recover the difference.

**Every promotion code in the account has zero redemptions**, across all nine partners. Nobody has
ever completed a purchase with a discount applied.

Fault 3 is a front-end bug against a rule that already exists: `app/api/stripe-webhook/route.ts:218-247`
states "discounts do not apply to deposit plans... Confirmed by Callum 2026-07-26", and the admin
email says "the promo discount applies to pay-in-full only". The back end has been right throughout.

## Decisions taken

| Question | Decision |
|---|---|
| Auto-apply or typed | The partner's standing discount **applies automatically** on their page. No typing. |
| Where the code list lives | **Stripe**, validated live, scoped by the partner's code prefix. No deploy to add a code. |
| Deposits | **Never discounted.** Always £599 + 5 × £200 = £1,599. |
| Stacking | Not supported. A launch code **replaces** the standing discount. |
| Price display | Comes from **Stripe**, never from config. |

## Stripe constraints this design is built on

Verified against the live account on 2026-08-19.

- `discounts` and `allow_promotion_codes` are **mutually exclusive** on a Checkout Session. Passing
  a discount therefore removes Stripe's own code box, which is what makes double entry impossible
  by construction rather than by wording.
- `discounts[0][promotion_code]` takes a **promotion code ID** (`promo_…`), not the customer-facing
  string, so a server-side lookup is unavoidable.
- Every coupon in the account is `amount_off` with `duration: once` — correct for a one-off
  pay-in-full charge, and another reason deposits were always the wrong home for them.
- **18 code strings are duplicated in the account, but none has more than one active version** —
  every duplicate's twin is archived. Resolving a string to a single active promotion code is
  therefore unambiguous. Had this not held, auto-apply would have been unsafe.
- HITIO's launch codes are slot-capped: `HITIO500` max 3, `HITIO300` max 2, `HITIOPT` uncapped.
  They will run out, so exhaustion is a normal case, not an edge case.

## Components

### 1. `app/lib/promoCodes.ts` — the resolver

`resolvePromoCode(code, gymSlug)` lists active promotion codes from Stripe, finds the exact string
match, and returns either `{ promoId, code, amountOffPence }` or a typed refusal reason. It enforces:

- **Ownership** — the code must carry the partner's `promoPrefix`, so a Gym n Go learner cannot burn
  one of HITIO's three £500 slots. Codes are guessable from the pattern; the cap makes them worth
  guessing.
- **Availability** — `times_redeemed < max_redemptions` where a cap exists.
- **Liveness** — `active: true` only.

Refusal reasons are a closed set: `unknown`, `wrong-partner`, `exhausted`, `inactive`.

### 2. `POST /api/promo/validate` — the client's only route in

Body `{ code, gymSlug }`. Returns `{ valid: true, amountOffPence, code }` or
`{ valid: false, reason }`. Replaces the hardcoded lookup at `EnrolmentFlow.tsx:136`. The client
never holds a Stripe key and never decides what a code is worth.

`wrong-partner` and `unknown` return the **same** message to the learner — we do not confirm that
another partner's code exists.

### 3. `createCheckoutSession` gains `promoCodeId`

When present **and the session is pay-in-full**: set `discounts[0][promotion_code]` and force
`allow_promotion_codes: false`.

On a deposit the discount is never passed and `allow_promotion_codes` stays `false`. This is
enforced in `stripeCheckout.ts`, not in the caller — the front end must not be the only thing
standing between a deposit and a discount.

`promo_code` metadata is still written, because the webhook reads it in five places
(`stripe-webhook/route.ts:206,330,364,426,532,886`) for the ops sheet, the admin email and partner
attribution.

### 4. Partner config

Gains `standingPromoCode` (auto-applied on load) and `promoPrefix` (the ownership check).
The `promoCodes` object with its hardcoded `fullPrice`/`depositPrice` is **removed** — prices come
from Stripe, so the button can never again name a figure Stripe will not charge.

### 5. `EnrolmentFlow.tsx`

- Standing discount resolved and applied on mount. No typing.
- The box is relabelled for launch codes. Applying one **replaces** the standing discount, and the
  page says so rather than silently swapping.
- The deposit option always reads £599 + 5 × £200 = £1,599, with "Discounts apply to pay-in-full
  only." **The `(fullPrice − depositPrice) / 200` arithmetic is deleted** — it is what currently
  promises £1,399 and bills £1,599.
- **The button label always equals the exact figure Stripe will charge.** This is the invariant to
  test hardest.

## Failure handling

| Case | Learner sees |
|---|---|
| Not a real code | "We don't recognise that code." |
| Belongs to another gym | Same message — no confirmation that it exists |
| All slots claimed | "That code has been fully claimed." |
| Expired or archived | "That code is no longer available." |

**If the standing code fails to resolve** — archived by accident, or Stripe unreachable — the page
shows **full price** and logs it. Showing £1,399 and charging £1,599 is the fault being removed; a
page that quietly shows £1,599 is recoverable, a page that lies is not.

**If Stripe rejects the session** because the discount went invalid between validation and checkout
(someone takes the last slot mid-form), the learner gets a clear error and the applied code is
cleared — not the current silent `stripe-unavailable`.

## Testing

Unit (`tests/*.test.mts`, `node --test`):

- cross-partner rejection — `HITIO500` against `gym-n-go` refuses with `wrong-partner`
- exhaustion — `times_redeemed >= max_redemptions` refuses with `exhausted`
- inactive codes refuse; the archived twin of a duplicated string is never resolved
- **a deposit session never carries `discounts`, whatever is passed in** — the money-path guard
- a session carrying `discounts` never also carries `allow_promotion_codes: true`

E2E: extend `e2e/hitio-attribution.spec.ts`, which already covers this partner's flow.

## Out of scope

- Stacking multiple codes
- Discounts on deposit plans, in any form
- Retiring the £1,399 funnel PIF price (`STRIPE_FUNNEL_PIF_PRICE_ID`) — the cold funnel still uses it
- Back-filling or compensating the historical sales that paid full price after seeing £1,399
- Changing any promotion code, coupon or cap in Stripe
