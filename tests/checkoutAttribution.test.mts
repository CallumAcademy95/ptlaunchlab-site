// tests/checkoutAttribution.test.mts
//
// WHAT THIS PROTECTS
//
// Attribution must land in Stripe metadata on every path a sale can take:
// the session (all modes), the subscription (instalment plans, which outlive
// the session) and the PaymentIntent (one-off payments). And the PaymentIntent
// block must appear ONLY in payment mode — Stripe rejects payment_intent_data
// on a subscription-mode session, which would take checkout down entirely.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSessionParams, COURSE_PLANS } from "../app/lib/stripeCheckout.ts";

const PIF = COURSE_PLANS.pif;
const MONTHLY = COURSE_PLANS.monthly;

const attribution = { fts: "facebook", ftm: "paid", lts: "google" };
const base = { plan: "pif" as const, email: "a@b.com", name: "A B", attribution };
const opts = { cancelPath: "/enrol" };

type Meta = Record<string, string | undefined>;

test("a PIF session carries attr_* in session and payment_intent metadata", () => {
  const p = buildSessionParams(base, PIF, opts);
  const want = { attr_fts: "facebook", attr_ftm: "paid", attr_lts: "google" };
  assert.deepEqual(p.metadata, { ...(p.metadata as Meta), ...want });
  assert.deepEqual(p.payment_intent_data, { metadata: want });
  assert.equal((p.metadata as Meta).plan, "PIF", "existing keys untouched");
  assert.equal((p.metadata as Meta).source, "api-checkout-session");
});

test("a monthly session carries attr_* in session and subscription metadata, never payment_intent_data", () => {
  const p = buildSessionParams({ ...base, plan: "monthly" }, MONTHLY, opts);
  assert.equal(p.mode, "subscription");
  assert.equal(p.payment_intent_data, undefined);
  const sub = (p.subscription_data as { metadata: Meta }).metadata;
  assert.equal(sub.attr_fts, "facebook");
  assert.equal(sub.ptll_plan, "monthly_10", "existing keys untouched");
  assert.equal((p.metadata as Meta).attr_lts, "google");
});

test("no attribution means no attr_* keys and no payment_intent_data", () => {
  const { attribution: _drop, ...noAttr } = base;
  const p = buildSessionParams(noAttr, PIF, opts);
  assert.equal(p.payment_intent_data, undefined);
  assert.equal(Object.keys(p.metadata as Meta).some((k) => k.startsWith("attr_")), false);
});
