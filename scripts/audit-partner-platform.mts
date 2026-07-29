/**
 * Pre-launch audit of the partner platform.
 *
 *   npx tsx scripts/audit-partner-platform.mts
 *
 * Read-only. Checks the things that would embarrass us in front of a partner:
 * data that doesn't join up, files that don't exist, one gym seeing another
 * gym's material, and gym pages taking payments that resolve to no partner.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const ROOT = process.cwd();

const api = async <T,>(p: string): Promise<T> =>
  (await fetch(`${URL_BASE}/rest/v1/${p}`, { headers: H })).json() as Promise<T>;

let fails = 0, warns = 0;
const ok = (m: string) => console.log(`  ok    ${m}`);
const warn = (m: string) => { warns++; console.log(`  WARN  ${m}`); };
const fail = (m: string) => { fails++; console.log(`  FAIL  ${m}`); };
const section = (m: string) => console.log(`\n${m}`);

// ── Partners ────────────────────────────────────────────────────────────────
section("Partners");
const partners = await api<any[]>("pp_partners?select=*&order=slug");
ok(`${partners.length} partners`);

for (const p of partners) {
  if (!p.landing_page_path) fail(`${p.slug}: no landing_page_path — My Academy shows no link`);
  if (p.status !== "active") warn(`${p.slug}: status is "${p.status}"`);
  if (!p.bank_sort_code || !p.bank_account_number) {
    warn(`${p.slug}: no bank details — partner is nagged on their home page`);
  }
}

// Every live gym page must resolve to a partner row, or its sales vanish.
section("Gym pages → partner rows");
const slugsInDb = new Set(partners.map((p) => p.slug));
for (const dir of readdirSync(path.join(ROOT, "app"))) {
  const enrol = path.join(ROOT, "app", dir, "enrol", "page.tsx");
  if (!existsSync(enrol)) continue;
  const src = readFileSync(enrol, "utf8");
  const m = src.match(/gymSlug:\s*"([^"]*)"/);
  if (!m) continue;
  const slug = m[1];
  if (slug === "GYM-SLUG-HERE") {
    if (dir === "_gym-template") ok(`${dir}: placeholder slug (template, not live)`);
    else fail(`${dir}: still has the template placeholder slug — its sales will be unattributed`);
  } else if (!slugsInDb.has(slug)) {
    fail(`${dir}: gymSlug "${slug}" has no pp_partners row — sales log as UNATTRIBUTED`);
  } else {
    ok(`${dir} → ${slug}`);
  }
}

// ── Sales and money ─────────────────────────────────────────────────────────
section("Sales and commission");
const sales = await api<any[]>("pp_sales?select=*,partner:pp_partners(slug)");
const payouts = await api<any[]>("pp_payouts?select=*");
ok(`${sales.length} sales, ${payouts.length} payouts`);

const orphanSales = sales.filter((s) => !s.partner);
if (orphanSales.length) fail(`${orphanSales.length} sale(s) with no partner`); else ok("every sale joins to a partner");

const paidNoPayout = sales.filter((s) => s.commission_status === "paid" && !s.payout_id);
if (paidNoPayout.length) fail(`${paidNoPayout.length} sale(s) marked paid with no payout record`);
else ok("every paid commission has a payout behind it");

const payoutIds = new Set(payouts.map((p) => p.id));
const danglingPayout = sales.filter((s) => s.payout_id && !payoutIds.has(s.payout_id));
if (danglingPayout.length) fail(`${danglingPayout.length} sale(s) point at a payout that no longer exists`);
else ok("no dangling payout references");

// A payout's total must equal the commission it settles, or the partner's
// "already paid" figure disagrees with their own payment history.
for (const po of payouts) {
  const covered = sales.filter((s) => s.payout_id === po.id);
  const sum = covered.reduce((t, s) => t + s.commission_pence, 0);
  if (sum !== po.total_pence) {
    fail(`payout ${po.period_label}: total £${po.total_pence / 100} but covers £${sum / 100}`);
  }
}
if (!payouts.some((po) => sales.filter((s) => s.payout_id === po.id).reduce((t, s) => t + s.commission_pence, 0) !== po.total_pence)) {
  ok("payout totals match the sales they cover");
}

const badDates = sales.filter((s) => s.plan_type === "PIF" && !s.commission_release_at);
if (badDates.length) fail(`${badDates.length} pay-in-full sale(s) with no release date — never becomes payable`);
else ok("every pay-in-full sale has a release date");

const dupSessions = Object.entries(
  sales.reduce<Record<string, number>>((acc, s) => ((acc[s.stripe_session_id] = (acc[s.stripe_session_id] ?? 0) + 1), acc), {})
).filter(([, n]) => n > 1);
if (dupSessions.length) fail(`${dupSessions.length} duplicated stripe_session_id — commission counted twice`);
else ok("no duplicated Stripe sessions");

// ── Cross-partner isolation ─────────────────────────────────────────────────
section("Isolation — can one gym see another's material?");
const resources = await api<any[]>("pp_resources?select=id,partner_id,title,storage_path,pack");
for (const p of partners) {
  const visible = resources.filter((r) => r.partner_id === null || r.partner_id === p.id);
  const foreign = visible.filter((r) => r.partner_id !== null && r.partner_id !== p.id);
  if (foreign.length) fail(`${p.slug} can see ${foreign.length} resource(s) belonging to another gym`);
  const theirSales = sales.filter((s) => s.partner?.slug === p.slug);
  console.log(`  ok    ${p.slug.padEnd(14)} ${visible.length} resources · ${theirSales.length} sales`);
}

// ── Storage ─────────────────────────────────────────────────────────────────
section("Storage");
const buckets = await (await fetch(`${URL_BASE}/storage/v1/bucket`, { headers: H })).json();
const bucket = buckets.find((b: any) => b.name === "partner-resources");
if (!bucket) fail("partner-resources bucket missing");
else if (bucket.public) fail("partner-resources bucket is PUBLIC — links would never expire");
else ok("partner-resources bucket is private");

let missingFiles = 0;
for (const r of resources.filter((r) => r.storage_path)) {
  const res = await fetch(
    `${URL_BASE}/storage/v1/object/info/${"partner-resources"}/${encodeURI(r.storage_path)}`,
    { headers: H }
  );
  if (!res.ok) { missingFiles++; fail(`resource "${r.title}" has no file at ${r.storage_path}`); }
}
if (!missingFiles) ok(`all ${resources.filter((r) => r.storage_path).length} resource files exist in storage`);

const noContent = resources.filter((r) => !r.storage_path && !r.external_url);
if (noContent.length) fail(`${noContent.length} resource(s) with neither a file nor a link`);
else ok("every resource has a file or a link");

// ── Playbook ────────────────────────────────────────────────────────────────
section("Playbook");
const TYPES = ["social", "email", "script", "campaign", "idea"];
const dir = path.join(ROOT, "partner-playbook");
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
const counts: Record<string, number> = {};
const slugsSeen = new Set<string>();

for (const f of files) {
  const raw = readFileSync(path.join(dir, f), "utf8");
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) { fail(`${f}: no frontmatter`); continue; }
  const meta = Object.fromEntries(
    fm[1].split(/\r?\n/).map((l) => l.match(/^([a-z_]+):\s*(.*)$/i)).filter(Boolean).map((m) => [m![1], m![2].replace(/^["']|["']$/g, "")])
  );
  if (!meta.title) fail(`${f}: no title`);
  if (!TYPES.includes(meta.type)) fail(`${f}: type "${meta.type}" is not one the portal renders`);
  else counts[meta.type] = (counts[meta.type] ?? 0) + 1;
  const slug = f.replace(/\.md$/, "");
  if (slugsSeen.has(slug)) fail(`${f}: duplicate slug`);
  slugsSeen.add(slug);
  // We removed our own name from member-facing copy on purpose.
  const body = raw.slice(fm[0].length);
  const inCode = [...body.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]).join("\n");
  if (/PT Launch Lab/i.test(inCode)) fail(`${f}: names PT Launch Lab inside copy a member would read`);
}
ok(`${files.length} entries — ${TYPES.map((t) => `${counts[t] ?? 0} ${t}`).join(", ")}`);

const packs = new Set(resources.filter((r) => r.pack).map((r) => r.pack));
for (const p of packs) {
  if (!slugsSeen.has(p)) warn(`resources tagged pack "${p}" but no playbook entry has that slug — they won't show`);
}
if (!packs.size) warn("no resources are tagged to a campaign pack yet");

// ── Logins ──────────────────────────────────────────────────────────────────
section("Logins");
const users = await api<any[]>("pp_partner_users?select=id,email,partner:pp_partners(slug)");
ok(`${users.length} partner login(s)`);
for (const p of partners) {
  const mine = users.filter((u) => u.partner?.slug === p.slug);
  if (!mine.length) warn(`${p.slug}: no login yet`);
}

console.log(`\n${"─".repeat(60)}`);
console.log(fails ? `${fails} FAILURE(S), ${warns} warning(s)` : `PASS — 0 failures, ${warns} warning(s)`);
process.exit(fails ? 1 : 0);
