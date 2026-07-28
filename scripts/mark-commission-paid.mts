/**
 * Mark partner commission as paid, and record the payout it was paid under.
 *
 *   npx tsx scripts/mark-commission-paid.mts --before=2026-07-26 --label="Settled to 25 July 2026"
 *   ...add --apply to write.
 *
 * Until the Phase 4 payouts UI exists this is how a payment run gets recorded.
 * Without it the portal shows money as "Ready to pay" that has already been
 * sent, which is worse than showing nothing — a partner chases an amount they
 * have had.
 *
 * `--before` is the enrolment date cutoff, exclusive. Only sales whose
 * commission is currently unpaid and not voided are touched, so re-running is
 * safe and a second run reports nothing to do.
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=") || "true"];
  })
);
const APPLY = args.apply === "true";
const BEFORE = args.before;
const LABEL = args.label ?? "Manual payout";
const REFERENCE = args.reference ?? null;
const PAID_AT = args["paid-at"] ?? null;
if (!BEFORE) throw new Error("--before=YYYY-MM-DD is required (enrolment date cutoff, exclusive)");

const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : null) as T;
}

interface Sale {
  id: string; partner_id: string; learner_name: string | null;
  commission_pence: number; commission_status: string;
  commission_release_at: string | null; enrolled_at: string;
}
interface Partner { id: string; slug: string; gym_name: string }

const partners = await api<Partner[]>("pp_partners?select=id,slug,gym_name");
const byId = new Map(partners.map((p) => [p.id, p]));

const sales = await api<Sale[]>(
  `pp_sales?select=id,partner_id,learner_name,commission_pence,commission_status,commission_release_at,enrolled_at` +
  `&enrolled_at=lt.${BEFORE}&commission_status=neq.paid&commission_status=neq.voided&status=eq.confirmed` +
  `&order=enrolled_at`
);

if (!sales.length) {
  console.log(`Nothing to mark — no unpaid commission on enrolments before ${BEFORE}.`);
  process.exit(0);
}

// Grouped by partner AND release date, not just partner. Each sale's
// commission_release_at is the date it became payable under that partner's
// terms, so grouping on it means every payout record carries the real date the
// money was due rather than the date we happened to reconcile. Where a date
// isn't known any better than that, it is the most defensible one available.
const grouped = new Map<string, Sale[]>();
for (const s of sales) {
  const key = `${s.partner_id}|${s.commission_release_at?.slice(0, 10) ?? "unreleased"}`;
  grouped.set(key, [...(grouped.get(key) ?? []), s]);
}

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — marking commission paid on ${sales.length} enrolment(s) before ${BEFORE}\n`);

for (const [key, rows] of [...grouped.entries()].sort()) {
  const [partnerId, dueDate] = key.split("|");
  const partner = byId.get(partnerId);
  const total = rows.reduce((t, s) => t + s.commission_pence, 0);
  const due = dueDate === "unreleased" ? null : dueDate;

  const label = due
    ? `Due ${new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
    : LABEL;

  console.log(
    `  ${(partner?.gym_name ?? partnerId).padEnd(22)} ${label.padEnd(28)} ` +
    `${rows.length} × £500 = £${(total / 100).toLocaleString()}`
  );
  for (const s of rows) {
    console.log(`      enrolled ${s.enrolled_at.slice(0, 10)}  ${s.learner_name ?? "—"}`);
  }

  if (!APPLY) continue;

  const [payout] = await api<{ id: string }[]>("pp_payouts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      partner_id: partnerId,
      period_label: label,
      total_pence: total,
      status: "paid",
      reference: REFERENCE,
      // The date the commission fell due under the agreement. Overridable with
      // --paid-at when the actual transfer date is known and differs.
      paid_at: PAID_AT ?? (due ? `${due}T00:00:00.000Z` : null),
    }),
  });

  await api(`pp_sales?id=in.(${rows.map((s) => s.id).join(",")})`, {
    method: "PATCH",
    body: JSON.stringify({ commission_status: "paid", payout_id: payout.id }),
  });
  console.log(`      → payout ${payout.id} recorded`);
}

if (!APPLY) console.log("\nNothing written. Re-run with --apply to commit.");
