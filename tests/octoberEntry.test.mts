// tests/octoberEntry.test.mts
//
// WHAT THIS PROTECTS
//
// October's offer is £99 to start, then 5 × £300 — £1,599 in total, the same
// as paying up front. It is a payment shape, NOT a discount. September's
// £99 + 5 × £200 came to £1,099, which WAS a £500 discount, and repeating
// that would leave Black Friday nothing to offer.
//
// The instalment price used to be a single module-level constant (£200) and
// the count a single constant (5, "always five"). Both are now per-link, so
// the two plans can differ without the existing one moving. The danger in
// that change is a silent default: an October buyer charged £200 instead of
// £300 pays £1,099 and nobody notices until the fifth invoice.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSessionParams,
  PAYMENT_LINK_PRICES,
  INSTALMENT_PRICE_ID,
  OCTOBER_LINK,
  instalmentPriceFor,
  instalmentCountFor,
} from "../app/lib/stripeCheckout.ts";

const base = { name: "A", email: "a@b.com" } as Parameters<typeof buildSessionParams>[0];
const opts = { withInstalments: false, target: 5, cancelPath: "/enrol" };

const DEPOSIT = PAYMENT_LINK_PRICES["https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05"];
const OCTOBER = PAYMENT_LINK_PRICES[OCTOBER_LINK];

test("the October link exists and is an instalment entry", () => {
  assert.ok(OCTOBER, "October payment link is not registered");
  assert.equal(OCTOBER.amount, 99);
  assert.equal(OCTOBER.takesInstalments, true);
});

test("October totals £1,599 — the same as paying up front, so it is not a discount", () => {
  assert.equal(OCTOBER.contractValue, 1599);
  const entry = OCTOBER.amount;
  const monthly = 300;
  assert.equal(entry + monthly * instalmentCountFor(OCTOBER), OCTOBER.contractValue);
});

test("October bills £300 a month, not the £200 default", () => {
  const p = buildSessionParams(base, OCTOBER, { ...opts, withInstalments: true });
  const prices = (p.line_items as { price: string }[]).map((l) => l.price);
  assert.equal(prices[0], OCTOBER.price, "entry price is wrong");
  assert.notEqual(
    prices[1],
    INSTALMENT_PRICE_ID,
    "October fell back to the £200 instalment — the buyer would pay £1,099, not £1,599",
  );
  assert.equal(prices[1], instalmentPriceFor(OCTOBER));
});

test("the existing £599 deposit plan is untouched", () => {
  // The whole point of making this per-link is that the live plan does not move.
  assert.equal(instalmentPriceFor(DEPOSIT), INSTALMENT_PRICE_ID);
  assert.equal(instalmentCountFor(DEPOSIT), 5);
  const p = buildSessionParams(base, DEPOSIT, { ...opts, withInstalments: true });
  const prices = (p.line_items as { price: string }[]).map((l) => l.price);
  assert.equal(prices[1], INSTALMENT_PRICE_ID);
});

test("every instalment link states its own price and count, or inherits both", () => {
  // A link that takes instalments but names neither is the silent-default
  // failure this test exists for.
  for (const [url, cfg] of Object.entries(PAYMENT_LINK_PRICES)) {
    if (!cfg.takesInstalments) continue;
    const price = instalmentPriceFor(cfg);
    const count = instalmentCountFor(cfg);
    assert.ok(price, `${url} has no instalment price`);
    assert.ok(count > 0, `${url} has no instalment count`);
    // The arithmetic has to close, whatever the plan.
    const implied = cfg.amount + count * (price === INSTALMENT_PRICE_ID ? 200 : 300);
    assert.equal(
      implied,
      cfg.contractValue,
      `${url}: entry £${cfg.amount} + ${count} instalments does not equal £${cfg.contractValue}`,
    );
  }
});

test("October carries the contract value into the subscription metadata", () => {
  // The instalment emails read contract_value to report a running total. A
  // £1,099 stamped on a £1,599 plan understates what the learner owes.
  const p = buildSessionParams(base, OCTOBER, { ...opts, withInstalments: true });
  const meta = (p.subscription_data as { metadata: Record<string, string> }).metadata;
  assert.equal(meta.contract_value, "1599");
  assert.equal(meta.entry_amount, "99");
});

test("an October buyer cannot stack a promo code on top", () => {
  // A deposit is never discounted — the plan IS the concession. £99 entry
  // plus a £500 code would be a £1,099 course sold as £1,599.
  const p = buildSessionParams(
    { ...base, promoCodeId: "promo_500" },
    OCTOBER,
    { ...opts, withInstalments: true },
  );
  assert.equal(p.discounts, undefined);
});

// ── the window ────────────────────────────────────────────────────────────

test("the October window opens on the 13th and closes at the end of the 31st", async () => {
  const { isOctoberOfferOpen, OCT99_OPENS_AT, OCT99_CLOSES_AT } = await import(
    "../app/lib/octoberOffer.ts"
  );
  const d = (iso: string) => Date.parse(iso);

  assert.equal(isOctoberOfferOpen(d("2026-10-12T23:00:00Z")), false, "open before the first email");
  assert.equal(isOctoberOfferOpen(d("2026-10-13T08:00:00Z")), true, "shut on launch day");
  assert.equal(isOctoberOfferOpen(d("2026-10-31T22:00:00Z")), true, "shut on the closing day");
  assert.equal(isOctoberOfferOpen(d("2026-11-01T00:00:01Z")), false, "still open in November");

  // An offer with no end is not an offer, it is a price change nobody decided
  // to make. SUMMER500PTLL sat live with no expiry for months.
  assert.ok(Number.isFinite(OCT99_CLOSES_AT), "the offer has no closing date");
  assert.ok(OCT99_CLOSES_AT > OCT99_OPENS_AT, "the window closes before it opens");
});

test("October is never described as a discount", async () => {
  // The total is the pay-in-full price. If the page or the module ever calls
  // it a saving, the page becomes the thing that misleads the buyer.
  const { readFileSync } = await import("node:fs");
  for (const f of ["app/lib/octoberOffer.ts", "app/enrol/EnrolmentFlow.tsx"]) {
    const src = readFileSync(f, "utf8");
    const oct = src.split(/OCT99|isOct99|October intake/).slice(1).join(" ");
    for (const word of ["discount", "saving", "% off", "less than"]) {
      assert.ok(
        !new RegExp(`\b${word}`, "i").test(oct.slice(0, 2000)),
        `${f} describes October as a ${word} — the total is unchanged`,
      );
    }
  }
});

test("a link's own instalment count reaches the subscription metadata", () => {
  // This is the test the earlier one should have been. Asserting
  // instalmentCountFor(OCTOBER) === 5 proved nothing, because the default is
  // also 5 — it passed while the call site was still ignoring the config
  // entirely. A count that differs from the default is the only way to see it.
  const seven = { ...OCTOBER, instalmentCount: 7 };
  const p = buildSessionParams(base, seven, { ...opts, withInstalments: true, target: 5 });
  const meta = (p.subscription_data as { metadata: Record<string, string> }).metadata;
  assert.equal(
    meta.instalments_target,
    "7",
    "the link's instalment count is ignored — the webhook would stop the plan at the default instead",
  );
});

test("a link with no count of its own still gets the default", () => {
  const p = buildSessionParams(base, DEPOSIT, { ...opts, withInstalments: true, target: 5 });
  const meta = (p.subscription_data as { metadata: Record<string, string> }).metadata;
  assert.equal(meta.instalments_target, "5");
});
