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

test("no '£500' value or 'free' claim on the Mentorship Hub, and no '80%' quit statistic", async () => {
  // The Hub has never been sold on its own, so a £500 value is not a genuine price, and calling
  // a component of a paid bundle "free" is misleading (CAP Code). The 80% figure had no source.
  const { execSync } = await import("node:child_process");
  const grep = (re: string) => { try { return execSync(`git grep -nE "${re}" -- app public ":!app/podcast/transcripts"`, { encoding: "utf8" }); } catch { return ""; } };
  assert.equal(grep("£500 ([Bb]usiness )?[Mm]entorship|£500 PT Launch Lab Mentorship|£500 product"), "");
  assert.equal(grep("(bundled|included) free|Included Free|free with your course"), "");
  assert.equal(grep("80 ?% of (newly|new|UK|PTs|qualified)"), "");
});
