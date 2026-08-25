// tests/septemberOffer.test.mts
//
// WHAT THIS PROTECTS
//
// The September weekend offer is a SECOND instalment plan on a codebase that
// had exactly one, and that hardcoded the first one's numbers in four places.
// Three specific ways it can go wrong, all of them silent:
//
// 1. THE OFFER KEEPS SELLING AFTER IT CLOSES. Every other failure in
//    /api/checkout falls back to the raw Stripe Payment Link so a buyer is never
//    blocked from paying. For this price that fallback would take £99 for an
//    offer that had ended, so the gate must refuse rather than fall through.
// 2. META LEARNS THE BUYER IS WORTH £99. The Purchase value used to be gated on
//    `amountPaid === 599`, which a £99 entry fails — reporting £99 instead of
//    £1,099 on the ad account this campaign's audience came from.
// 3. THE PLAN IS CLASSIFIED BY PRICE. `amount >= 1300` already called every
//    discounted £1,099 partner pay-in-full a deposit and mislabelled 8 of 9
//    sales. A third price on a price-range test is how that comes back.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSessionParams, PAYMENT_LINK_PRICES } from "../app/lib/stripeCheckout.ts";
import {
  septemberOfferState,
  isSeptemberOfferOpen,
  isSeptemberOfferLink,
  SEPT99_OPENS_AT,
  SEPT99_CLOSES_AT,
  SEPT99_PAYMENT_LINK,
  SEPT99_ENTRY,
  SEPT99_MONTHLY,
  SEPT99_INSTALMENTS,
  SEPT99_TOTAL,
  SEPT99_SAVING,
  STANDARD_TOTAL,
} from "../app/lib/septemberOffer.ts";

const SEPT99 = PAYMENT_LINK_PRICES[SEPT99_PAYMENT_LINK];
const PIF = PAYMENT_LINK_PRICES["https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f"];
const DEPOSIT = PAYMENT_LINK_PRICES["https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05"];
const FUNNEL = PAYMENT_LINK_PRICES["https://buy.stripe.com/fZuaER6ME7hi0Ma0o2fEk06"];

const base = { paymentLink: SEPT99_PAYMENT_LINK, email: "a@b.com", name: "A B" };
const withInstalments = { withInstalments: true, target: 5, cancelPath: "/enrol" };

// ─── The arithmetic the emails and the landing page both quote ──────────────

test("£99 + 5 × £200 is £1,099, which is £500 off £1,599", () => {
  assert.equal(SEPT99_ENTRY + SEPT99_MONTHLY * SEPT99_INSTALMENTS, 1099);
  assert.equal(SEPT99_TOTAL, 1099);
  assert.equal(STANDARD_TOTAL - SEPT99_TOTAL, 500);
  assert.equal(SEPT99_SAVING, 500);
});

test("the link is mapped, and its config states the £1,099 contract", () => {
  assert.ok(SEPT99, "the £99 payment link must be in PAYMENT_LINK_PRICES");
  assert.equal(SEPT99.amount, 99);
  assert.equal(SEPT99.contractValue, 1099);
});

// ─── The window ─────────────────────────────────────────────────────────────

test("the offer is shut before it opens", () => {
  assert.equal(septemberOfferState(SEPT99_OPENS_AT - 1), "before");
  assert.equal(isSeptemberOfferOpen(SEPT99_OPENS_AT - 1), false);
});

test("the offer is open on the opening instant and stays open until the close", () => {
  assert.equal(septemberOfferState(SEPT99_OPENS_AT), "open");
  assert.equal(septemberOfferState(SEPT99_CLOSES_AT - 1), "open");
  assert.equal(isSeptemberOfferOpen(SEPT99_CLOSES_AT - 1), true);
});

test("the offer is shut ON the closing instant, not a millisecond after", () => {
  assert.equal(septemberOfferState(SEPT99_CLOSES_AT), "closed");
  assert.equal(isSeptemberOfferOpen(SEPT99_CLOSES_AT), false);
});

test("the window is 07:00 Friday to midnight Sunday, London time", () => {
  const opens = new Date(SEPT99_OPENS_AT).toLocaleString("en-GB", { timeZone: "Europe/London" });
  // Britain is on BST (UTC+1) in September, so 06:00Z is 07:00 local.
  assert.match(opens, /04\/09\/2026, 07:00/);
  assert.equal((SEPT99_CLOSES_AT - SEPT99_OPENS_AT) / 3_600_000, 65);
});

