/**
 * One-off onboarding for ATP Fitness Felixstowe (owner George McCallum).
 *
 *   npx tsx scripts/onboard-atp-felixstowe.mts            # dry run — shows the plan
 *   npx tsx scripts/onboard-atp-felixstowe.mts --apply    # write it
 *
 * Idempotent on slug and on promotion code: re-running updates the partner row
 * in place and skips any Stripe code that already exists. Safe to run twice.
 *
 * A copy of onboard-hitio.mts with the partner swapped, not a generalised
 * tool: two one-offs is still cheaper to read than an abstraction over them.
 */

import { readFileSync } from "node:fs";

// ─── RETIRED (October 2026 change-over) ──────────────────────────────────────
// No promo codes, discounts or dated offers for anyone: the course is £999.99
// in full or 10 × £99.99 a month (app/lib/pricing.ts), and partner attribution
// is gym_slug in checkout metadata, not a code. This script would create Stripe
// promotion codes against retired prices, so it refuses to run. Kept for history.
// `as boolean` stops TypeScript treating everything below as unreachable.
const RETIRED = true as boolean;
if (RETIRED) {
  console.error("onboard-atp-felixstowe is retired: promo codes no longer exist (October 2026 price change-over). Refusing to run.");
  process.exit(1);
}

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");

const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SK = process.env.STRIPE_SECRET_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const SLUG = "atp-felixstowe";

// commission_terms and fee_per_learner_pence are deliberately absent: the
// columns default to instalment_2 and 50000 (£500 inc. VAT), the v3.0 deal.
// on_enrolment is the grandfathered v1.0 deal belonging to the original eight.
// Contact details are the ones ATP publish on their own site.
const PARTNER = {
  slug: SLUG,
  gym_name: "ATP Fitness Felixstowe",
  status: "active",
  landing_page_path: "/atp-felixstowe-academy",
  promo_code: "ATPPT",
  logo_url: "/gym-logos/atp-felixstowe.png",
  primary_color: "#FFC03A",
  contact_name: "George McCallum",
  contact_email: "george@atpfitnessfelixstowe.com",
  contact_mobile: "07944573635",
  contact_instagram: "atpfitnessfelixstowe",
  // Generous on purpose: the enrolment sheet's "Heard About/gym" column is
  // hand-typed. ATP traded as "ATP Fitness Bootcamps" before the gym opened in
  // July 2024, and their Facebook and TikTok still carry that name.
  legacy_referral_names: [
    "ATP Fitness Felixstowe",
    "ATP Fitness",
    "ATP Felixstowe",
    "ATP",
    "ATP Fitness Bootcamps",
    "ATP Bootcamps",
  ],
  is_demo: false,
};

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const [existing] = await api(`pp_partners?slug=eq.${SLUG}&select=id,gym_name,commission_terms`);

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${PARTNER.gym_name} (/${SLUG})\n`);
console.log(existing ? `  partner row EXISTS (${existing.id}) — will update in place` : "  partner row will be CREATED");
console.log(`  landing page   ${PARTNER.landing_page_path}`);
console.log(`  promo code     ${PARTNER.promo_code}`);
console.log(`  contact        ${PARTNER.contact_name} <${PARTNER.contact_email}>`);
console.log(`  referral names ${PARTNER.legacy_referral_names.length}`);

if (!APPLY) {
  console.log("\nNothing written. Add --apply.");
  process.exitCode = 0;
} else {
  const [partner] = existing
    ? await api(`pp_partners?slug=eq.${SLUG}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(PARTNER),
      })
    : await api("pp_partners", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(PARTNER),
      });

  console.log(`\npartner ${existing ? "updated" : "created"}: ${partner.id}`);
  console.log(`commission_terms: ${partner.commission_terms}  fee: ${partner.fee_per_learner_pence}`);

  if (partner.commission_terms !== "instalment_2" || partner.fee_per_learner_pence !== 50000) {
    console.error(
      `\n  WRONG TERMS: expected instalment_2 / 50000 (the v3.0 deal), got "${partner.commission_terms}" / ${partner.fee_per_learner_pence}.` +
        `\n  on_enrolment is the grandfathered v1.0 deal and belongs only to the original eight partners.`,
    );
    process.exitCode = 1;
  }
}

// ─── Stripe promotion codes ──────────────────────────────────────────────────
// Three codes, matching the pattern every other partner has: a standing member
// discount plus the two launch waves described in
// partner-playbook/campaign-launch-promo.md.
//
// The launch promo is limited PLACES, not a deadline: 3 slots at £500 off,
// then 2 slots at £300 off (5 discounted places total). Verified against live
// Stripe that both coupons (vgLNHktz, CDD4796b) have max_redemptions=none and
// redeem_by=none — the coupon itself enforces nothing. So the slot count has
// to be enforced on the promotion code via `max_redemptions` below, which
// Stripe supports independently of the coupon. Skip it and "3 slots" is just
// a number on a poster: if ATP500 circulates, every single use takes £500
// off with nothing stopping it. ATPPT is the standing, open-ended member
// discount rather than a launch slot, so it gets no cap — max_redemptions is
// omitted from its create call entirely rather than sent as empty/zero.
//
// Worth knowing while running this: across the eight existing partners the
// £200 standing codes have ZERO redemptions between them, while the £500/£300
// launch codes account for every partner sale made to date. The launch promo
// is the one that actually converts.
const CODES: { code: string; coupon: string; note: string; maxRedemptions?: number }[] = [
  { code: "ATPPT",  coupon: "buPzSnaF", note: "standing member discount (£200)" },
  { code: "ATP500", coupon: "vgLNHktz", note: "launch promo, first 3 places (£500)", maxRedemptions: 3 },
  { code: "ATP300", coupon: "CDD4796b", note: "launch promo, next 2 places (£300)", maxRedemptions: 2 },
];

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

console.log("\nStripe promotion codes:");
for (const c of CODES) {
  // Read-only existence check — safe in both dry run and apply.
  const found = await stripe(`promotion_codes?code=${encodeURIComponent(c.code)}&limit=1`);
  if (found.data?.length) {
    console.log(`  ${c.code.padEnd(10)} already exists (${found.data[0].active ? "active" : "INACTIVE"}) — skipped`);
    continue;
  }
  // The cap IS the offer — see the block comment above. Show it on every
  // line (including "would be created") so whoever approves the write can
  // see exactly what they're approving.
  const capLabel = c.maxRedemptions ? `max_redemptions=${c.maxRedemptions}` : "uncapped";
  // The create call is a Stripe write, so — same as the partner row above —
  // it is gated behind APPLY. A dry run must only ever report what it would do.
  if (!APPLY) {
    console.log(`  ${c.code.padEnd(10)} would be created — ${c.note} [${capLabel}]`);
    continue;
  }
  // max_redemptions is only sent for codes that have a cap. ATPPT must NOT
  // receive an empty or zero value — omitting the key entirely is what tells
  // Stripe "no limit", matching the standing/open-ended intent.
  const body: Record<string, string> = { coupon: c.coupon, code: c.code };
  if (c.maxRedemptions) body.max_redemptions = String(c.maxRedemptions);
  const made = await stripe("promotion_codes", body);
  console.log(`  ${c.code.padEnd(10)} created — ${c.note} [${capLabel}] (${made.id})`);
}
