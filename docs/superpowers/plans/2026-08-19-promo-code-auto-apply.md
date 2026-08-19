# Promo Code Auto-Apply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a partner's discount actually apply at Stripe — automatically on their page, resolved live from Stripe, and never on a deposit.

**Architecture:** A server-side resolver turns a code string into a Stripe promotion code ID, scoped to the partner that owns it. `createCheckoutSession` passes that ID as `discounts[0][promotion_code]` on pay-in-full only, which forces Stripe's own code box off and makes double entry impossible. The pure decision logic — which code wins, and whether a session may carry a discount — is extracted so it can be tested without touching the network.

**Tech Stack:** Next.js 15 App Router, Stripe REST API (raw `fetch`, no SDK), Node 22+ native TS type-stripping, `node --test`, Playwright for e2e.

## Global Constraints

- **Deposits are never discounted.** £599 + 5 × £200 = £1,599, always. Enforced in `stripeCheckout.ts`, not only in the UI.
- **`discounts` and `allow_promotion_codes` are mutually exclusive on a Stripe Checkout Session.** Passing a discount must force `allow_promotion_codes: false`.
- **`discounts[0][promotion_code]` takes a promotion code ID (`promo_…`)**, never the customer-facing string.
- **The button label must always equal the exact amount Stripe will charge.** This is the invariant to test hardest.
- **Prices come from Stripe, never from config.** `PartnerConfig.promoCodes` and its hardcoded `fullPrice`/`depositPrice` are deleted.
- **Codes are scoped by partner prefix.** `HITIO500` must not work on Gym n Go's page.
- **`unknown` and `wrong-partner` return the same message to the learner** — never confirm another partner's code exists.
- **`promo_code` metadata must still be written** — the webhook reads it in six places for the ops sheet, admin email and partner attribution.
- Tests: `npm run test:unit` runs `node --test "tests/*.test.mts"`. Currently 43 passing on the ad-packs branch; this branch is cut from master, so expect a different baseline — record it in Task 1 and use that.
- Commit only files each task names. The working tree carries ~30 files of unrelated uncommitted work — never `git add -A`, never `git stash`.

---

### Task 1: Pure promo-code selection

**Files:**
- Create: `app/lib/promoCodes.ts`
- Create: `tests/promoCodes.test.mts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type PromoRefusal = "unknown" | "wrong-partner" | "exhausted" | "inactive"`
  - `interface StripePromotionCode { id: string; code: string; active: boolean; times_redeemed: number; max_redemptions: number | null; coupon: { amount_off: number | null; valid: boolean } }`
  - `interface PromoResolution { ok: true; promoId: string; code: string; amountOffPence: number }` or `{ ok: false; reason: PromoRefusal }`
  - `selectPromoCode(list: StripePromotionCode[], code: string, prefixes: string[]): PromoResolution`

- [ ] **Step 1: Record the test baseline**

Run: `npm run test:unit`
Write down the passing count. Every later task's expected count builds on this number.

- [ ] **Step 2: Write the failing test**

