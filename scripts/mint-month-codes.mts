/**
 * Mint one promotion code per gym for a money month.
 *
 *   npx tsx scripts/mint-month-codes.mts --month=nov            # dry run
 *   npx tsx scripts/mint-month-codes.mts --month=nov --apply    # create
 *
 * Idempotent: a code that already exists and is ACTIVE is left alone and
 * reported, never duplicated. Stripe happily holds two promotion codes with
 * the same `code` string if one is archived, so existence is checked with
 * `active=true` on the list call rather than on the bare code.
 *
 * One coupon per month (amount_off is a property of the coupon, not the
 * promotion code), then one promotion code per gym pointing at it. That is
 * what lets nine gyms share an amount while each carrying its own redeemable
 * string -- which is how an enrolment gets attributed to a gym at all.
 *
 * Uses raw fetch against the Stripe REST API, matching scripts/onboard-hitio.mts
 * -- `stripe` is not a dependency of this repo and is not being added for a
 * one-off minting script.
 *
 * Codes are derived via monthCodeFor()/MONTH_CODE_PREFIX from
 * scripts/lib/promo-calendar.mjs rather than re-derived here. Two gyms
 * (ironwolf, muscle-bound) deliberately mint under their launch-code prefix
 * rather than their standing-code prefix -- see the comment on
 * MONTH_CODE_PREFIX. A code minted under the wrong prefix is refused by the
 * live validator, which is exactly what left HITIO's launch codes dead for
 * weeks.
 */

import { readFileSync } from "node:fs";
import { MONTHS, MONTH_CODE_PREFIX, monthCodeFor } from "./lib/promo-calendar.mjs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const SK = process.env.STRIPE_SECRET_KEY!;
const APPLY = process.argv.includes("--apply");
const monthKey = process.argv.find((a) => a.startsWith("--month="))?.split("=")[1];

const month = MONTHS.find((m) => m.key === monthKey);
if (!month) {
  console.error(`no such month: "${monthKey}". Known months: ${MONTHS.map((m) => m.key).join(", ")}`);
  process.exit(1);
}
if (month.offerType !== "money") {
  console.error(
    `"${month.key}" (${month.label}) is a "${month.offerType}" month, not a "money" month -- it needs no ` +
      `Stripe codes. Refusing rather than silently doing nothing.`,
  );
  process.exit(1);
}

const stripe = async (path: string, body?: Record<string, string>) => {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${SK}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body ? { body: new URLSearchParams(body).toString() } : {}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`stripe ${path}: ${j.error?.message}`);
  return j;
};

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} -- ${month.label} (${month.key}), £${month.discountPence! / 100} off\n`);

const couponName = `${month.label} £${month.discountPence! / 100} off`;

let couponId: string | null = null;
if (APPLY) {
  const coupon = await stripe("coupons", {
    amount_off: String(month.discountPence),
    currency: "gbp",
    duration: "once",
    name: couponName,
  });
  couponId = coupon.id;
  console.log(`coupon ${coupon.id} -- ${couponName}`);
} else {
  console.log(`coupon  WOULD CREATE -- "${couponName}" (amount_off=${month.discountPence}, currency=gbp, duration=once)`);
}

console.log("\nPromotion codes:");
for (const slug of Object.keys(MONTH_CODE_PREFIX)) {
  const code = monthCodeFor(slug, month.key)!;

  // Read-only existence check -- safe in both dry run and apply. Filtered to
  // ACTIVE codes only: Stripe allows an archived code and a fresh code to
  // share the same string, so an inactive match must not block creation.
  const found = await stripe(`promotion_codes?code=${encodeURIComponent(code)}&active=true&limit=1`);
  if (found.data?.length) {
    console.log(`  ${slug.padEnd(16)} ${code.padEnd(20)} already active (${found.data[0].id}) -- skipped`);
    continue;
  }

  if (!APPLY) {
    console.log(`  ${slug.padEnd(16)} ${code.padEnd(20)} WOULD CREATE (£${month.discountPence! / 100} off)`);
    continue;
  }

  const pc = await stripe("promotion_codes", { coupon: couponId!, code });
  console.log(`  ${slug.padEnd(16)} ${code.padEnd(20)} created ${pc.id}`);
}

if (!APPLY) console.log("\nDRY RUN -- nothing was created. Re-run with --apply.");
