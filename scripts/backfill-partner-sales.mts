/**
 * Backfill pp_sales from historical enrolments.
 *
 *   npx tsx scripts/backfill-partner-sales.mts --source=stripe
 *   npx tsx scripts/backfill-partner-sales.mts --source=csv --file=./gym-tracker.csv
 *   ...add --apply to actually write. Without it nothing is written.
 *
 * Two sources because neither is complete on its own:
 *
 *   stripe — every completed Checkout Session. Attribution comes from
 *            metadata.gym_slug (2026-07-27 onward) or the `gym`/`gyms` keys in
 *            client_reference_id, read tolerantly because Stripe truncates that
 *            field at 200 characters and a strict JSON.parse loses the gym.
 *
 *   csv    — an export of the Make → Google Sheet gym tracker, which is the only
 *            record of enrolments that never went through Checkout. Expects the
 *            columns sendToGymTracker() writes: timestamp, gym_referral,
 *            promo_code, customer_email, customer_name, amount_gbp, plan_type,
 *            stripe_session_id.
 *
 * Deliberately calls the same recordPartnerSale() the webhook uses, so a
 * backfilled row and a live row are built by identical logic. It is idempotent
 * on stripe_session_id, so re-running is safe.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Load .env.local by hand — this runs outside Next, so nothing else does it.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const { recordPartnerSale } = await import(
  pathToFileURL(new URL("../app/lib/partner-sales.ts", import.meta.url).pathname.slice(1)).href
);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);
const APPLY = args.apply === "true";
const SOURCE = args.source ?? "stripe";

/** Stripe caps client_reference_id at 200 chars, so the JSON can arrive cut off. */
function decodeRef(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  let decoded = "";
  try {
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    decoded = Buffer.from(padded + "=".repeat((4 - (padded.length % 4)) % 4), "base64").toString("utf8");
  } catch {
    return {};
  }
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

interface Candidate {
  stripeSessionId: string;
  stripeSubscriptionId?: string | null;
  gymSlug?: string | null;
  gymDisplayName?: string | null;
  learnerName?: string | null;
  learnerEmail?: string | null;
  amountTotalPence: number;
  mode?: string | null;
  promoCode?: string | null;
  enrolledAt: Date;
}

async function fromStripe(): Promise<Candidate[]> {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) throw new Error("STRIPE_SECRET_KEY missing");

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

  return sessions
    .filter((s) => s.status === "complete")
    .map((s) => {
      const ref = decodeRef(s.client_reference_id);
      return {
        stripeSessionId: s.id,
        stripeSubscriptionId: s.subscription ?? null,
        gymSlug: s.metadata?.gym_slug || ref.gyms || null,
        gymDisplayName: s.metadata?.gym_referral || ref.gym || null,
        learnerName: s.customer_details?.name || s.metadata?.buyer_name || null,
        learnerEmail: s.customer_email || s.customer_details?.email || null,
        amountTotalPence: s.amount_total ?? 0,
        mode: s.mode ?? null,
        promoCode: s.metadata?.promo_code ?? null,
        enrolledAt: new Date(s.created * 1000),
      };
    })
    .filter((c) => c.gymSlug || c.gymDisplayName);
}

/** Minimal RFC-4180 reader — the Sheet has gym names with commas in them. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }

  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  const keys = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

function fromCsv(file: string): Candidate[] {
  return parseCsv(readFileSync(file, "utf8"))
    .filter((r) => r.gym_referral)
    .map((r, i) => {
      const gbp = Number(String(r.amount_gbp ?? "").replace(/[£,]/g, "")) || 0;
      return {
        // Rows with no session id still need a stable idempotency key, or a
        // second run would duplicate them.
        stripeSessionId: r.stripe_session_id || `sheet:${r.customer_email || i}:${r.timestamp || i}`,
        gymSlug: null,
        gymDisplayName: r.gym_referral,
        learnerName: r.customer_name || null,
        learnerEmail: r.customer_email || null,
        amountTotalPence: Math.round(gbp * 100),
        mode: null,
        promoCode: r.promo_code || null,
        enrolledAt: r.timestamp ? new Date(r.timestamp) : new Date(),
      };
    })
    .filter((c) => c.amountTotalPence > 0 && !Number.isNaN(c.enrolledAt.getTime()));
}

const candidates =
  SOURCE === "csv"
    ? fromCsv(args.file ?? (() => { throw new Error("--file=<path> required for --source=csv"); })())
    : await fromStripe();

console.log(`source=${SOURCE}  attributed candidates=${candidates.length}  ${APPLY ? "APPLYING" : "DRY RUN"}\n`);

const tally: Record<string, number> = {};
for (const c of candidates) {
  const gym = c.gymSlug || c.gymDisplayName || "?";
  tally[gym] = (tally[gym] ?? 0) + 1;
  const line = `${c.enrolledAt.toISOString().slice(0, 10)}  £${(c.amountTotalPence / 100).toFixed(0).padStart(5)}  ${String(gym).padEnd(24)}  ${(c.learnerName ?? "-").slice(0, 24)}`;

  if (!APPLY) { console.log("  [dry]  " + line); continue; }

  const result = await recordPartnerSale(c);
  console.log(`  ${result.ok ? (result.reason === "recorded" ? "[ok] " : "[skip]") : "[FAIL]"} ${line}   ${result.reason}`);
}

console.log("\nBY GYM:");
for (const [gym, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(gym).padEnd(26)} ${n}`);
}
if (!APPLY) console.log("\nNothing written. Re-run with --apply to commit.");
