// tests/blackFriday.test.mts
//
// WHAT THIS PROTECTS
//
// Black Friday is the ONE genuine price cut in the twelve-month calendar:
// £1,599 → £999, 23–30 November. Everything else that year changes the shape
// of the offer, not the price.
//
// It is a dated offer rather than a promotion code, deliberately. A code can
// be screenshotted and redeemed in December — SUMMER500PTLL sat live with no
// expiry for months. The things that can still go wrong:
//
//   1. The window never closes, and £999 becomes the price.
//   2. £999 is the lowest pay-in-full the business has sold. Plan type used
//      to be derived from the amount (`amount >= 1300` once mislabelled 8 of
//      9 gym sales), so a £999 sale recorded as a deposit would show £600
//      still to collect on a fully-paid course.
//   3. It reaches a partner page, where the gym still earns £500 commission
//      on what is now a £999 sale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planTypeForSale, DEPOSIT_CEILING_PENCE } from "../app/lib/coursePlan.ts";
import {
  BF_PRICE,
  BF_LIST_PRICE,
  BF_SAVING,
  BF_PAYMENT_LINK,
  BF_OPENS_AT,
  BF_CLOSES_AT,
  isBlackFridayOpen,
} from "../app/lib/blackFridayOffer.ts";
import { PAYMENT_LINK_PRICES, BLACK_FRIDAY_LINK } from "../app/lib/stripeCheckout.ts";

test("the price cut is £1,599 to £999 and the saving is derived", () => {
  assert.equal(BF_LIST_PRICE, 1599);
  assert.equal(BF_PRICE, 999);
  assert.equal(BF_SAVING, 600, "the saving must follow the two prices, never be typed twice");
});

test("a £999 Black Friday sale is a pay-in-full, not a deposit", () => {
  assert.equal(
    planTypeForSale({
      mode: "payment",
      amountTotalPence: BF_PRICE * 100,
      metadataPlan: undefined,
      contractValuePence: BF_PRICE * 100,
    }),
    "PIF",
    "a fully-paid £999 course would show a balance still to collect",
  );
  assert.ok(
    DEPOSIT_CEILING_PENCE < BF_PRICE * 100,
    `the deposit ceiling (£${DEPOSIT_CEILING_PENCE / 100}) has reached the Black Friday price`,
  );
});

test("the window opens on the 23rd and closes at the end of the 30th", () => {
  const d = (iso: string) => Date.parse(iso);
  assert.equal(isBlackFridayOpen(d("2026-11-22T23:00:00Z")), false, "open before the 23rd");
  assert.equal(isBlackFridayOpen(d("2026-11-23T09:00:00Z")), true, "shut on opening day");
  assert.equal(isBlackFridayOpen(d("2026-11-27T12:00:00Z")), true, "shut on Black Friday itself");
  assert.equal(isBlackFridayOpen(d("2026-11-30T22:00:00Z")), true, "shut on Cyber Monday");
  assert.equal(isBlackFridayOpen(d("2026-12-01T00:00:01Z")), false, "STILL OPEN IN DECEMBER");
  assert.ok(BF_CLOSES_AT > BF_OPENS_AT, "the window closes before it opens");
});

test("the registered link charges £999 and takes no instalments", () => {
  const cfg = PAYMENT_LINK_PRICES[BLACK_FRIDAY_LINK];
  assert.ok(cfg, "the Black Friday link is not registered");
  assert.equal(cfg.amount, BF_PRICE);
  assert.equal(cfg.contractValue, BF_PRICE, "contract value must equal what is charged — nothing follows it");
  assert.equal(cfg.takesInstalments, false);
  assert.equal(BF_PAYMENT_LINK, BLACK_FRIDAY_LINK, "the two copies of the link have drifted");
});

test("no promotion code can be stacked on the price cut", () => {
  // £999 with a partner's £500 code on top is £499 against a £500 payout.
  assert.equal(PAYMENT_LINK_PRICES[BLACK_FRIDAY_LINK].allowPromotionCodes, false);
});

test("the offer never reaches a partner page", () => {
  // The gym still earns £500 on a Black Friday sale, so a £999 partner sale
  // would leave £499 of course revenue against a £500 commission.
  const flow = readFileSync("app/enrol/EnrolmentFlow.tsx", "utf8");
  assert.match(
    flow,
    /const isBF = offer === "bf2026" && !partner/,
    "the Black Friday card is not gated on there being no partner",
  );
});

test("the page honours the offer only inside the window", () => {
  const page = readFileSync("app/enrol/page.tsx", "utf8");
  assert.match(
    page,
    /offer === "bf2026" && isBlackFridayOpen\(\)/,
    "the query parameter is accepted without checking the window",
  );
});
