/**
 * One-off onboarding for M Club (M Club Spa and Fitness Limited, two clubs in
 * Stoke-on-Trent: Hanley/Waterworld and Newcastle/Parklands). Prepared on
 * 20 Oct 2026 BEFORE the agreement was signed.
 *
 * Signed v4.2 on 22 Oct 2026, ref PTA-8349248, by Debbie Evans (Director).
 * No member saving elected. ⚠ The signed PDF names the party as "Director
 * Ltd", Company No "Director": the signer typed her title into the company
 * fields. Correct it in writing; it does not change anything written here.
 * --apply still refuses if any of the four constants below is cleared.
 *
 *   npx tsx scripts/onboard-mclub.mts            # dry run — shows the plan
 *   npx tsx scripts/onboard-mclub.mts --apply    # write it (after signing)
 *
 * Bank details are read from the environment, never from this file, so the
 * account number is not committed:
 *   MCLUB_BANK_NAME, MCLUB_BANK_SORT, MCLUB_BANK_ACCOUNT
 * Leave them unset and the row is created without bank details; the partner
 * can add them in the portal.
 *
 * No Stripe codes. Since 9 Oct 2026 the course is £999.99 in full or
 * 10 × £99.99 with no codes, and a v4.2 signer is paid on the 'ladder' terms
 * (£400 pay-in-full / £250 monthly, £500 / £300 from the 4th learner in a
 * calendar quarter). Both are the column defaults, so neither is passed here;
 * the guard below fails loudly if the defaults ever change underneath.
 *
 * Idempotent on slug: a re-run updates the row in place. Safe to run twice.
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

const SLUG = "mclub";

// ── Fill these in from the signed agreement before --apply ──────────────────
const AGREEMENT_SIGNED_AT: string | null = "2026-10-22T00:00:00+01:00"; // date on the PDF, midnight UK (BST)
const AGREEMENT_REF: string | null = "PTA-8349248";
const CONTACT_NAME: string | null = "Debbie Evans"; // the signatory, Director
const CONTACT_EMAIL: string | null = "debbie@mclubspaandfitness.com"; // the agreement notice address (cl. 18.3)
// ─────────────────────────────────────────────────────────────────────────────
const SIGNED = Boolean(AGREEMENT_SIGNED_AT && AGREEMENT_REF && CONTACT_NAME && CONTACT_EMAIL);

const PARTNER: Record<string, unknown> = {
  slug: SLUG,
  gym_name: "M Club",
  status: "active",
  landing_page_path: "/mclub-academy",
  logo_url: "/gym-logos/mclub.png",
  primary_color: "#004B47",
  contact_name: CONTACT_NAME,
  contact_email: CONTACT_EMAIL,
  agreement_version: "4.2",
  agreement_signed_at: AGREEMENT_SIGNED_AT,
  // Generous on purpose: the enrolment sheet's "Heard About/gym" column is
  // hand-typed. "M Club" is short, so only forms that name the club.
  legacy_referral_names: [
    "M Club",
    "MClub",
    "M-Club",
    "M Club Spa and Fitness",
    "M Club Spa & Fitness",
    "M Club Hanley",
    "M Club Newcastle",
    "M Club Stoke",
  ],
  is_demo: false,
};

const digits = (s: string) => s.replace(/\D/g, "");
const bankName = process.env.MCLUB_BANK_NAME?.trim();
const bankSort = digits(process.env.MCLUB_BANK_SORT ?? "");
const bankAcct = digits(process.env.MCLUB_BANK_ACCOUNT ?? "");
const withBank = Boolean(bankName || bankSort || bankAcct);
if (withBank) {
  if (!bankName || bankName.length < 2) throw new Error("MCLUB_BANK_NAME is too short");
  if (bankSort.length !== 6) throw new Error("MCLUB_BANK_SORT must be 6 digits");
  if (bankAcct.length !== 8) throw new Error("MCLUB_BANK_ACCOUNT must be 8 digits");
  Object.assign(PARTNER, {
    bank_account_name: bankName,
    bank_sort_code: bankSort,
    bank_account_number: bankAcct,
    bank_details_updated_at: new Date().toISOString(),
    bank_details_updated_by: null,
  });
}

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const [existing] = await api(`pp_partners?slug=eq.${SLUG}&select=id,gym_name,commission_terms,bank_sort_code`);

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${PARTNER.gym_name} (/${SLUG})\n`);
console.log(existing ? `  partner row EXISTS (${existing.id}) — will update in place` : "  partner row will be CREATED");
console.log(`  landing page   ${PARTNER.landing_page_path}`);
console.log(`  contact        ${PARTNER.contact_name} <${PARTNER.contact_email}>`);
console.log(`  agreement      v${PARTNER.agreement_version}, ${SIGNED ? `signed ${AGREEMENT_SIGNED_AT} (ref ${AGREEMENT_REF})` : "NOT SIGNED — fill in the constants at the top"}`);
console.log(`  referral names ${(PARTNER.legacy_referral_names as string[]).length}`);
console.log(`  bank details   ${withBank ? `${bankName} · ••-••-${bankSort.slice(4)} · ••••${bankAcct.slice(-4)}` : "not set (partner adds them in the portal)"}`);
if (existing?.bank_sort_code && withBank) {
  console.log("  ⚠ bank details already on file — this would REPLACE them without the change email. Use /admin/partners instead.");
}

if (!APPLY) {
  console.log("\nNothing written. Add --apply.");
} else {
  if (!SIGNED) throw new Error("M Club has not signed: fill in AGREEMENT_SIGNED_AT, AGREEMENT_REF, CONTACT_NAME and CONTACT_EMAIL first");
  if (existing?.bank_sort_code && withBank) throw new Error("refusing to replace existing bank details from a script");
  const [partner] = existing
    ? await api(`pp_partners?slug=eq.${SLUG}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(PARTNER) })
    : await api("pp_partners", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(PARTNER) });

  console.log(`\npartner ${existing ? "updated" : "created"}: ${partner.id}`);
  console.log(`commission_terms: ${partner.commission_terms}  fee: ${partner.fee_per_learner_pence}`);

  if (partner.commission_terms !== "ladder" || partner.fee_per_learner_pence !== 25000) {
    console.error(
      `\n  WRONG TERMS: a v4.2 signer belongs on 'ladder' / 25000, got "${partner.commission_terms}" / ${partner.fee_per_learner_pence}.` +
        `\n  The column defaults have changed; understand why before going further.`,
    );
    process.exitCode = 1;
  }
}
