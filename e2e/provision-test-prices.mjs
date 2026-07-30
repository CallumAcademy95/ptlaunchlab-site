// Creates (or finds) the Stripe TEST-MODE prices the enrolment regression test
// needs, and writes their ids to e2e/.test-prices.json.
//
// Why this is necessary: the price ids in app/lib/stripeCheckout.ts are live-mode
// ids that simply do not exist in test mode. Without test-mode substitutes, a
// rehearsal could only ever exercise a hand-written copy of the checkout code
// rather than the code that actually ships — which is the exact class of gap
// that let the broken redirect reach production in the first place.
//
// Idempotent: prices are looked up by `lookup_key`, so re-running reuses them.
// Safe: test mode only. The key is rejected below unless it is rk_test_/sk_test_.

import { writeFileSync } from "node:fs";
import { PRICES_FILE, testSecretKey } from "./test-env.mjs";

const KEY = testSecretKey();

async function stripe(path, method = "GET", body) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    ...(body !== undefined ? { body } : {}),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe ${method} ${path} failed (${res.status}): ${json.error?.message}`);
  }
  return json;
}

const WANTED = [
  { key: "pif",       lookup: "ptll_regression_pif",        name: "[E2E TEST] PIF £1,599",            amount: 159900, recurring: false },
  { key: "deposit",   lookup: "ptll_regression_deposit",    name: "[E2E TEST] Deposit £599",          amount:  59900, recurring: false },
  { key: "funnelPif", lookup: "ptll_regression_funnel_pif", name: "[E2E TEST] Funnel PIF £1,399",     amount: 139900, recurring: false },
  { key: "instalment", lookup: "ptll_regression_instalment", name: "[E2E TEST] Instalment £200/mo",   amount:  20000, recurring: true  },
];

const query = WANTED.map((w) => `lookup_keys[]=${encodeURIComponent(w.lookup)}`).join("&");
const found = await stripe(`prices?limit=100&${query}`);
const byLookup = Object.fromEntries((found.data || []).map((p) => [p.lookup_key, p.id]));

const out = {};
for (const w of WANTED) {
  if (byLookup[w.lookup]) {
    out[w.key] = byLookup[w.lookup];
    console.log(`  reusing ${w.lookup} → ${byLookup[w.lookup]}`);
    continue;
  }
  const product = await stripe("products", "POST", new URLSearchParams({ name: w.name }).toString());
  const params = new URLSearchParams({
    product: product.id,
    currency: "gbp",
    unit_amount: String(w.amount),
    lookup_key: w.lookup,
  });
  if (w.recurring) params.set("recurring[interval]", "month");
  const price = await stripe("prices", "POST", params.toString());
  out[w.key] = price.id;
  console.log(`  created ${w.lookup} → ${price.id}`);
}

writeFileSync(PRICES_FILE, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${PRICES_FILE}`);
