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
 * Every promotion code this script creates carries an `expires_at` and a
 * `max_redemptions` of 3. "The price goes back on Monday" is a promise the
 * copy makes, not something Stripe enforces on its own -- SUMMER500PTLL is
 * the standing counter-example: still ACTIVE, still uncapped, "archive it
 * later" having never happened. The expiry comes from the month's own
 * `expiresAt` (scripts/lib/promo-calendar.mjs), never a literal in this
 * file, so January cannot inherit November's date; a money month with no
 * `expiresAt` is refused before any network call. The redemption cap matches
 * the HITIO launch precedent (3 per gym).
 *
 * Uses raw fetch against the Stripe REST API, matching scripts/onboard-hitio.mts
 * -- `stripe` is not a dependency of this repo and is not being added for a
 * one-off minting script.
 *
 * Coupon creation is idempotent too, not just the promotion codes: before
 * creating, the script pages through every coupon in the account (GET
 * /v1/coupons has no name filter, so this cannot be a single-page lookup --
 * the account already holds a dozen-plus coupons) looking for one that
 * already matches this month's name, amount_off and currency and is still
 * `valid`. Exactly one match is reused; zero means create; more than one is
 * refused rather than guessed at, because guessing which coupon nine
 * partners' codes should point to is exactly the kind of silent mistake this
 * script exists to prevent. `--coupon=<id>` lets the operator pin a specific
 * coupon (skipping the search), but it is still validated against the
 * month's amount/currency before use -- pinning the wrong id would be a live
 * pricing error across nine partners, not a cosmetic one. Without this, a
 * second `--apply` run (realistic: the operator recovering from a partial
 * batch, or just unsure whether the first run went through) would mint a
 * second £600 coupon every time, silently splitting gyms across coupon A and
 * coupon B -- no financial harm since both discount the same amount, but it
 * breaks the "one coupon per month" design and clean recovery.
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
const couponArg = process.argv.find((a) => a.startsWith("--coupon="))?.split("=")[1];

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
// Owner's ruling after SUMMER500PTLL: every money-month code gets BOTH an
// expiry and a per-gym redemption cap, full stop. "Archive it later" is what
// left SUMMER500PTLL live, uncapped, and undercutting every reveal month --
// so a money month with no expiresAt in its MONTHS entry is refused outright
// rather than minted with Stripe's defaults (no expiry, no cap). Derived from
// the month's own data rather than a literal here, so January cannot inherit
// November's date by copy-paste.
if (!month.expiresAt) {
  console.error(
    `"${month.key}" (${month.label}) has no expiresAt in its MONTHS entry (scripts/lib/promo-calendar.mjs) -- ` +
      `refusing to mint nine uncapped, unexpiring codes. Add expiresAt (an ISO 8601 UTC string) to this month.`,
  );
  process.exit(1);
}
// Re-bound so its type drops `undefined` for good -- TS does not carry the
// narrowing above into the nested main() below, even for a const.
const MONTH = month;

// Unix seconds -- what Stripe's API wants -- derived from the month's own
// ISO string rather than hardcoded, so this travels with MONTH automatically.
const EXPIRES_AT_UNIX = Math.floor(new Date(MONTH.expiresAt).getTime() / 1000);
if (!Number.isFinite(EXPIRES_AT_UNIX)) {
  console.error(`"${MONTH.key}": expiresAt "${MONTH.expiresAt}" does not parse as a date.`);
  process.exit(1);
}
// Matches the HITIO launch precedent: 3 redemptions per gym, not per code
// pool -- each gym's promotion code is its own object, so this caps each
// gym's own code independently, not the coupon as a whole.
const MAX_REDEMPTIONS_PER_GYM = 3;

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