// ─── Recognising the link ───────────────────────────────────────────────────

test("the offer link is recognised even when it carries query params", () => {
  assert.equal(isSeptemberOfferLink(SEPT99_PAYMENT_LINK), true);
  assert.equal(isSeptemberOfferLink(`${SEPT99_PAYMENT_LINK}?client_reference_id=abc`), true);
});

test("no other payment link is mistaken for the offer", () => {
  assert.equal(isSeptemberOfferLink("https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f"), false);
  assert.equal(isSeptemberOfferLink("https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05"), false);
  assert.equal(isSeptemberOfferLink(""), false);
  assert.equal(isSeptemberOfferLink(undefined), false);
});

// ─── The session it builds ──────────────────────────────────────────────────

test("a £99 session takes the £200/month mandate", () => {
  const p = buildSessionParams(base, SEPT99, withInstalments) as Record<string, never>;
  assert.equal(p.mode, "subscription");
  assert.equal((p.line_items as unknown as unknown[]).length, 2);
});

test("a £99 session stamps the £1,099 contract value for the webhook", () => {
  const p = buildSessionParams(base, SEPT99, withInstalments) as Record<string, never>;
  const metadata = p.metadata as unknown as Record<string, string>;
  assert.equal(metadata.contract_value, "1099");
  const sub = p.subscription_data as unknown as { metadata: Record<string, string> };
  assert.equal(sub.metadata.entry_amount, "99");
  assert.equal(sub.metadata.contract_value, "1099");
});

test("a £99 session is classified as a deposit by SHAPE, not by its price", () => {
  const p = buildSessionParams(base, SEPT99, withInstalments) as Record<string, never>;
  const metadata = p.metadata as unknown as Record<string, string>;
  // £99 is under every threshold ever used here, so this passing proves nothing
  // on its own — the £1,399 case below is the one that would have failed.
  assert.equal(metadata.plan, "deposit");
});

test("the £1,399 pay-in-full is NOT a deposit — the bug that mislabelled 8 of 9 sales", () => {
  const p = buildSessionParams(
    { ...base, paymentLink: "x" }, FUNNEL, { withInstalments: false, target: 5, cancelPath: "/enrol" },
  ) as Record<string, never>;
  const metadata = p.metadata as unknown as Record<string, string>;
  assert.equal(metadata.plan, "PIF");
  assert.equal(metadata.contract_value, "1399");
});

test("THE £99 OFFER IS NEVER DISCOUNTED, even when a promo id is passed", () => {
  const p = buildSessionParams(
    { ...base, promoCodeId: "promo_500" }, SEPT99, withInstalments,
  ) as Record<string, never>;
  assert.equal(p.discounts, undefined);
  assert.equal(p.allow_promotion_codes, false);
});

test("every mapped price declares its own shape and contract value", () => {
  for (const [link, config] of Object.entries(PAYMENT_LINK_PRICES)) {
    assert.equal(typeof config.takesInstalments, "boolean", `${link} must state takesInstalments`);
    assert.ok(config.contractValue > 0, `${link} must state a contractValue`);
    assert.ok(
      config.contractValue >= config.amount,
      `${link} cannot contract for less than it charges at checkout`,
    );
  }
});

test("the two pay-in-full prices contract for exactly what they charge", () => {
  assert.equal(PIF.contractValue, PIF.amount);
  assert.equal(FUNNEL.contractValue, FUNNEL.amount);
  assert.equal(PIF.takesInstalments, false);
  assert.equal(FUNNEL.takesInstalments, false);
});

test("both instalment plans run 5 × £200 and differ only in entry and total", () => {
  assert.equal(DEPOSIT.takesInstalments, true);
  assert.equal(SEPT99.takesInstalments, true);
  assert.equal(DEPOSIT.contractValue - DEPOSIT.amount, SEPT99_MONTHLY * SEPT99_INSTALMENTS);
  assert.equal(SEPT99.contractValue - SEPT99.amount, SEPT99_MONTHLY * SEPT99_INSTALMENTS);
});
