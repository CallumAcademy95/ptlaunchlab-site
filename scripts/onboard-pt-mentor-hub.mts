/**
 * Onboarding for PT Mentor Hub: a business MENTOR, not a gym (Nov 2026).
 * The same NCFE Level 2 & 3 course as every partner, sold with his mentorship
 * on his own page (/pt-mentor-hub-academy), PAY IN FULL ONLY (£999.99; see
 * PAY_IN_FULL_ONLY_PARTNERS in app/lib/pricing.ts).
 *
 * Created BEFORE any agreement is signed, at Callum's request (12 Nov 2026), so
 * the draft page attributes enrolments and he can see them in the portal while
 * the deal is discussed. Fill in the agreement constants when it is signed.
 *
 *   npx tsx scripts/onboard-pt-mentor-hub.mts            # dry run — shows the plan
 *   npx tsx scripts/onboard-pt-mentor-hub.mts --apply    # write it
 *
 * Terms: a 50-50 split, £500 per learner flat. That is the pre-ladder flat-fee
 * path (commissionForSale → fee_per_learner_pence), on 'payment_5' terms: pay
 * in full releases after payout_terms_days. 'payment_5' rather than
 * 'on_enrolment' so that, if a monthly sale ever did get through, its £500
 * would wait for the 5th payment (£499.95 collected) instead of paying on day
 * one. Not 'ladder', so the quarterly top-up never applies to him.
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

const SLUG = "pt-mentor-hub"; // = the enrol page's gymSlug; never change
const FEE_PENCE = 50_000; // £500 per learner, half of £999.99 (rounded to the pound)
const TERMS = "payment_5";

// ── Fill these in when the agreement is signed ──────────────────────────────
const AGREEMENT_SIGNED_AT: string | null = null;
const AGREEMENT_VERSION: string | null = null;
const CONTACT_NAME: string | null = null;
const CONTACT_EMAIL: string | null = null;
// ─────────────────────────────────────────────────────────────────────────────

const PARTNER: Record<string, unknown> = {
  slug: SLUG,
  gym_name: "PT Mentor Hub",
  status: "active",
  landing_page_path: "/pt-mentor-hub-academy",
  logo_url: "/gym-logos/pt-mentor-hub.png",
  primary_color: "#DB4A2B",
  fee_per_learner_pence: FEE_PENCE,
  commission_terms: TERMS,
  contact_name: CONTACT_NAME,
  contact_email: CONTACT_EMAIL,
  agreement_version: AGREEMENT_VERSION,
  agreement_signed_at: AGREEMENT_SIGNED_AT,
  legacy_referral_names: ["PT Mentor Hub", "PT Mentor", "PTMentorHub", "pt_mentor_hub", "Mentor Hub"],
  is_demo: false,
};

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const [existing] = await api(`pp_partners?slug=eq.${SLUG}&select=id,gym_name,commission_terms,fee_per_learner_pence`);

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${PARTNER.gym_name} (/${SLUG})\n`);
console.log(existing ? `  partner row EXISTS (${existing.id}) — will update in place` : "  partner row will be CREATED");
console.log(`  landing page   ${PARTNER.landing_page_path}`);
console.log(`  terms          ${TERMS}, £${FEE_PENCE / 100} per learner`);
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
  if (partner.commission_terms !== TERMS || partner.fee_per_learner_pence !== FEE_PENCE) {
    console.error("\n  WRONG TERMS written back; investigate before any sale.");
    process.exitCode = 1;
  }
}
