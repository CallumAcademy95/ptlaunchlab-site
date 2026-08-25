# £99 entry price — design

**Date:** 2026-08-25
**For:** the September weekend offer, live 07:00 Fri 4 Sept → 24:00 Sun 6 Sept 2026
**Status:** spec, not built

---

## What we're adding

A second deposit-shaped entry price: **£99 at checkout, then 5 × £200/month, £1,099 total.**
It sits alongside the existing £599 + 5 × £200 = £1,599 plan, using the same subscription
mandate, the same recurring price and the same instalment lifecycle.

Sold only to the PT Launch Lab email list. Never exposed on a partner gym page.

| | Existing deposit | New £99 entry |
|---|---|---|
| At checkout | £599 | £99 |
| Then | 5 × £200 | 5 × £200 |
| Contract total | £1,599 | £1,099 |
| Uncollected at access | £1,000 | £1,000 |

The instalment count is 5 in both cases, so `DEFAULT_INSTALMENTS` is unchanged. **Only the
entry amount and the contract total differ**, and that is exactly what the four hardcoded
`599` sites below get wrong.

## What already works and must not be rebuilt

- `INSTALMENT_PRICE_ID` (`price_1RxmdG99z9lThumnilf7YD2e`, £200/month) — reused as-is.
- `NEXT_PUBLIC_STRIPE_INSTALMENTS_ENABLED=true` is live in production (verified against
  `/enrol`, which renders "Monthly payments collected automatically").
- The 30-day trial, the mandate taken at checkout, `countSettledInstalments()`,
  plan cancellation on the final instalment, and `handleInstalmentFailed()` alerting
  (Stripe smart retries + admin email + retries-exhausted escalation) all carry over
  untouched.
- Stripe product names were corrected on 2026-08-25; all four now read
  *NCFE Level 3 Diploma in Gym Instructing and Personal Training*.

---

## Task 1 — Stripe: the £99 price and link

Create a **£99 GBP one-off price on the existing deposit product** `prod_StZkvHGlNw7pZX`
(*"… — Deposit"*), nickname `Sept99 Entry 99`. Same product because it is the same
qualification and the same shape of sale; only the entry amount differs.

Create a Payment Link against it. Two settings are not optional:

- **Return URL must be set in the Dashboard** to
  `https://ptlaunchlab.co.uk/enrol/success?session_id={CHECKOUT_SESSION_ID}`.
  Every caller falls back to the raw Payment Link when session creation fails, and a link
  left on Stripe's default landing page is what lost eight paying customers between
  Nov 2025 and Jul 2026.
- **`allow_promotion_codes` off.** Discounts never apply to a deposit plan.

## Task 2 — Map the link, and kill the amount threshold

Add to `PAYMENT_LINK_PRICES` in `app/lib/stripeCheckout.ts`:

```ts
"<new payment link url>": {
  price: process.env.STRIPE_SEPT99_PRICE_ID || "price_…",
  amount: 99,
  label: "NCFE Level 3 Diploma in Gym Instructing and Personal Training — Deposit",
  allowPromotionCodes: false,
  takesInstalments: true,
  contractValue: 1099,
},
```

`LinkConfig` gains two explicit fields, and `stripeCheckout.ts:425` changes:

```ts
- const isDeposit = config.amount < 1300;
+ const isDeposit = config.takesInstalments;
```

**Why this is part of the work rather than a nicety.** `amount < 1300` happens to classify
£99 correctly, so the offer would ship without touching it. But an amount threshold on this
exact decision has already produced one production bug — `amount >= 1300` logged every
discounted £1,099 partner sale to the tracker as a deposit, 8 of 9 sales mislabelled. Adding
a third price to a price-range test is how that recurs. Set the two PIF entries to
`takesInstalments: false`, and give every entry an explicit `contractValue`
(1599 / 1599 / 1399 / 1099).

## Task 3 — The £599-exact CAPI uplift

`app/api/stripe-webhook/route.ts:306-307`:

```ts
const isCourseDeposit = amountPaid === 599;
const courseValue = isCourseDeposit ? (hasFunnelPromo ? 1399 : 1599) : amountPaid;
```

A £99 sale fails the gate, so Meta learns the buyer is worth **£99 instead of £1,099** —
on the ad account this campaign's audience came from. Resolve `contractValue` from the
link config instead of a magic number, and keep the existing guard: an amount that maps to
nothing known still reports its real value rather than inventing one.

## Task 4 — The £599 in the instalment emails

Four sites compute totals from a literal 599:

| Line | What it says |
|---|---|
| `route.ts:803` | `const total = 599 + paid * 200` |
| `route.ts:820` | `(£599 deposit + ${paid} × £200)` |
| `route.ts:870` | `Collected so far £X of £Y` (paid email) |
| `handleInstalmentFailed` | same `599 + paid * 200` in the failure alert |

For a £99 buyer every one is wrong — after two instalments they report £999 collected
when it is £499. Take the entry amount from the subscription metadata (already stamped at
checkout) and the target total from `contractValue`.

Also review the fixed copy at `route.ts:230` and `:248`, which assert "full £1,599 over 5
instalments" in admin/ops output.

## Task 5 — The £500 course-sale floor

`isCourseSale()` (`route.ts:65`) trusts `metadata.source === "api-checkout-session"` first,
so the normal path is fine. The **fallback** path is not: a raw Payment Link session at £99
fails `amountGbp >= 500` and drops out of GA4 and CAPI silently. Add the £99 price to the
known-course set rather than lowering the floor, which would let gym charges back in.
Same review for the `:353` heuristic.

## Task 6 — Closing the offer at midnight Sunday

**The fail-safe is a trap here.** Deactivating the £99 price does *not* close the offer —
session creation fails and every caller falls back to the raw Payment Link, which keeps
selling. Closing requires **both**:

1. A date gate in code — after the cutoff the £99 link resolves to nothing and the enrol
   page shows the standard pricing.
2. Deactivating the Stripe Payment Link itself.

Do 1 first. 2 alone leaves the API path live; 2 without 1 leaves the fallback live.

## Task 7 — Payment terms at the point of sale

The five instalments are **due in full regardless of how quickly the qualification is
completed**, and the certificate is released on final payment. That is the deal, and it
needs to be visible where someone agrees to it — not only in a T&Cs document.

Use Stripe Checkout's `consent_collection.terms_of_service: "required"` with the terms URL,
plus a line of `custom_text` naming the five payments and the certificate condition. It
stays out of the marketing emails deliberately; it does not get to stay out of checkout.

## Task 8 — Policy, not code

Two decisions that need an answer before launch, because full course access is granted
against £99:

- **When Stripe stops retrying, what happens?** The alert already fires. Who chases, on
  what timetable, and at what point is access suspended rather than just the certificate
  held.
- **Partner-of-record**, for a prospect on the PTLL list whose origin was a partner gym.

---

## Tests

- `buildSessionParams` for the £99 link: attaches the recurring price, 30-day trial,
  target 5, no promotion codes.
- Contract-value resolution: 99 → 1099, 599 → 1599, 1399 → 1399, 1599 → 1599, unknown →
  actual amount.
- Instalment email totals for a £99 plan at paid = 0…5.
- `isCourseSale` for a £99 fallback-path session.
- Date gate: one case either side of the cutoff.
- End-to-end in Stripe test mode, with `STRIPE_SEPT99_PRICE_ID` overridden — the existing
  e2e already swaps the test key, and this price will not exist in test mode otherwise.

## Order

1, 2, 3, 4, 5 in sequence — each is independently verifiable. 6 before the first
scarcity email goes out. 7 before any money is taken. 8 in parallel, owned by Callum.