```typescript
// tests/promoCodes.test.mts
//
// WHAT THIS PROTECTS
//
// Money. A partner's discount is now applied automatically at Stripe rather
// than typed in by the learner, so this function decides what someone pays.
//
// Three real properties of the live Stripe account drive these cases:
//
// 1. 18 code strings are DUPLICATED, each with exactly one active version and
//    an archived twin. Resolving to the archived one would apply a coupon that
//    no longer exists, or the wrong amount.
// 2. Launch codes are slot-capped — HITIO500 has 3 places, HITIO300 has 2 —
//    so exhaustion is a normal case, and the learner must be told at the box
//    rather than at the payment screen.
// 3. Codes are guessable from the pattern (GYMNGO500, XCELERATE500), and a cap
//    makes them worth guessing. A learner at one gym must not be able to burn
//    another gym's places.

import { test } from "node:test";
import assert from "node:assert/strict";
import { selectPromoCode, type StripePromotionCode } from "../app/lib/promoCodes.ts";

function code(over: Partial<StripePromotionCode> & { code: string; id: string }): StripePromotionCode {
  return {
    active: true,
    times_redeemed: 0,
    max_redemptions: null,
    coupon: { amount_off: 20000, valid: true },
    ...over,
  };
}

const HITIO_LIST: StripePromotionCode[] = [
  code({ id: "promo_standing", code: "HITIOPT", coupon: { amount_off: 20000, valid: true } }),
  code({ id: "promo_500", code: "HITIO500", max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
  code({ id: "promo_300", code: "HITIO300", max_redemptions: 2, coupon: { amount_off: 30000, valid: true } }),
];

test("a live launch code resolves to its id and amount", () => {
  const r = selectPromoCode(HITIO_LIST, "HITIO500", ["HITIO"]);
  assert.deepEqual(r, { ok: true, promoId: "promo_500", code: "HITIO500", amountOffPence: 50000 });
});

test("the code is matched case-insensitively — learners type lowercase", () => {
  const r = selectPromoCode(HITIO_LIST, "hitio500", ["HITIO"]);
  assert.equal(r.ok && r.promoId, "promo_500");
});

test("another gym's code is refused even though it is perfectly valid", () => {
  // The whole point of the prefix check: HITIO500 has 3 places and is
  // guessable from the pattern. A Gym n Go learner must not burn one.
  const r = selectPromoCode(HITIO_LIST, "HITIO500", ["GYMNGO"]);
  assert.deepEqual(r, { ok: false, reason: "wrong-partner" });
});

test("a code nobody has is unknown", () => {
  assert.deepEqual(selectPromoCode(HITIO_LIST, "NOPE500", ["HITIO"]), { ok: false, reason: "unknown" });
});

test("a fully claimed launch code is refused as exhausted, not silently applied", () => {
  const list = [code({ id: "promo_500", code: "HITIO500", max_redemptions: 3, times_redeemed: 3 })];
  assert.deepEqual(selectPromoCode(list, "HITIO500", ["HITIO"]), { ok: false, reason: "exhausted" });
});

test("an uncapped code is never exhausted however often it is used", () => {
  const list = [code({ id: "promo_standing", code: "HITIOPT", max_redemptions: null, times_redeemed: 999 })];
  assert.equal(selectPromoCode(list, "HITIOPT", ["HITIO"]).ok, true);
});

test("the archived twin of a duplicated code is never resolved", () => {
  // 18 code strings in the live account have exactly this shape.
  const list = [
    code({ id: "promo_archived", code: "GYMNGO500", active: false, coupon: { amount_off: 50000, valid: true } }),
    code({ id: "promo_live", code: "GYMNGO500", active: true, max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
  ];
  assert.equal(selectPromoCode(list, "GYMNGO500", ["GYMNGO"]).ok && selectPromoCode(list, "GYMNGO500", ["GYMNGO"]).promoId, "promo_live");
});

test("an inactive code with no live twin is refused", () => {
  const list = [code({ id: "promo_dead", code: "HITIOPT", active: false })];
  assert.deepEqual(selectPromoCode(list, "HITIOPT", ["HITIO"]), { ok: false, reason: "inactive" });
});

test("a code whose coupon has gone invalid is refused", () => {
  const list = [code({ id: "promo_x", code: "HITIOPT", coupon: { amount_off: 20000, valid: false } })];
  assert.deepEqual(selectPromoCode(list, "HITIOPT", ["HITIO"]), { ok: false, reason: "inactive" });
});

test("a percentage coupon is refused — every coupon in the account is amount_off", () => {
  // Not supported on purpose. A percent coupon would make the displayed price
  // depend on maths we would have to duplicate from Stripe, and the button
  // label must equal what Stripe charges.
  const list = [code({ id: "promo_pct", code: "HITIOPT", coupon: { amount_off: null, valid: true } })];
  assert.deepEqual(selectPromoCode(list, "HITIOPT", ["HITIO"]), { ok: false, reason: "inactive" });
});

test("a gym with two prefixes accepts codes under both", () => {
  // Iron Wolf's standing code is IWGPTDISCOUNT but its launch codes are
  // IRONWOLF500/300 — verified live. A single prefix would refuse the gym its
  // own launch discount, which is precisely the bug this change exists to fix.
  const list = [
    code({ id: "promo_iwg", code: "IWGPTDISCOUNT" }),
    code({ id: "promo_iw500", code: "IRONWOLF500", max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
  ];
  assert.equal(selectPromoCode(list, "IWGPTDISCOUNT", ["IWG", "IRONWOLF"]).ok, true);
  assert.equal(selectPromoCode(list, "IRONWOLF500", ["IWG", "IRONWOLF"]).ok, true);
  // and still refuses a code belonging to neither
  assert.deepEqual(selectPromoCode(list, "HITIO500", ["IWG", "IRONWOLF"]), { ok: false, reason: "wrong-partner" });
});

test("whitespace around a pasted code does not break it", () => {
  assert.equal(selectPromoCode(HITIO_LIST, "  HITIO500 ", ["HITIO"]).ok, true);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../app/lib/promoCodes.ts'`.

- [ ] **Step 4: Write the implementation**