// Everything past this point talks to the network. On Windows, calling
// process.exit() while a fetch()'s keep-alive socket is still open crashes
// the process with a libuv assertion instead of exiting cleanly -- so every
// exit path below this line sets process.exitCode and returns out of main()
// instead, letting Node drain the event loop and exit on its own. (The two
// early refusals above, before any network call, are fine as bare
// process.exit(1) -- there is nothing yet to drain.)
async function main() {
console.log(
  `${APPLY ? "APPLYING" : "DRY RUN"} -- ${MONTH.label} (${MONTH.key}), £${MONTH.discountPence! / 100} off, ` +
    `expires ${MONTH.expiresAt} (${EXPIRES_AT_UNIX}), max ${MAX_REDEMPTIONS_PER_GYM} redemptions per gym\n`,
);

const CURRENCY = "gbp";
const couponName = `${MONTH.label} £${MONTH.discountPence! / 100} off`;

// A coupon that matches this month's intent: same name, same amount, same
// currency, and still redeemable. `valid` is Stripe's own flag for "not
// deleted and (if it ever had a redeem_by/max_redemptions) not expired" --
// an invalid coupon must never be silently reused.
const matchesMonth = (c: { name: string | null; amount_off: number | null; currency: string | null; valid: boolean }) =>
  c.valid && c.name === couponName && c.amount_off === MONTH.discountPence && c.currency === CURRENCY;

let couponId: string;

if (couponArg) {
  // Operator pinned a specific coupon -- skip the search entirely, but still
  // validate it before nine promotion codes get pointed at it. A mismatch
  // here would be a live pricing error across nine partners, so it refuses
  // loudly rather than proceeding.
  let coupon;
  try {
    coupon = await stripe(`coupons/${encodeURIComponent(couponArg)}`);
  } catch (e) {
    console.error(`--coupon=${couponArg}: ${(e as Error).message}`);
    process.exitCode = 1;
    return;
  }
  if (!coupon.valid || coupon.amount_off !== MONTH.discountPence || coupon.currency !== CURRENCY) {
    console.error(
      `--coupon=${couponArg} does not match ${MONTH.key}: ` +
        `valid=${coupon.valid} amount_off=${coupon.amount_off} currency=${coupon.currency} ` +
        `(expected valid=true amount_off=${MONTH.discountPence} currency=${CURRENCY}). Refusing to mint ` +
        `nine codes against the wrong discount.`,
    );
    process.exitCode = 1;
    return;
  }
  couponId = coupon.id;
  console.log(`coupon ${coupon.id} -- using --coupon (name="${coupon.name}", £${coupon.amount_off / 100} off, valid)`);
} else {
  // No pin given: page through every coupon in the account looking for one
  // that already matches. GET /v1/coupons has no name filter, so this cannot
  // be a single list() call -- has_more must be honoured.
  const matches: { id: string; name: string | null }[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const page = await stripe(`coupons?limit=100${startingAfter ? `&starting_after=${startingAfter}` : ""}`);
    for (const c of page.data as { id: string; name: string | null; amount_off: number | null; currency: string | null; valid: boolean }[]) {
      if (matchesMonth(c)) matches.push({ id: c.id, name: c.name });
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  if (matches.length > 1) {
    console.error(`${matches.length} existing coupons match "${couponName}" (£${MONTH.discountPence! / 100} off, ${CURRENCY}, valid):`);
    for (const m of matches) console.error(`  ${m.id}  ${m.name}`);
    console.error("Refusing to guess. Re-run with --coupon=<id> to pick one.");
    process.exitCode = 1;
    return;
  }

  if (matches.length === 1) {
    couponId = matches[0].id;
    console.log(`coupon ${couponId} -- REUSING existing match ("${matches[0].name}")`);
  } else if (APPLY) {
    const coupon = await stripe("coupons", {
      amount_off: String(MONTH.discountPence),
      currency: CURRENCY,
      duration: "once",
      name: couponName,
    });
    couponId = coupon.id;
    console.log(`coupon ${coupon.id} -- created "${couponName}"`);
  } else {
    couponId = "";
    console.log(`coupon  WOULD CREATE -- "${couponName}" (amount_off=${MONTH.discountPence}, currency=${CURRENCY}, duration=once)`);
  }
}

console.log("\nPromotion codes:");
for (const slug of Object.keys(MONTH_CODE_PREFIX)) {
  const code = monthCodeFor(slug, MONTH.key)!;

  // Read-only existence check -- safe in both dry run and apply. Filtered to
  // ACTIVE codes only: Stripe allows an archived code and a fresh code to
  // share the same string, so an inactive match must not block creation.
  const found = await stripe(`promotion_codes?code=${encodeURIComponent(code)}&active=true&limit=1`);
  if (found.data?.length) {
    console.log(`  ${slug.padEnd(16)} ${code.padEnd(20)} already active (${found.data[0].id}) -- skipped`);
    continue;
  }

  if (!APPLY) {
    console.log(
      `  ${slug.padEnd(16)} ${code.padEnd(20)} WOULD CREATE (£${MONTH.discountPence! / 100} off, ` +
        `expires ${MONTH.expiresAt}, max ${MAX_REDEMPTIONS_PER_GYM} redemptions)`,
    );
    continue;
  }

  const pc = await stripe("promotion_codes", {
    coupon: couponId!,
    code,
    expires_at: String(EXPIRES_AT_UNIX),
    max_redemptions: String(MAX_REDEMPTIONS_PER_GYM),
  });
  console.log(
    `  ${slug.padEnd(16)} ${code.padEnd(20)} created ${pc.id} (expires ${MONTH.expiresAt}, max ${MAX_REDEMPTIONS_PER_GYM})`,
  );
}

if (!APPLY) console.log("\nDRY RUN -- nothing was created. Re-run with --apply.");
}

await main();
