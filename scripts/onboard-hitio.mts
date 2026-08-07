/**
 * One-off onboarding for HITIO Gym Orpington (RTRM Fitness Ltd).
 *
 *   npx tsx scripts/onboard-hitio.mts            # dry run — shows the plan
 *   npx tsx scripts/onboard-hitio.mts --apply    # write it
 *
 * Idempotent on slug and on promotion code: re-running updates the partner row
 * in place and skips any Stripe code that already exists. Safe to run twice.
 *
 * Deliberately NOT generalised into a reusable onboard-partner tool. HITIO is
 * the first franchisee rather than an independent gym, and whether the deal
 * extends to sister sites is unconfirmed — building for a scale nobody has
 * confirmed is how you get tooling that fits no real case. Generalise when the
 * second site actually lands.
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");

const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SK = process.env.STRIPE_SECRET_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const SLUG = "hitio-orpington";

// commission_terms is deliberately absent: the column defaults to
// instalment_2, which is the v3.0 deal HITIO signed on 2026-08-06. Passing it
// explicitly invites a later copy-paste of on_enrolment, which is the
// grandfathered v1.0 deal belonging to the original eight partners.
const PARTNER = {
  slug: SLUG,
  gym_name: "HITIO Gym Orpington",
  status: "active",
  landing_page_path: "/hitio-orpington-academy",
  promo_code: "HITIOPT",
  contact_name: "Manisha Nagpal",
  contact_email: "manisha.nagpal@hitiogym.com",
  // Generous on purpose. The enrolment sheet's "Heard About/gym" column is
  // hand-typed and is the only source of gym attribution for anything
  // predating the gym_slug metadata. A learner writing "HITIO Gym" must still
  // join to this partner.
  legacy_referral_names: [
    "HITIO Gym Orpington",
    "HITIO Gym",
    "HITIO Orpington",
    "HITIO",
    "RTRM Fitness",
    "RTRM Fitness Ltd",
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
  console.log(`commission_terms: ${partner.commission_terms}`);

  if (partner.commission_terms !== "instalment_2") {
    console.error(
      `\n  WRONG TERMS: expected instalment_2 (the v3.0 deal signed 2026-08-06), got "${partner.commission_terms}".` +
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
// a number on a poster: if HITIO500 circulates, every single use takes £500
// off with nothing stopping it. HITIOPT is the standing, open-ended member
// discount rather than a launch slot, so it gets no cap — max_redemptions is
// omitted from its create call entirely rather than sent as empty/zero.
//
// Worth knowing while running this: across the eight existing partners the
// £200 standing codes have ZERO redemptions between them, while the £500/£300
// launch codes account for every partner sale made to date. The launch promo
// is the one that actually converts.
const CODES: { code: string; coupon: string; note: string; maxRedemptions?: number }[] = [
  { code: "HITIOPT",  coupon: "buPzSnaF", note: "standing member discount (£200)" },
  { code: "HITIO500", coupon: "vgLNHktz", note: "launch promo, first 3 places (£500)", maxRedemptions: 3 },
  { code: "HITIO300", coupon: "CDD4796b", note: "launch promo, next 2 places (£300)", maxRedemptions: 2 },
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
  // max_redemptions is only sent for codes that have a cap. HITIOPT must NOT
  // receive an empty or zero value — omitting the key entirely is what tells
  // Stripe "no limit", matching the standing/open-ended intent.
  const body: Record<string, string> = { coupon: c.coupon, code: c.code };
  if (c.maxRedemptions) body.max_redemptions = String(c.maxRedemptions);
  const made = await stripe("promotion_codes", body);
  console.log(`  ${c.code.padEnd(10)} created — ${c.note} [${capLabel}] (${made.id})`);
}
