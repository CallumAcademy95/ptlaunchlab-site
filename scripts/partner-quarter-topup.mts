/**
 * Quarterly volume top-up for the v4.1 partner sales ladder.
 *
 *   npx tsx scripts/partner-quarter-topup.mts                       # dry run, last quarter
 *   npx tsx scripts/partner-quarter-topup.mts --quarter=2026-Q4     # dry run, that quarter
 *   npx tsx scripts/partner-quarter-topup.mts --quarter=2026-Q4 --apply
 *
 * A gym on 'ladder' terms with 4 or more learners enrolled in a calendar
 * quarter (confirmed, not voided) has EVERY ladder sale that quarter topped up:
 * +£100 on pay-in-full (to £500, less any member saving), +£50 on monthly (to
 * £300). The rule is app/lib/partnerCommission.ts quarterTopUp(); this script
 * only reads and writes.
 *
 * Writes pp_sales.volume_bonus_pence and nothing else. The bonus is paid with
 * the next payout run (admin "Mark paid", or scripts/mark-commission-paid.mts),
 * which settles it separately via volume_bonus_payout_id.
 *
 * Safe to re-run: a sale already holding the right bonus is left alone, and a
 * bonus that has been paid is never changed. --apply refuses a quarter that
 * has not ended yet. ATP Fitness Felixstowe and demo partners are excluded —
 * ATP's own rungs replace the volume rate.
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env.local if
 * present), and supabase/migrations/20261010_pp_partner_ladder.sql applied.
 */

import { readFileSync, existsSync } from "node:fs";
import {
  isAtp,
  LADDER_TERMS,
  parseQuarter,
  previousQuarter,
  quarterTopUp,
  VOLUME_THRESHOLD,
  type QuarterSale,
} from "../app/lib/partnerCommission.ts";

const envFile = new URL("../.env.local", import.meta.url);
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=") || "true"];
  }),
);
const APPLY = args.apply === "true";
const now = new Date();
const q = args.quarter ? parseQuarter(args.quarter) : previousQuarter(now);
if (!q) throw new Error(`--quarter must look like 2026-Q4 (got "${args.quarter}")`);
if (APPLY && q.end.getTime() > now.getTime()) {
  throw new Error(`${q.label} has not ended yet (ends ${q.end.toISOString().slice(0, 10)}). Run --apply after it ends.`);
}

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

interface Partner { id: string; slug: string; gym_name: string; commission_terms: string; is_demo: boolean | null }
type Sale = QuarterSale & { partner_id: string; learner_name: string | null; volume_bonus_payout_id: string | null };

const partners = (await api<Partner[]>("pp_partners?select=id,slug,gym_name,commission_terms,is_demo"))
  .filter((p) => p.commission_terms === LADDER_TERMS && !p.is_demo && !isAtp(p.slug));

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — volume top-up for ${q.label} (${q.start.toISOString().slice(0, 10)} to ${new Date(q.end.getTime() - 1).toISOString().slice(0, 10)})`);
console.log(`${partners.length} partner(s) on '${LADDER_TERMS}' terms (ATP and demo excluded)\n`);

let grand = 0;
let written = 0;
for (const p of partners) {
  const sales = await api<Sale[]>(
    `pp_sales?select=id,partner_id,learner_name,enrolled_at,status,commission_status,rung,plan_type,volume_bonus_pence,volume_bonus_payout_id` +
      `&partner_id=eq.${p.id}&enrolled_at=gte.${q.start.toISOString()}&enrolled_at=lt.${q.end.toISOString()}&order=enrolled_at`,
  );
  const r = quarterTopUp(sales, q);
  const byId = new Map(sales.map((s) => [s.id, s]));
  // A bonus that has been paid is never changed by this script.
  const changes = r.changes.filter((c) => !byId.get(c.id)?.volume_bonus_payout_id);

  console.log(
    `  ${p.gym_name.padEnd(26)} ${String(r.learners).padStart(2)} learner(s)  ` +
      (r.qualifies ? `QUALIFIES  bonus £${r.totalBonusPence / 100}` : `below ${VOLUME_THRESHOLD}  no top-up`),
  );
  for (const c of changes) {
    const s = byId.get(c.id)!;
    console.log(`      ${s.enrolled_at.slice(0, 10)}  ${(s.learner_name ?? "—").padEnd(24)} ${s.rung ?? s.plan_type}  £${c.from / 100} → £${c.to / 100}`);
  }
  grand += r.qualifies ? r.totalBonusPence : 0;

  if (!APPLY) continue;
  for (const c of changes) {
    await api(`pp_sales?id=eq.${c.id}&volume_bonus_payout_id=is.null`, {
      method: "PATCH",
      body: JSON.stringify({ volume_bonus_pence: c.to }),
    });
    written++;
  }
}

console.log(`\nTotal volume bonus for ${q.label}: £${grand / 100}`);
console.log(APPLY ? `${written} sale(s) updated.` : "Nothing written. Re-run with --apply to commit.");
