/**
 * One-off onboarding for Muscle Makers Gym (Muscle Makers Gym Limited, director
 * Krystina Jamieson). Signed agreement v4.2 on 14 Oct 2026.
 *
 *   npx tsx scripts/onboard-muscle-makers.mts            # dry run — shows the plan
 *   npx tsx scripts/onboard-muscle-makers.mts --apply    # write it
 *
 * Bank details are read from the environment, never from this file, so the
 * account number is not committed:
 *   MM_BANK_NAME, MM_BANK_SORT, MM_BANK_ACCOUNT
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

const SLUG = "muscle-makers";

const PARTNER: Record<string, unknown> = {
  slug: SLUG,
  gym_name: "Muscle Makers Gym",
  status: "active",
  landing_page_path: "/muscle-makers-academy",
  logo_url: "/gym-logos/muscle-makers.png",
  primary_color: "#FFC10E",
  contact_name: "Krystina Jamieson",
  contact_email: "info@musclemakersgym.co.uk",
  // From the signed PDF (ref PTA-9540947). The PDF records the date only, so
  // midnight UK on the day is used; no time of signing is claimed.
  agreement_version: "4.2",
  agreement_signed_at: "2026-10-14T00:00:00+01:00",
  // Generous on purpose: the enrolment sheet's "Heard About/gym" column is
  // hand-typed. Deliberately NOT "Muscle" alone — Muscle Bound is a separate
  // partner and must never be confused with this one.
  legacy_referral_names: [
    "Muscle Makers Gym",
    "Muscle Makers",
    "MuscleMakers",
    "Musclemakers Gym",
    "Muscle Makers Gym Limited",
    "Muscle Makers Gym Ltd",
  ],
  is_demo: false,
};

const digits = (s: string) => s.replace(/\D/g, "");
const bankName = process.env.MM_BANK_NAME?.trim();
const bankSort = digits(process.env.MM_BANK_SORT ?? "");
const bankAcct = digits(process.env.MM_BANK_ACCOUNT ?? "");
const withBank = Boolean(bankName || bankSort || bankAcct);
if (withBank) {
  if (!bankName || bankName.length < 2) throw new Error("MM_BANK_NAME is too short");
  if (bankSort.length !== 6) throw new Error("MM_BANK_SORT must be 6 digits");
  if (bankAcct.length !== 8) throw new Error("MM_BANK_ACCOUNT must be 8 digits");
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
console.log(`  agreement      v${PARTNER.agreement_version}, signed ${PARTNER.agreement_signed_at}`);
console.log(`  referral names ${(PARTNER.legacy_referral_names as string[]).length}`);
console.log(`  bank details   ${withBank ? `${bankName} · ••-••-${bankSort.slice(4)} · ••••${bankAcct.slice(-4)}` : "not set (partner adds them in the portal)"}`);
if (existing?.bank_sort_code && withBank) {
  console.log("  ⚠ bank details already on file — this would REPLACE them without the change email. Use /admin/partners instead.");
}

if (!APPLY) {
  console.log("\nNothing written. Add --apply.");
} else {
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
