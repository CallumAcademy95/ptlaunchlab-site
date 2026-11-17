/**
 * Onboarding for The Fitness Accountant (Jay Johnston, Belfast): an accountant,
 * not a gym (Nov 2026). The same package model as PT Mentor Hub: the NCFE
 * Level 2 & 3 course sold with his Business Launch Package on his own page
 * (/fitness-accountant-academy), PAY IN FULL ONLY (£999.99; see
 * PAY_IN_FULL_ONLY_PARTNERS in app/lib/pricing.ts).
 *
 * NOT RUN YET (17 Nov 2026). Until this row exists, a sale through his page
 * carries gym_slug "the-fitness-accountant" in Stripe but reaches no partner.
 *
 *   npx tsx scripts/onboard-fitness-accountant.mts            # dry run, shows the plan
 *   npx tsx scripts/onboard-fitness-accountant.mts --apply    # write it
 *
 * Terms: a 50-50 split, £500 per learner flat, the same as PT Mentor Hub (see
 * scripts/onboard-pt-mentor-hub.mts for why payment_5 and not ladder).
 * payout_terms_days 14 assumes the same release as PT Mentor Hub (when the
 * cooling-off ends); confirm it in his agreement.
 *
 * Idempotent on slug: a re-run updates the row in place. Never touches bank
 * details; he adds them in the portal.
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");

const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const SLUG = "the-fitness-accountant"; // = the enrol page's gymSlug; never change
const FEE_PENCE = 50_000; // £500 per learner, half of £999.99 (rounded to the pound)
const TERMS = "payment_5";
// Released when the 14-day cooling-off ends, as for PT Mentor Hub.
const PAYOUT_TERMS_DAYS = 14;

// ── Fill these in when the agreement is signed ──────────────────────────────
const AGREEMENT_SIGNED_AT: string | null = null;
const AGREEMENT_VERSION: string | null = null;
const CONTACT_NAME: string | null = null;
const CONTACT_EMAIL: string | null = null;
// ─────────────────────────────────────────────────────────────────────────────

const PARTNER: Record<string, unknown> = {
  slug: SLUG,
  gym_name: "The Fitness Accountant",
  status: "active",
  landing_page_path: "/fitness-accountant-academy",
  logo_url: null,
  primary_color: "#1E6EF0",
  fee_per_learner_pence: FEE_PENCE,
  commission_terms: TERMS,
  payout_terms_days: PAYOUT_TERMS_DAYS,
  contact_name: CONTACT_NAME,
  contact_email: CONTACT_EMAIL,
  agreement_version: AGREEMENT_VERSION,
  agreement_signed_at: AGREEMENT_SIGNED_AT,
  legacy_referral_names: ["The Fitness Accountant", "Fitness Accountant", "TFA", "thefitnessaccountantmacc", "Jay Johnston"],
  is_demo: false,
};

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const [existing] = await api(`pp_partners?slug=eq.${SLUG}&select=id,gym_name,commission_terms,fee_per_learner_pence,payout_terms_days`);

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${PARTNER.gym_name} (/${SLUG})\n`);
console.log(existing ? `  partner row EXISTS (${existing.id}) — will update in place (payout_terms_days now ${existing.payout_terms_days})` : "  partner row will be CREATED");
console.log(`  landing page   ${PARTNER.landing_page_path}`);
console.log(`  terms          ${TERMS}, £${FEE_PENCE / 100} per learner, released ${PAYOUT_TERMS_DAYS} days after enrolment`);
console.log(`  agreement      ${AGREEMENT_SIGNED_AT ? `v${AGREEMENT_VERSION}, signed ${AGREEMENT_SIGNED_AT}` : "not signed yet (draft partner)"}`);
console.log(`  contact        ${CONTACT_NAME ?? "—"} <${CONTACT_EMAIL ?? "—"}>`);

if (!APPLY) {
  console.log("\nNothing written. Add --apply.");
} else {
  const [partner] = existing
    ? await api(`pp_partners?slug=eq.${SLUG}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(PARTNER) })
    : await api("pp_partners", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(PARTNER) });

  console.log(`\npartner ${existing ? "updated" : "created"}: ${partner.id}`);
  console.log(`commission_terms: ${partner.commission_terms}  fee: ${partner.fee_per_learner_pence}  status: ${partner.status}`);
  if (partner.commission_terms !== TERMS || partner.fee_per_learner_pence !== FEE_PENCE || partner.payout_terms_days !== PAYOUT_TERMS_DAYS) {
    console.error("\n  WRONG TERMS written back; investigate before any sale.");
    process.exitCode = 1;
  }
}
