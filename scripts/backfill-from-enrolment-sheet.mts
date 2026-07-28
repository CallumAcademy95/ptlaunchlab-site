/**
 * Backfill pp_sales from the ENROLMENT sheet of the Website Lead Capture workbook.
 *
 *   npx tsx scripts/backfill-from-enrolment-sheet.mts --file="C:/path/Website Lead Capture.xlsx"
 *   ...add --apply to write. Without it nothing is written.
 *
 * Why this and not Stripe alone: Stripe knows the money but mostly not the gym.
 * Only 5 of 21 completed sessions carry attribution, and all three Ebor sales
 * are among the ones that don't. The enrolment form is the only place the gym
 * was reliably captured, in the "Heard About/gym" column.
 *
 * So the sheet is the list of enrolments, and Stripe is joined onto it for the
 * real amount paid and a genuine stripe_session_id to key idempotency on.
 *
 * The join is deliberately conservative — email first, then name-and-date — and
 * anything it can't resolve cleanly is printed as a conflict rather than
 * guessed at. Commission is £500 a head, so a wrong row is real money.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ExcelJS from "exceljs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const libUrl = pathToFileURL(new URL("../app/lib/partner-sales.ts", import.meta.url).pathname.slice(1)).href;
const { recordPartnerSale } = await import(libUrl);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=") || "true"];
  })
);
const APPLY = args.apply === "true";
const FILE = args.file;
if (!FILE) throw new Error('--file="<path to .xlsx>" is required');

// ── Helpers ─────────────────────────────────────────────────────────────────

function cellText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && v !== null && "text" in (v as Record<string, unknown>)) {
    return String((v as { text: unknown }).text);
  }
  return String(v);
}

/** The sheet mixes ISO strings, "6 April 2026 at 21:40", and Excel serial numbers. */
function readDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400000));
  const d = new Date(cellText(v).replace(" at ", " "));
  return Number.isNaN(d.getTime()) ? null : d;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
/** Surname match — first names vary ("Samantha" / "samantha clair", "Kim" / "k"). */
function surname(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return parts.length ? norm(parts[parts.length - 1]) : "";
}

function decodeRef(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  let decoded = "";
  try {
    const p = raw.replace(/-/g, "+").replace(/_/g, "/");
    decoded = Buffer.from(p + "=".repeat((4 - (p.length % 4)) % 4), "base64").toString("utf8");
  } catch { return {}; }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    const out: Record<string, string> = {};
    for (const [, k, v] of decoded.matchAll(/"([a-z_]+)"\s*:\s*"([^"]*)"/g)) out[k] = v;
    return out;
  }
  return {};
}

// ── 1. Read the enrolments ──────────────────────────────────────────────────

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const ws = wb.getWorksheet("ENROLMENT");
if (!ws) throw new Error('No "ENROLMENT" sheet in that workbook');

const header = (ws.getRow(1).values as unknown[]).slice(1).map((h) => cellText(h));
const col = (name: string) => header.indexOf(name);

interface Enrolment {
  date: Date | null;
  name: string;
  email: string;
  gymDisplay: string;
  paymentLabel: string;
  promo: string;
}

const enrolments: Enrolment[] = [];
for (let r = 2; r <= ws.rowCount; r++) {
  const v = (ws.getRow(r).values as unknown[]).slice(1);
  const name = cellText(v[col("Full Name")]).trim();
  if (!name) continue;

  const gymRaw = cellText(v[col("Heard About/gym")]).trim();
  if (!/\(Gym Referral\)/i.test(gymRaw)) continue; // direct sale — no partner

  enrolments.push({
    date: readDate(v[col("Submitted At")]),
    name,
    email: cellText(v[col("Email")]).trim().toLowerCase(),
    gymDisplay: gymRaw.replace(/\s*\(Gym Referral\)\s*/i, "").trim(),
    paymentLabel: cellText(v[col("Payment")]).trim(),
    promo: cellText(v[col("promo_code")]).trim(),
  });
}

// ── 2. Drop duplicate form submissions ──────────────────────────────────────
// The same learner filling the enrolment form twice is one sale, not two. Keyed
// on email because that is what the buyer actually retypes consistently.

