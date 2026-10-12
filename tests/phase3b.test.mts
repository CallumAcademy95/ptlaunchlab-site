import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const BANNED = [/klarna/i, /interest-free/i, /interest free/i, /pay in 3/i, /daily coffee/i];

test("MoneyHero: pay-in-full price row, two buttons, video or image", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  assert.match(h, /COURSE_PRICE_LABEL/);
  assert.match(h, /everything included/);
  assert.match(h, /Flexible ways to pay at checkout/);
  assert.doesNotMatch(h, /MONTHLY_PRICE_LABEL|MONTHLY_PAYMENTS|\/month/, "pay in full is the hero offer");
  assert.match(h, /<WasPrice[^>]*reserve=/);
  assert.match(h, /<TwoWayCTA[^>]*source=\{source\}/);
  assert.match(h, /<ClickToPlay/);
  assert.match(h, /priority/);
  assert.match(h, /★ 5\.0 Google · 500\+ PTs hired · Study around your job/);
  assert.equal((h.match(/<h1[\s>]/g) ?? []).length, 1, "one H1");
  assert.doesNotMatch(h, /^["']use client["']/m, "server component: image and price row are in the static HTML");
});

test("MoneyHero: props are the spec's, verbatim", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  for (const p of [
    /eyebrow: string;/,
    /headline: string;/,
    /goldTail: string;/,
    /subline: string;/,
    /source: string;/,
    /video\?: \{ kind: "mp4" \| "youtube"; src: string; poster: string; trackAs: string; metaEvent\?: string \};/,
    /image\?: \{ src: string; alt: string \};/,
  ]) assert.match(h, p, String(p));
});

test("MoneyHero: render order is eyebrow, H1, subline, price, buttons, trust line", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  const order = ["{eyebrow}", "<h1", "{subline}", "{COURSE_PRICE_LABEL}", "<TwoWayCTA", "★ 5.0 Google"];
  let at = -1;
  for (const s of order) { const i = h.indexOf(s); assert.ok(i > at, `${s} out of order or missing`); at = i; }
});

test("FunnelPricingBlock: one featured pay-in-full card plus the monthly link", () => {
  const f = src("app/components/FunnelPricingBlock.tsx");
  assert.equal((f.match(/data-featured/g) ?? []).length, 1, "exactly one featured card");
  assert.doesNotMatch(f, /Pay monthly/, "no second card");
  assert.match(f, /Pay in full/);
  assert.match(f, /Everything included/);
  assert.match(f, /Flexible ways to pay at checkout/);
  assert.match(f, />\s*Enrol now\s*</);
  assert.match(f, /Prefer \{MONTHLY_PAYMENTS\} monthly payments of \{MONTHLY_PRICE_LABEL\}\? See payment options →/);
  assert.ok(f.indexOf("data-featured") < f.indexOf("Prefer {MONTHLY_PAYMENTS}"), "the card comes before the monthly link");
});

test("FunnelPricingBlock: value stack, RRPs, You pay and risk reversal stay", () => {
  const f = src("app/components/FunnelPricingBlock.tsx");
  assert.match(f, /You pay/);
  assert.match(f, /const VALUE_STACK/);
  for (const rrp of ['"£499"', '"£1,099"', '"£500"', '"Priceless"', '"£199"']) assert.ok(f.includes(rrp), rrp);
  for (const g of ["Tutor in 24 hours", "7-day cancellation", "Free resubmissions", "Pass support guarantee"]) assert.ok(f.includes(g), g);
  assert.match(f, /showValueStack/);
  assert.match(f, /variant/);
});

test("FunnelPricingBlock: old events still fire, cta_click added", () => {
  const f = src("app/components/FunnelPricingBlock.tsx");
  assert.match(f, /promo_checkout_clicked/);
  assert.match(f, /plan, has_promo: false/);
  assert.match(f, /ctaClickEvents\(/);
  assert.match(f, /\("pif"\)/);
  assert.match(f, /\("monthly"\)/);
  assert.match(f, /href=\{ENROL_HREF\}/);
});

test("Phase 3b components carry no credit wording", () => {
  for (const p of ["app/components/money/MoneyHero.tsx", "app/components/FunnelPricingBlock.tsx"]) {
    const s = src(p);
    for (const b of BANNED) assert.doesNotMatch(s, b, `${p}: ${b}`);
  }
});

test("prices come from pricing.ts, not literals", () => {
  for (const p of ["app/components/money/MoneyHero.tsx", "app/components/FunnelPricingBlock.tsx"]) {
    assert.doesNotMatch(src(p), /999\.9|99\.99/, p);
  }
});
