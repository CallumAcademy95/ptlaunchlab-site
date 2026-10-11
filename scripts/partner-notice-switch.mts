/**
 * Run on (or after) 10 November 2026, when the 30-day notice in the 11 October
 * partner email ends. Moves every notified partner gym onto the v4.x commission
 * schedule (commission_terms = 'ladder'), whether or not it has signed: the
 * agreement lets PT Launch Lab vary the fee on 30 days' notice (clause 5.3).
 *
 * Before 10 November, signing only records the signature (see
 * app/lib/partnerTermsSwitch.ts), so sales inside the notice period keep the
 * gym's current £500. This script is the other half of that promise.
 *
 *   npx tsx scripts/partner-notice-switch.mts                 # dry run
 *   npx tsx scripts/partner-notice-switch.mts --apply         # write
 *   npx tsx scripts/partner-notice-switch.mts --apply --exclude 6fit
 *
 * Skips: the demo partner; any gym passed in --exclude (e.g. one that was never
 * sent the notice, or that has opted out); gyms already on 'ladder'. ATP keeps
 * its £500 deal fee (FEE_HELD_BY_DEAL) — only its terms move.
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env.local if
 * present).
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { FEE_HELD_BY_DEAL, NOTICE_TERMS_FROM_MS } from "../app/lib/partnerTermsSwitch.ts";
import { LADDER_TERMS } from "../app/lib/partnerCommission.ts";
import { PARTNER_FEE_PENCE } from "../app/lib/pricing.ts";

const envFile = new URL("../.env.local", import.meta.url);
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const APPLY = process.argv.includes("--apply");
const exclude = process.argv.includes("--exclude")
  ? process.argv[process.argv.indexOf("--exclude") + 1].split(",").map((s) => s.trim())
  : [];

if (Date.now() < NOTICE_TERMS_FROM_MS && APPLY) {
  console.error("The notice period has not ended (10 November 2026). Nothing written.");
  process.exit(1);
}

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data, error } = await db.from("pp_partners").select("id, slug, commission_terms, fee_per_learner_pence, is_demo, agreement_version");
if (error) throw error;

let changed = 0;
for (const p of data ?? []) {
  if (p.is_demo || exclude.includes(p.slug)) { console.log(`skip     ${p.slug} (${p.is_demo ? "demo" : "excluded"})`); continue; }
  if (p.commission_terms === LADDER_TERMS) { console.log(`ok       ${p.slug} already on ${LADDER_TERMS}`); continue; }
  const update: Record<string, unknown> = { commission_terms: LADDER_TERMS };
  if (!FEE_HELD_BY_DEAL.has(p.slug)) update.fee_per_learner_pence = PARTNER_FEE_PENCE;
  console.log(`${APPLY ? "switch" : "would  "}   ${p.slug}: ${p.commission_terms} → ${LADDER_TERMS}${update.fee_per_learner_pence ? "" : " (fee held by deal)"} · signed v${p.agreement_version ?? "—"}`);
  if (APPLY) {
    const { error: e } = await db.from("pp_partners").update(update).eq("id", p.id);
    if (e) { console.error(`  FAILED ${p.slug}: ${e.message}`); continue; }
    changed++;
  }
}
console.log(APPLY ? `\n${changed} partner(s) switched.` : "\nDry run. Re-run with --apply on or after 10 November 2026.");