const seen = new Map<string, Enrolment>();
const duplicates: Enrolment[] = [];
for (const e of enrolments) {
  const key = e.email || `${norm(e.name)}|${e.gymDisplay}`;
  const prior = seen.get(key);
  if (!prior) { seen.set(key, e); continue; }
  // Keep the later submission — it is the one closer to the completed payment.
  if ((e.date?.getTime() ?? 0) > (prior.date?.getTime() ?? 0)) {
    seen.set(key, e); duplicates.push(prior);
  } else {
    duplicates.push(e);
  }
}
const deduped = [...seen.values()].sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

// ── 3. Pull Stripe and join ─────────────────────────────────────────────────

const sk = process.env.STRIPE_SECRET_KEY;
let url: string | null = "https://api.stripe.com/v1/checkout/sessions?limit=100";
const sessions: any[] = [];
while (url) {
  const res: any = await (await fetch(url, { headers: { Authorization: `Bearer ${sk}` } })).json();
  if (res.error) throw new Error(`Stripe: ${res.error.message}`);
  sessions.push(...res.data);
  url = res.has_more
    ? `https://api.stripe.com/v1/checkout/sessions?limit=100&starting_after=${res.data[res.data.length - 1].id}`
    : null;
}
const paid = sessions.filter((s) => s.status === "complete");
const claimed = new Set<string>();

/**
 * Joins the automatic matcher couldn't make, adjudicated by hand.
 *
 * kimearljude@gmail.com filled the enrolment form as "Earl Moreland" and paid as
 * "k Stapleton" from kimnearl@hotmail.co.uk — same person, same gym, same day,
 * nothing in common for the matcher to work from. Confirmed by Callum
 * 2026-07-28. The sheet records it as a £1,599 pay-in-full; Stripe took £599, so
 * the Stripe record wins and it is treated as a deposit plan.
 */
const MANUAL_SESSION_MATCHES: Record<string, string> = {
  "kimearljude@gmail.com":
    "cs_live_a19Nbm0VWgPAmYNtVSGbyPjp6N3S1lLLIU541DuIOJ6buGLAkSDtKk3Pnu",
};

function matchStripe(e: Enrolment): { session: any; how: string } | null {
  const manualId = MANUAL_SESSION_MATCHES[e.email];
  if (manualId) {
    const s = paid.find((x) => x.id === manualId);
    if (s) return { session: s, how: "manual" };
    console.warn(`  ! manual match for ${e.email} points at a session that no longer exists`);
  }

  const candidates = paid.filter((s) => !claimed.has(s.id));

  const byEmail = candidates.find(
    (s) => (s.customer_email || s.customer_details?.email || "").toLowerCase() === e.email && e.email
  );
  if (byEmail) return { session: byEmail, how: "email" };

  // Emails differ on 2 of 10 rows (enrolment address vs card billing address),
  // so fall back to surname within a few days of the form submission.
  if (e.date) {
    const window = 5 * 86400000;
    const bySurname = candidates.find((s) => {
      const n = s.customer_details?.name || "";
      return (
        surname(n) && surname(n) === surname(e.name) &&
        Math.abs(s.created * 1000 - e.date!.getTime()) <= window
      );
    });
    if (bySurname) return { session: bySurname, how: "surname+date" };
  }
  return null;
}

// ── 4. Build and report ─────────────────────────────────────────────────────

const DEPOSIT_PENCE = 59_900;
const PIF_LIST_PENCE = 159_900;

interface Row { e: Enrolment; session: any | null; how: string; amountPence: number; conflict?: string }
const rows: Row[] = [];

for (const e of deduped) {
  const m = matchStripe(e);
  if (m) claimed.add(m.session.id);

  const labelIsDeposit = /deposit/i.test(e.paymentLabel);
  const labelIsManual = /manual entry/i.test(e.paymentLabel);
  const amountPence = m ? (m.session.amount_total ?? 0) : labelIsDeposit ? DEPOSIT_PENCE : PIF_LIST_PENCE;

  let conflict: string | undefined;
  if (m) {
    const stripeIsDeposit = m.session.mode === "subscription" || (m.session.amount_total ?? 0) <= 70_000;
    if (stripeIsDeposit !== labelIsDeposit) {
      conflict = `sheet says "${e.paymentLabel}" but Stripe took £${((m.session.amount_total ?? 0) / 100).toFixed(0)}`;
    }
    const sEmail = (m.session.customer_email || m.session.customer_details?.email || "").toLowerCase();
    if (m.how === "surname+date" && sEmail && sEmail !== e.email) {
      conflict = (conflict ? conflict + "; " : "") + `matched on name+date — Stripe email is ${sEmail}`;
    }
  } else if (!labelIsManual) {
    conflict = "no Stripe payment found";
  }

  rows.push({ e, session: m?.session ?? null, how: m?.how ?? "-", amountPence, conflict });
}