```typescript
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
 * Order matters, but not for secrecy: the validate route returns the SAME
 * message for `unknown` and `wrong-partner`, so a stranger still cannot learn
 * whether HITIO500 exists. Existence is checked first so the server log tells
 * the truth about which of the two actually happened.
 */
export function selectPromoCode(
  list: StripePromotionCode[],
  code: string,
  prefixes: string[],
): PromoResolution {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return { ok: false, reason: "unknown" };

  // Existence first, ownership second. Both refusals return the SAME message to
  // the learner (see the validate route), so the ordering leaks nothing — but it
  // decides whether the server log says "no such code" or "not this gym's code",
  // and only one of those is true in each case.
  const matches = list.filter((p) => p.code.trim().toUpperCase() === wanted);
  if (matches.length === 0) return { ok: false, reason: "unknown" };

  // A list, not a single prefix: Iron Wolf's standing code is IWGPTDISCOUNT but
  // its launch codes are IRONWOLF500/300, and Muscle Bound is MBG/MUSCLEBOUND.
  // A single prefix would refuse those gyms' own codes — the exact bug we are here to fix.
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS — baseline + 12.

- [ ] **Step 6: Commit**

```bash
git add app/lib/promoCodes.ts tests/promoCodes.test.mts
git commit -m "Resolve a promo code to the Stripe id that can actually be applied"
```

---

### Task 2: Fetch live codes from Stripe

**Files:**
- Modify: `app/lib/promoCodes.ts`

**Interfaces:**
- Consumes: `selectPromoCode`, `StripePromotionCode`, `PromoResolution` (Task 1).
- Produces: `resolvePromoCode(code: string, prefixes: string[]): Promise<PromoResolution>` — server-only, reads `STRIPE_SECRET_KEY`.

There is no unit test for the fetch itself; it is a network wrapper and mocking `fetch` here would test the mock. Task 1 covers every decision it makes. Step 3 is a live read-only check instead.

- [ ] **Step 1: Add the fetch wrapper**

Append to `app/lib/promoCodes.ts`:

```typescript
/**
 * Every active promotion code in the account, paged.
 *
 * Listing beats a filtered lookup because Stripe's promotion_codes endpoint
 * matches `code` exactly and case-sensitively, and learners paste lowercase.
 * The account holds under 100 codes; if it ever outgrows one page, this follows
 * `has_more` rather than silently resolving against a truncated list — a
 * truncated list would read as "unknown code" and quietly deny a real discount.
 */
