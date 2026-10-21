import { test } from "node:test";
import assert from "node:assert/strict";
import { wasPriceActive, WAS_PRICE_ENDS_MS, PRICE_DROP_NOTE } from "../app/lib/priceDrop.ts";

test("the was-price shows until 9 November 2026 and never after", () => {
  assert.equal(wasPriceActive(Date.UTC(2026, 9, 11)), true);
  assert.equal(wasPriceActive(WAS_PRICE_ENDS_MS - 1), true);
  assert.equal(wasPriceActive(WAS_PRICE_ENDS_MS), false);
  assert.equal(wasPriceActive(Date.UTC(2027, 0, 1)), false);
  assert.equal(wasPriceActive(NaN), false);
});

test("no 'limited time' wording", () => {
  assert.doesNotMatch(PRICE_DROP_NOTE, /limited|hurry|ends|only/i);
});

test("the was-price says 'Was' in its text, not only in styling", async () => {
  // A crawler stripping tags saw "£999.99 everything included £1,599" and an AI
  // assistant told a buyer the pricing was inconsistent (21 Oct 2026).
  const { readFileSync } = await import("node:fs");
  const w = readFileSync(new URL("../app/components/WasPrice.tsx", import.meta.url), "utf8");
  assert.match(w, />Was <\/span>\s*<del>\{WAS_PRICE_LABEL\}<\/del>/);
  assert.doesNotMatch(w, /aria-label=\{`was/);
});