console.log(`\nENROLMENT sheet: ${enrolments.length} gym-attributed rows, ${duplicates.length} duplicate submission(s) dropped, ${rows.length} sales.\n`);

for (const r of rows) {
  console.log(
    `  ${r.e.date?.toISOString().slice(0, 10) ?? "??????????"}  ${r.e.gymDisplay.padEnd(20)} ` +
    `£${(r.amountPence / 100).toFixed(0).padStart(5)}  ${r.e.name.slice(0, 22).padEnd(24)} ` +
    `${r.how.padEnd(13)} ${r.session ? r.session.id.slice(0, 20) : "(no session)"}`
  );
  if (r.conflict) console.log(`        ⚠  ${r.conflict}`);
}

if (duplicates.length) {
  console.log("\nDROPPED AS DUPLICATE SUBMISSIONS:");
  for (const d of duplicates) {
    console.log(`  ${d.date?.toISOString().slice(0, 10)}  ${d.gymDisplay.padEnd(20)} ${d.name} <${d.email}>`);
  }
}

// Attributed money in Stripe that no enrolment row claimed. Either a learner
// who paid without completing the form, or a row this join failed to match —
// both mean a partner is owed something the numbers above don't show.
const unclaimed = paid.filter((s) => {
  if (claimed.has(s.id)) return false;
  const ref = decodeRef(s.client_reference_id);
  return Boolean(s.metadata?.gym_slug || ref.gyms || s.metadata?.gym_referral || ref.gym);
});
if (unclaimed.length) {
  console.log("\n⚠  STRIPE SALES WITH A GYM THAT NO ENROLMENT ROW CLAIMED:");
  for (const s of unclaimed) {
    const ref = decodeRef(s.client_reference_id);
    console.log(
      `  ${new Date(s.created * 1000).toISOString().slice(0, 10)}  ` +
      `${String(s.metadata?.gym_referral || ref.gym || ref.gyms).padEnd(20)} ` +
      `£${((s.amount_total ?? 0) / 100).toFixed(0).padStart(5)}  ` +
      `${(s.customer_details?.name || "-").padEnd(20)} <${s.customer_email || s.customer_details?.email || "-"}>  ${s.id}`
    );
  }
}

const byGym: Record<string, number> = {};
for (const r of rows) byGym[r.e.gymDisplay] = (byGym[r.e.gymDisplay] ?? 0) + 1;
console.log("\nCOMMISSION BY GYM (£500 each):");
for (const [g, n] of Object.entries(byGym).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${g.padEnd(22)} ${n} × £500 = £${(n * 500).toLocaleString()}`);
}

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply once the above looks right.");
  process.exit(0);
}

console.log("\nWriting…");
for (const r of rows) {
  const result = await recordPartnerSale({
    // A sale with no Stripe session still needs a stable key so a second run
    // updates rather than duplicates.
    stripeSessionId: r.session?.id ?? `sheet:${r.e.email || norm(r.e.name)}:${r.e.date?.toISOString().slice(0, 10)}`,
    stripeSubscriptionId: r.session?.subscription ?? null,
    gymSlug: r.session?.metadata?.gym_slug || decodeRef(r.session?.client_reference_id).gyms || null,
    gymDisplayName: r.e.gymDisplay,
    learnerName: r.e.name,
    learnerEmail: r.e.email || null,
    amountTotalPence: r.amountPence,
    mode: r.session?.mode ?? null,
    promoCode: r.e.promo || null,
    enrolledAt: r.e.date ?? undefined,
  });
  console.log(`  ${result.ok ? (result.reason === "recorded" ? "[ok]  " : "[skip]") : "[FAIL]"} ${r.e.gymDisplay.padEnd(20)} ${r.e.name.slice(0, 24).padEnd(26)} ${result.reason}`);
}