async function listActivePromotionCodes(key: string): Promise<StripePromotionCode[]> {
  const all: StripePromotionCode[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams({ limit: "100", active: "true" });
    if (startingAfter) qs.set("starting_after", startingAfter);

    const res = await fetch(`https://api.stripe.com/v1/promotion_codes?${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`stripe promotion_codes ${res.status}`);

    const body = await res.json();
    all.push(...(body.data ?? []));
    if (!body.has_more || !body.data?.length) break;
    startingAfter = body.data[body.data.length - 1].id;
  }

  return all;
}

/**
 * Resolve a code for a partner, live.
 *
 * Returns "unknown" when Stripe cannot be reached. That is deliberate: the
 * alternative is applying a discount we have not verified, and the failure this
 * whole change exists to remove is a page promising a price Stripe will not
 * charge. Refusing a real code is recoverable; promising £1,399 and billing
 * £1,599 is not.
 */
export async function resolvePromoCode(code: string, prefixes: string[]): Promise<PromoResolution> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[promoCodes] STRIPE_SECRET_KEY not set — refusing the code");
    return { ok: false, reason: "unknown" };
  }

  try {
    return selectPromoCode(await listActivePromotionCodes(key), code, prefixes);
  } catch (err) {
    console.error("[promoCodes] lookup failed", err);
    return { ok: false, reason: "unknown" };
  }
}
```

- [ ] **Step 2: Run tests to confirm nothing regressed**

Run: `npm run test:unit`
Expected: same count as Task 1 Step 5 — adding the wrapper must not change the pure tests.

- [ ] **Step 3: Verify against the live account, read-only**

```bash
node --use-system-ca -e "
const fs=require('fs');
for (const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)) { const m=l.match(/^([A-Z0-9_]+)=(.*)\$/); if(m&&!process.env[m[1]]) process.env[m[1]]=m[2].trim().replace(/^[\"']|[\"']\$/g,''); }
import('./app/lib/promoCodes.ts').then(async ({ resolvePromoCode }) => {
  for (const [code, prefixes] of [['HITIOPT',['HITIO']],['hitio500',['HITIO']],['HITIO300',['HITIO']],['HITIO500',['GYMNGO']],['NOPE',['HITIO']],['IRONWOLF500',['IWG','IRONWOLF']]]) {
    console.log(code.padEnd(12), String(prefixes).padEnd(16), JSON.stringify(await resolvePromoCode(code, prefixes)));
  }
});
"
```

Expected: `HITIOPT` and `hitio500` and `HITIO300` resolve with `ok: true` and amounts 20000 / 50000 / 30000; `HITIO500` under prefix `GYMNGO` returns `wrong-partner`; `NOPE` returns `unknown`. This reads Stripe only — it creates nothing.

- [ ] **Step 4: Commit**

```bash
git add app/lib/promoCodes.ts
git commit -m "Look promo codes up live rather than from a hardcoded list"
```

---

### Task 3: The validate endpoint

**Files:**
- Create: `app/api/promo/validate/route.ts`

**Interfaces:**
- Consumes: `resolvePromoCode` (Task 2).
- Produces: `POST /api/promo/validate` — body `{ code: string, gymSlug: string }`; returns `{ valid: true, code, amountOffPence }` or `{ valid: false, reason, message }`.

- [ ] **Step 1: Read an existing route for the house style**

Run: `sed -n '1,60p' app/api/checkout/route.ts`
Note how it validates and clamps input (`str(body.x, max)`) and what it returns on failure. Follow that shape.

- [ ] **Step 2: Write the route**

```typescript
// app/api/promo/validate/route.ts
//
// The only way the browser learns whether a promo code is real and what it is
// worth. The client used to decide this from a hardcoded object, which is why
// HITIO's launch codes returned "invalid" while working perfectly in Stripe.
//
// The Stripe key never leaves the server, and the amount comes back from Stripe
// so the page can never display a discount Stripe will not honour.

import { NextRequest, NextResponse } from "next/server";
import { resolvePromoCode, type PromoRefusal } from "@/app/lib/promoCodes";
import { PARTNER_PROMO_PREFIXES } from "@/app/lib/partnerPromo";

// `unknown` and `wrong-partner` deliberately share a message. Confirming that
// HITIO500 exists tells a stranger that a code with three places is worth
// guessing, and the pattern across partners is obvious.
const MESSAGES: Record<PromoRefusal, string> = {
  unknown: "We don't recognise that code.",
  "wrong-partner": "We don't recognise that code.",
  exhausted: "That code has been fully claimed.",
  inactive: "That code is no longer available.",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "unknown", message: MESSAGES.unknown });
  }

  const code = typeof body.code === "string" ? body.code.trim().slice(0, 60) : "";
  const gymSlug = typeof body.gymSlug === "string" ? body.gymSlug.trim().slice(0, 60) : "";
  const prefix = PARTNER_PROMO_PREFIXES[gymSlug];

  if (!code || !prefix) {
    return NextResponse.json({ valid: false, reason: "unknown", message: MESSAGES.unknown });
  }

  const result = await resolvePromoCode(code, prefix);
  if (!result.ok) {
    return NextResponse.json({ valid: false, reason: result.reason, message: MESSAGES[result.reason] });
  }

  // promoId is deliberately NOT returned. The browser sends the code string
  // back at checkout and the server resolves it again, so a tampered client
  // cannot nominate an arbitrary promotion code id.
  return NextResponse.json({ valid: true, code: result.code, amountOffPence: result.amountOffPence });
}
```

- [ ] **Step 3: Create the prefix map**

```typescript
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
```

These were verified against the live account on 2026-08-19 and the two-prefix cases are already handled above. Step 4 re-checks them, because a wrong prefix silently refuses a real discount and that is the bug being fixed.

- [ ] **Step 4: Check every partner's real codes against the map**

```bash
node --use-system-ca -e "
const fs=require('fs');
for (const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)) { const m=l.match(/^([A-Z0-9_]+)=(.*)\$/); if(m&&!process.env[m[1]]) process.env[m[1]]=m[2].trim().replace(/^[\"']|[\"']\$/g,''); }
const K=process.env.STRIPE_SECRET_KEY;
(async()=>{
  const r=await (await fetch('https://api.stripe.com/v1/promotion_codes?limit=100&active=true',{headers:{Authorization:'Bearer '+K}})).json();
  const codes=(r.data||[]).map(p=>p.code).sort();
  console.log(codes.join('\n'));
})();
"
```

List every active code, then confirm each partner's codes all start with that partner's prefix. Fix the map — or switch it to a list per gym — before moving on. A wrong prefix silently refuses a real discount.

- [ ] **Step 5: Verify the endpoint end to end**

Run `npm run dev`, then:

```bash
curl -s -X POST localhost:3000/api/promo/validate -H 'content-type: application/json' -d '{"code":"HITIOPT","gymSlug":"hitio-orpington"}'
curl -s -X POST localhost:3000/api/promo/validate -H 'content-type: application/json' -d '{"code":"HITIO500","gymSlug":"gym-n-go"}'
curl -s -X POST localhost:3000/api/promo/validate -H 'content-type: application/json' -d '{"code":"NOPE","gymSlug":"hitio-orpington"}'
```

Expected: first returns `valid: true` with `amountOffPence: 20000`; second and third both return the identical `"We don't recognise that code."` — confirm the two messages are byte-identical, since that is the property that stops the endpoint confirming another gym's codes.

- [ ] **Step 6: Commit**

```bash
git add app/api/promo/validate/route.ts app/lib/partnerPromo.ts
git commit -m "Validate promo codes server-side against Stripe"
```

---

### Task 4: Apply the discount at Stripe, never on a deposit

**Files:**
- Modify: `app/lib/stripeCheckout.ts`
- Create: `tests/stripeDiscounts.test.mts`

**Interfaces:**
- Consumes: nothing from earlier tasks at runtime.
- Produces:
  - `CheckoutSessionInput` gains `promoCodeId?: string`
  - `buildSessionParams(input: CheckoutSessionInput, config: LinkConfig, opts: { withInstalments: boolean; target: number; cancelPath: string }): Record<string, unknown>` — **exported** so the money rules can be tested without Stripe.

This task extracts the params object `createCheckoutSession` currently builds inline into `buildSessionParams`, then adds the discount rules. The extraction is what makes the deposit guard testable; without it the only way to check "a deposit never carries a discount" is to create real sessions.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/stripeDiscounts.test.mts
//
// WHAT THIS PROTECTS
//
// The two money rules that cannot be allowed to drift.
//
// 1. A DEPOSIT IS NEVER DISCOUNTED. The webhook has said so since 2026-07-26
//    ("deposit plans take the full £1,599 over 5 instalments; the promo
//    discount applies to pay-in-full only"), but the front end contradicted it
//    and promised £1,399 while Stripe billed £1,599. Enforcing it here rather
//    than in the UI means a future page cannot reintroduce that.
// 2. A SESSION NEVER CARRIES BOTH `discounts` AND `allow_promotion_codes`.
//    Stripe rejects such a session outright, so getting this wrong does not
//    mis-price anything — it takes checkout down completely.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSessionParams, PAYMENT_LINK_PRICES } from "../app/lib/stripeCheckout.ts";

const PIF = PAYMENT_LINK_PRICES["https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f"];
const DEPOSIT = PAYMENT_LINK_PRICES["https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05"];

const base = { paymentLink: "x", email: "a@b.com", name: "A B", gymSlug: "hitio-orpington" };
const opts = { withInstalments: false, target: 5, cancelPath: "/enrol" };

test("a pay-in-full session with a promo id carries the discount", () => {
  const p = buildSessionParams({ ...base, promoCodeId: "promo_500" }, PIF, opts);
  assert.deepEqual(p.discounts, [{ promotion_code: "promo_500" }]);
});

test("a discounted session must not also offer Stripe's own code box", () => {
  // Stripe rejects a session carrying both. This is also what makes the
  // double-entry confusion structurally impossible rather than just reworded.
  const p = buildSessionParams({ ...base, promoCodeId: "promo_500" }, PIF, opts);
  assert.equal(p.allow_promotion_codes, false);
});

test("a pay-in-full session with no promo keeps Stripe's code box", () => {
  const p = buildSessionParams({ ...base }, PIF, opts);
  assert.equal(p.discounts, undefined);
  assert.equal(p.allow_promotion_codes, true);
});

test("A DEPOSIT IS NEVER DISCOUNTED, even when a promo id is passed", () => {
  const p = buildSessionParams(
    { ...base, promoCodeId: "promo_500" },
    DEPOSIT,
    { ...opts, withInstalments: true },
  );
  assert.equal(p.discounts, undefined, "a deposit must never carry a discount");
  assert.equal(p.allow_promotion_codes, false);
});

test("a deposit with no promo is unchanged", () => {
  const p = buildSessionParams({ ...base }, DEPOSIT, { ...opts, withInstalments: true });
  assert.equal(p.discounts, undefined);
  assert.equal(p.allow_promotion_codes, false);
});

test("the promo code string still reaches metadata for the webhook", () => {
  // The webhook reads metadata.promo_code in six places — ops sheet, admin
  // email, partner attribution. Applying the discount must not replace it.
  const p = buildSessionParams(
    { ...base, promoCodeId: "promo_500", promoCode: "HITIO500" },
    PIF,
    opts,
  );
  assert.equal((p.metadata as Record<string, unknown>).promo_code, "HITIO500");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `buildSessionParams` is not exported from `stripeCheckout.ts`.

- [ ] **Step 3: Extract the params builder**

In `app/lib/stripeCheckout.ts`, take the object currently passed to `encodeForm(...)` inside `createCheckoutSession` (it starts `mode: withInstalments ? "subscription" : "payment",` and ends with the `metadata` block) and move it verbatim into a new exported function above `createCheckoutSession`:

```typescript
/**
 * The Checkout Session parameters, as a plain object.
 *
 * Extracted from createCheckoutSession so the two money rules below can be
 * tested without creating real sessions. Everything here was previously inline
 * and is unchanged except where the discount rules are applied.
 */
export function buildSessionParams(
  input: CheckoutSessionInput,
  config: LinkConfig,
  opts: { withInstalments: boolean; target: number; cancelPath: string },
): Record<string, unknown> {
  const { withInstalments, target, cancelPath } = opts;

  // A deposit is never discounted. The rule is Callum's, from 2026-07-26, and
  // the webhook has stated it since — but the enrolment page contradicted it and
  // promised £1,399 while Stripe billed £1,599. Enforcing it here means the UI
  // is no longer the only thing standing between a deposit and a discount.
  const discountable = !withInstalments && config.amount >= 1300;
  const discountId = discountable ? input.promoCodeId : undefined;

  return {
    // …the existing object, verbatim…
    // then replace the single `allow_promotion_codes` line with the two below:
    ...(discountId && { discounts: [{ promotion_code: discountId }] }),
    // Stripe rejects a session carrying both `discounts` and
    // `allow_promotion_codes`, so applying a discount necessarily removes the
    // second code box — which is the confusion this whole change exists to end.
    allow_promotion_codes: discountId ? false : config.allowPromotionCodes,
  };
}
```

Also add `promoCodeId?: string;` to `CheckoutSessionInput`, and export the `LinkConfig` interface so the test can type against it.

Then make `createCheckoutSession` call it:

```typescript
  const body = encodeForm(buildSessionParams(input, config, { withInstalments, target, cancelPath }));
```

`encodeForm` already handles arrays of objects, so `discounts` encodes as `discounts[0][promotion_code]=…` with no further change — confirmed at `stripeCheckout.ts:146-153`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS — baseline + 12 + 6.

- [ ] **Step 5: Accept the resolved code in the checkout API**

In `app/api/checkout/route.ts`, resolve the code server-side rather than trusting the client:

```typescript
import { resolvePromoCode } from "@/app/lib/promoCodes";
import { PARTNER_PROMO_PREFIXES } from "@/app/lib/partnerPromo";

  // The browser sends the code STRING, never a promotion code id. Resolving it
  // again here means a tampered client cannot nominate an arbitrary discount.
  const promoCode = str(body.promoCode, 60);
  const gymSlug = str(body.gymSlug, 60);
  const prefix = gymSlug ? PARTNER_PROMO_PREFIXES[gymSlug] : undefined;
  const resolved = promoCode && prefix ? await resolvePromoCode(promoCode, prefix) : null;
```

then pass `promoCodeId: resolved?.ok ? resolved.promoId : undefined` into `createCheckoutSession` alongside the existing `promoCode`.

- [ ] **Step 6: Commit**

```bash
git add app/lib/stripeCheckout.ts app/api/checkout/route.ts tests/stripeDiscounts.test.mts
git commit -m "Apply the discount at Stripe, and never on a deposit"
```

---

### Task 5: Partner config

**Files:**
- Modify: `app/enrol/shared.tsx:14-31`
- Modify: all nine partner enrol pages (see list below)

**Interfaces:**
- Consumes: `PARTNER_STANDING_CODE`, `PARTNER_PROMO_PREFIXES` (Task 3).
- Produces: `PartnerConfig` loses `promoCodes` and gains nothing — the standing code and prefix are looked up from `gymSlug` via the Task 3 maps, so a partner page carries no pricing at all.

- [ ] **Step 1: Remove the hardcoded pricing from the type**

In `app/enrol/shared.tsx`, delete the whole `promoCodes?: Record<…>` block from `PartnerConfig` and replace the comment above it:

```typescript
  stripeFullLink?: string;       // default full-price Stripe link
  stripeDepositLink?: string;    // default deposit Stripe link
  // No promo config here on purpose. Prices and discounts come from Stripe at
  // request time, keyed off gymSlug — see app/lib/partnerPromo.ts. Hardcoding
  // them here is what let the page advertise £1,399 while Stripe charged
  // £1,599, and what kept HITIO's launch codes off the site entirely.
}
```

- [ ] **Step 2: Strip the promo block from all nine partner pages**

These files each carry a `promoCodes: { … }` object inside their partner config. Delete that object from each, leaving `gymSlug`, `gymReferral` and any `stripeFullLink`/`stripeDepositLink`:

- `app/6fit-academy/enrol/page.tsx`
- `app/ebor-fitness/enrol/page.tsx`
- `app/gym-n-go-academy/enrol/page.tsx`
- `app/hitio-orpington-academy/enrol/page.tsx`
- `app/ironwolf-gym/enrol/page.tsx`
- `app/mof-gym/enrol/page.tsx`
- `app/muscle-bound-academy/enrol/page.tsx`
- `app/superflex-academy/enrol/page.tsx`
- `app/xcelerate-academy/enrol/page.tsx`

Also update `app/_gym-template/enrol/page.tsx` so the template for the next partner does not reintroduce the pattern.

Find them with: `grep -rln "promoCodes" app/`

- [ ] **Step 3: Verify nothing still reads the removed field**

Run: `grep -rn "promoCodes\|discountAmount\|fullPrice\|depositPrice" app/ --include=*.tsx --include=*.ts`
Expected: no hits outside `app/enrol/EnrolmentFlow.tsx`, which Task 6 rewrites. Any other hit must be resolved now.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "enrol|partner" | head -20`
Expected: errors only in `EnrolmentFlow.tsx`, which Task 6 fixes. Note the pre-existing unrelated errors elsewhere and leave them.

- [ ] **Step 5: Commit**

```bash
git add app/enrol/shared.tsx app/*/enrol/page.tsx app/_gym-template/enrol/page.tsx
git commit -m "Take pricing out of partner config — Stripe is the source of truth"
```

---

### Task 6: The enrolment page

**Files:**
- Modify: `app/enrol/EnrolmentFlow.tsx` — the promo block (~130-145), the pricing block (~285-300), and the two plan cards (~390-445)

**Interfaces:**
- Consumes: `POST /api/promo/validate` (Task 3), `PARTNER_STANDING_CODE` (Task 3).
- Produces: no exports change.

- [ ] **Step 1: Auto-apply the standing code on mount**

Replace the client-side `applyPromo` at `EnrolmentFlow.tsx:135-142` and add an effect that applies the partner's standing code without any typing:

```typescript
  // The partner's standing discount is applied automatically. The page already
  // advertises the discounted price, so making the learner type a code to reach
  // the advertised figure was pure friction — and it is what made HITIO think
  // codes were broken when they typed a launch code the site had never heard of.
  useEffect(() => {
    if (!partner?.gymSlug) return;
    const standing = PARTNER_STANDING_CODE[partner.gymSlug];
    if (standing) void applyCode(standing, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.gymSlug]);

  async function applyCode(code: string, { silent = false } = {}) {
    const res = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, gymSlug: partner?.gymSlug }),
    }).then((r) => r.json()).catch(() => ({ valid: false, message: "" }));

    if (res.valid) {
      setAppliedPromo({ code: res.code, amountOffPence: res.amountOffPence });
      setPromoError("");
      return;
    }
    // A failed STANDING code must never shout at the learner — they did not type
    // it. The page simply shows full price, which is recoverable; showing a
    // discount we cannot deliver is the fault being removed.
    if (!silent) setPromoError(res.message || "We don't recognise that code.");
  }
```

`appliedPromo` becomes `{ code: string; amountOffPence: number } | null` instead of a string key.

- [ ] **Step 2: Derive both prices from Stripe's numbers**

Replace the block at `EnrolmentFlow.tsx:288-296`:

```typescript
  // Pay-in-full is £1,599 less whatever Stripe says the applied code is worth.
  const PIF_PENCE = 159_900;
  const fullPricePence = PIF_PENCE - (appliedPromo?.amountOffPence ?? 0);

  // The deposit is NEVER discounted: £599 now, then 5 × £200. The old code
  // computed instalments as (fullPrice - depositPrice) / 200, which produced 4
  // instalments and a £1,399 total against a Stripe charge of £1,599. Delete
  // that arithmetic; do not adapt it.
  const DEPOSIT_PENCE = 59_900;
  const INSTALMENT_PENCE = 20_000;
  const INSTALMENT_COUNT = 5;
  const depositTotalPence = DEPOSIT_PENCE + INSTALMENT_COUNT * INSTALMENT_PENCE;
```

- [ ] **Step 3: Rewrite the two plan cards**

The pay-in-full card shows `fullPricePence`, and its button reads `Pay £{fullPricePence/100} →`. The deposit card always shows `£599` and `5 × £200 — £1,599 total`, with a line reading **"Discounts apply to pay-in-full only."** whenever `appliedPromo` is set. Remove the `Save £{1599 - activePromo.fullPrice}` line from the deposit card entirely.

- [ ] **Step 4: Relabel the box for launch codes**

The heading becomes **"Got a launch code from the gym?"**. When a launch code replaces the standing discount, say so rather than swapping silently:

```tsx
{appliedPromo && (
  <p className="text-gold font-bold text-sm">
    ✓ £{(appliedPromo.amountOffPence / 100).toLocaleString()} off applied
  </p>
)}
```

Delete the line "Enter this code at Stripe checkout to apply your discount" — it is no longer true, and it was the sentence that caused the confusion.

- [ ] **Step 5: Verify in the browser**

Run `npm run dev` and open `http://localhost:3000/hitio-orpington-academy/enrol`. Confirm:

- The page loads showing **£1,399** with no typing, and the button reads **"Pay £1,399 →"**
- The deposit card reads **£599** and **£1,599 total**, and does NOT say £1,399
- Typing `HITIO500` shows £500 off and the button reads **"Pay £1,099 →"**
- Typing `GYMNGO500` shows **"We don't recognise that code."**
- Typing `NOPE` shows the identical message

Then click through to Stripe on pay-in-full and confirm **Stripe's own total matches the button**, and that Stripe shows **no promotion-code box**. Do not complete the payment.

- [ ] **Step 6: Verify the deposit path at Stripe**

With a code applied, click the deposit button and confirm Stripe charges **£599** and the page never promised anything but £1,599 in total. Do not complete the payment.

- [ ] **Step 7: Commit**

```bash
git add app/enrol/EnrolmentFlow.tsx
git commit -m "Auto-apply the partner discount and stop promising deposits a price they cannot get"
```

---

### Task 7: End-to-end coverage

**Files:**
- Modify: `e2e/hitio-attribution.spec.ts`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Read the existing spec**

Run: `sed -n '1,80p' e2e/hitio-attribution.spec.ts`
It already drives this partner's enrolment flow — extend it rather than adding a parallel file, so the two cannot drift.

- [ ] **Step 2: Add three cases**

Add tests asserting:

1. Opening `/hitio-orpington-academy/enrol` shows the pay-in-full button reading `£1,399` **with no interaction** — the auto-apply.
2. Applying `GYMNGO500` shows `We don't recognise that code.` and the button still reads `£1,399` — scoping holds and a refusal does not clear the standing discount.
3. The deposit card reads `£1,599` total both before and after a code is applied — the money rule, from the learner's side.

Follow the file's existing selector conventions.

- [ ] **Step 3: Run the e2e suite**

Run: `npm run test:e2e`
Expected: pass. If the suite is red before your changes, record which tests were already failing and confirm you have not added to them.

- [ ] **Step 4: Commit**

```bash
git add e2e/hitio-attribution.spec.ts
git commit -m "Cover auto-apply, code scoping and the deposit total end to end"
```

---

## Self-review

**Spec coverage:** resolver and scoping (Tasks 1-2), validate endpoint with shared refusal message (Task 3), `discounts` + deposit guard + metadata preservation (Task 4), config removal (Task 5), auto-apply, deposit pricing and the relabelled box (Task 6), e2e (Task 7). Every failure case in the spec's table is covered by `MESSAGES` in Task 3.

**Two risks called out inside the tasks rather than left to be discovered:**

- **Two gyms need two prefixes each, and the plan already carries them.** Verified live: `ironwolf` has `IWGPTDISCOUNT` alongside `IRONWOLF500`/`IRONWOLF300`, and `muscle-bound` has `MBGPTDISCOUNT` alongside `MUSCLEBOUND500`/`MUSCLEBOUND300`. `PARTNER_PROMO_PREFIXES` is `Record<string, string[]>` for this reason. Task 1 must include a test that a two-prefix gym accepts both.

- **Only four gyms have an active launch code.** Live check: `gym-n-go`, `hitio-orpington`, `superflex` and `xcelerate` have `*500`/`*300` active. `6fit`, `ebor`, `mof` and `muscle-bound` have **only their standing £200 code active** — their launch codes are archived. Nothing in this plan changes that, and it is not a defect, but those four gyms cannot offer a launch discount until someone reactivates or recreates the codes in Stripe. Worth Callum knowing before partners ask.
- **`buildSessionParams` is an extraction of live payment code.** Task 4 Step 3 says to move the object verbatim and change only the discount lines. Any accidental edit to `line_items`, `subscription_data` or `metadata` changes what buyers are charged or breaks webhook attribution.

**Deliberate omission:** no unit test mocks `fetch`. Task 1 covers every decision `resolvePromoCode` makes; Task 2's live read-only check proves the wiring.
