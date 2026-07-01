#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// meta-audiences.mjs — build Meta Custom Audience files (and optionally push
// them) from PT Launch Lab's customer + email sources.
//
// WS1 blockers #1/#2 of the ads Growth OS: get the past-customer list and the
// full email list onto Meta so we can (a) retarget them and (b) build a
// value-based 1% lookalike of people who actually paid.
//
// SOURCES
//   file        <path.csv>   normalise/hash an existing CSV export (auto-detects
//                            columns: email, phone, first/last/full name, country…)
//   mailerlite  [--group=ID] pull subscribers from the MailerLite Connect API
//   stripe                   pull paying customers from the Stripe API
//
// OUTPUT (always written to meta-audiences/):
//   By default emits a NORMALISED-RAW csv (email,phone,fn,ln,country). Upload
//   this in Ads Manager → Audiences → Custom Audience → Customer list; Meta does
//   the canonical hashing + matching. This is the simplest, highest-match route
//   and needs no Meta token.
//   With --hash it emits SHA-256-hashed values instead (for sharing / API use).
//
// OPTIONAL DIRECT PUSH (needs a token with ads_management):
//   --push --name="PTLL · Buyers (all-time)" --account=act_37869536 \
//          --token=EAA...   (or META_AD_ACCOUNT_ID / META_ACCESS_TOKEN env)
//   Creates the Custom Audience if missing (idempotent by name) and adds the
//   users in hashed batches. Values are always hashed for the API regardless of
//   --hash.
//
// Windows TLS note: Node fetch fails cert validation on Callum's network — run
// every command with:  node --use-system-ca scripts/meta-audiences.mjs ...
//
// Examples
//   node --use-system-ca scripts/meta-audiences.mjs file meta-audiences/ptll-buyers-stripe-2026-05-29.csv
//   MAILERLITE_TOKEN=... node --use-system-ca scripts/meta-audiences.mjs mailerlite --out=meta-audiences/ptll-email-list.csv
//   STRIPE_SECRET_KEY=sk_live_... node --use-system-ca scripts/meta-audiences.mjs stripe
//   ... any of the above with:  --push --name="PTLL · Buyers" --account=act_37869536 --token=EAA...
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const GRAPH = 'https://graph.facebook.com/v21.0';
const OUT_DIR = 'meta-audiences';

// ── args ─────────────────────────────────────────────────────────────────────
const [, , cmd, ...rest] = process.argv;
const positional = rest.filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(
  rest
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...v] = a.replace(/^--/, '').split('=');
      return [k, v.length ? v.join('=') : true];
    }),
);

const doHash = !!flags.hash || !!flags.push;
const doPush = !!flags.push;

function die(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

// ── normalisation (Meta advanced-matching spec) ──────────────────────────────
const normEmail = (v) => (v || '').trim().toLowerCase();

function normPhone(v) {
  let d = (v || '').replace(/\D/g, '');
  if (!d) return '';
  // UK local → E.164 digits (no +). 07xxxxxxxxx → 447xxxxxxxxx, 01977… → 441977…
  if (d.startsWith('0') && (d.length === 11 || d.length === 10)) d = '44' + d.slice(1);
  return d;
}

const normName = (v) =>
  (v || '')
    .trim()
    .toLowerCase()
    .replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, '') // drop titles
    .replace(/[^a-zÀ-ɏ' -]/g, '')          // letters/space/hyphen/apostrophe
    .trim();

function normCountry(v) {
  const s = (v || '').trim().toLowerCase();
  if (!s) return 'gb';
  const map = { uk: 'gb', 'united kingdom': 'gb', 'great britain': 'gb', england: 'gb', gb: 'gb' };
  return map[s] || (s.length === 2 ? s : 'gb');
}

const sha256 = (v) => (v ? crypto.createHash('sha256').update(v).digest('hex') : '');

// ── tiny CSV parse/serialise (handles quotes + commas) ───────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// map many possible source header names → our canonical field
const HEADER_ALIASES = {
  email: ['email', 'email address', 'e-mail', 'customer email', 'billing email'],
  phone: ['phone', 'phone number', 'mobile', 'telephone', 'billing phone'],
  first: ['first name', 'firstname', 'fn', 'given name'],
  last: ['last name', 'lastname', 'ln', 'surname', 'family name'],
  full: ['name', 'full name', 'fullname', 'customer name', 'learner name'],
  country: ['country', 'country code', 'billing country'],
};

function detectCols(header) {
  const lower = header.map((h) => h.trim().toLowerCase());
  const find = (aliases) => {
    for (const a of aliases) {
      const idx = lower.indexOf(a);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return Object.fromEntries(Object.entries(HEADER_ALIASES).map(([k, a]) => [k, find(a)]));
}

// ── build canonical records {email,phone,fn,ln,country} from raw rows ─────────
function toRecords(rows) {
  if (!rows.length) return [];
  const cols = detectCols(rows[0]);
  if (cols.email === -1) die('No email column found in the source (need at least an email).');
  const out = [];
  const seen = new Set();
  for (const r of rows.slice(1)) {
    const email = normEmail(r[cols.email]);
    if (!email || !email.includes('@')) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    let fn = '', ln = '';
    if (cols.first !== -1) fn = normName(r[cols.first]);
    if (cols.last !== -1) ln = normName(r[cols.last]);
    if (!fn && !ln && cols.full !== -1) {
      const parts = normName(r[cols.full]).split(/\s+/);
      fn = parts[0] || '';
      ln = parts.slice(1).join(' ') || '';
    }
    out.push({
      email,
      phone: cols.phone !== -1 ? normPhone(r[cols.phone]) : '',
      fn,
      ln,
      country: cols.country !== -1 ? normCountry(r[cols.country]) : 'gb',
    });
  }
  return out;
}

// ── writers ──────────────────────────────────────────────────────────────────
function writeCsv(records, outPath) {
  const header = ['email', 'phone', 'fn', 'ln', 'country'];
  const lines = [header.join(',')];
  for (const r of records) {
    const vals = doHash
      ? [sha256(r.email), sha256(r.phone), sha256(r.fn), sha256(r.ln), sha256(r.country)]
      : [r.email, r.phone, r.fn, r.ln, r.country];
    lines.push(vals.map((v) => csvCell(v || '')).join(','));
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  const withPhone = records.filter((r) => r.phone).length;
  const withName = records.filter((r) => r.fn || r.ln).length;
  console.log(`✔ Wrote ${records.length} contacts → ${outPath}`);
  console.log(`  ${doHash ? 'SHA-256 hashed' : 'normalised raw'} · ${withPhone} with phone · ${withName} with name`);
  if (!doHash) console.log('  → Upload in Ads Manager (Audiences → Custom Audience → Customer list). Meta hashes on import.');
  return records;
}

// ── source: MailerLite Connect API (paginated) ───────────────────────────────
async function fromMailerlite() {
  const token = process.env.MAILERLITE_TOKEN || flags.token;
  if (!token) die('MAILERLITE_TOKEN not set (or pass --token=).');
  const group = flags.group ? `&filter[group]=${encodeURIComponent(flags.group)}` : '';
  const records = [];
  let cursor = '';
  let page = 0;
  for (;;) {
    const url = `https://connect.mailerlite.com/api/subscribers?limit=1000${group}${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (!res.ok) die(`MailerLite ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    for (const s of json.data || []) {
      const email = normEmail(s.email);
      if (!email || s.status === 'unsubscribed' || s.status === 'bounced' || s.status === 'junk') continue;
      const name = normName(s.fields?.name || s.fields?.first_name || '');
      const parts = name.split(/\s+/);
      records.push({
        email,
        phone: normPhone(s.fields?.phone || ''),
        fn: s.fields?.first_name ? normName(s.fields.first_name) : parts[0] || '',
        ln: s.fields?.last_name ? normName(s.fields.last_name) : parts.slice(1).join(' ') || '',
        country: normCountry(s.fields?.country || ''),
      });
    }
    page++;
    console.log(`  …MailerLite page ${page}: ${records.length} so far`);
    cursor = json.meta?.next_cursor || '';
    if (!cursor) break;
  }
  // de-dupe by email
  const seen = new Set();
  return records.filter((r) => (seen.has(r.email) ? false : seen.add(r.email)));
}

// ── source: Stripe API — PTLL COURSE buyers only ─────────────────────────────
// This Stripe account also processes Ultimate Shred gym memberships, so we do
// NOT pull the raw customer list (that would mix gym members into the audience).
// Instead we list paid Checkout Sessions and keep only PTLL course amounts:
//   599 (deposit) · 1399 (PIF promo) · 1599 (PIF standard).
// Override with --amounts=599,1399,1599 if a partner uses custom course pricing.
async function fromStripe() {
  const key = process.env.STRIPE_SECRET_KEY || flags.token;
  if (!key) die('STRIPE_SECRET_KEY not set (or pass --token=).');
  const courseAmounts = new Set(
    (flags.amounts ? String(flags.amounts).split(',') : ['599', '1399', '1599']).map((n) => Math.round(Number(n) * 100)),
  );
  const records = [];
  let seen = 0, kept = 0, gym = 0;
  let startingAfter = '';
  for (;;) {
    const url = `https://api.stripe.com/v1/checkout/sessions?limit=100${startingAfter ? `&starting_after=${startingAfter}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) die(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    for (const s of json.data || []) {
      seen++;
      if (s.payment_status !== 'paid') continue;
      if (!courseAmounts.has(s.amount_total)) { gym++; continue; } // gym / non-course
      const cd = s.customer_details || {};
      const email = normEmail(cd.email || s.customer_email);
      if (!email) continue;
      const parts = normName(cd.name || '').split(/\s+/);
      records.push({
        email,
        phone: normPhone(cd.phone || ''),
        fn: parts[0] || '',
        ln: parts.slice(1).join(' ') || '',
        country: normCountry(cd.address?.country || ''),
      });
      kept++;
    }
    console.log(`  …Stripe: scanned ${seen} sessions, ${kept} course sales kept, ${gym} non-course skipped`);
    if (!json.has_more || !json.data?.length) break;
    startingAfter = json.data[json.data.length - 1].id;
  }
  const uniq = new Set();
  return records.filter((r) => (uniq.has(r.email) ? false : uniq.add(r.email)));
}

// ── optional: push to Meta as a Custom Audience (idempotent by name) ──────────
async function pushToMeta(records) {
  const token = flags.token || process.env.META_ACCESS_TOKEN;
  const account = (flags.account || process.env.META_AD_ACCOUNT_ID || 'act_37869536').toString();
  const name = flags.name;
  if (!token) die('--push needs a token with ads_management (--token= or META_ACCESS_TOKEN).');
  if (!name) die('--push needs --name="Audience name".');

  // find existing by name
  let audienceId = '';
  const listRes = await fetch(`${GRAPH}/${account}/customaudiences?fields=id,name&limit=500&access_token=${token}`);
  const list = await listRes.json();
  if (list.error) die(`Meta list error: ${list.error.message}`);
  const existing = (list.data || []).find((a) => a.name === name);
  if (existing) {
    audienceId = existing.id;
    console.log(`  ↺ Reusing existing audience "${name}" (${audienceId})`);
  } else {
    const createRes = await fetch(`${GRAPH}/${account}/customaudiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        subtype: 'CUSTOM',
        description: 'Built by meta-audiences.mjs',
        customer_file_source: 'USER_PROVIDED_ONLY',
        access_token: token,
      }),
    });
    const created = await createRes.json();
    if (created.error) die(`Meta create error: ${created.error.message}`);
    audienceId = created.id;
    console.log(`  ＋ Created audience "${name}" (${audienceId})`);
  }

  const schema = ['EMAIL', 'PHONE', 'FN', 'LN', 'COUNTRY'];
  const rows = records.map((r) => [sha256(r.email), sha256(r.phone), sha256(r.fn), sha256(r.ln), sha256(r.country)]);
  const BATCH = 8000;
  let added = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const data = rows.slice(i, i + BATCH);
    const res = await fetch(`${GRAPH}/${audienceId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { schema, data }, access_token: token }),
    });
    const json = await res.json();
    if (json.error) die(`Meta users error: ${json.error.message}`);
    added += json.num_received ?? data.length;
    console.log(`  ⇧ batch ${i / BATCH + 1}: +${data.length} (received ${json.num_received ?? '?'})`);
  }
  console.log(`✔ Pushed ${added} hashed contacts to "${name}" (${audienceId}). Match rate populates in ~30–60 min.`);
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  let records;
  if (cmd === 'file') {
    const src = positional[0];
    if (!src || !fs.existsSync(src)) die('Usage: file <path.csv>');
    records = toRecords(parseCsv(fs.readFileSync(src, 'utf8')));
  } else if (cmd === 'mailerlite') {
    records = await fromMailerlite();
  } else if (cmd === 'stripe') {
    records = await fromStripe();
  } else {
    console.log(`meta-audiences.mjs — build Meta Custom Audience files

  file <path.csv>        normalise an existing CSV export
  mailerlite [--group=]  pull the email list from MailerLite
  stripe                 pull paying customers from Stripe

  --hash                 output SHA-256 hashed values
  --out=<path>           output file (default meta-audiences/<cmd>-<date>.csv)
  --push --name="…" --account=act_37869536 --token=EAA…   create/fill the audience via API

  Windows: prefix with  node --use-system-ca  (TLS).`);
    process.exit(cmd ? 1 : 0);
  }

  if (!records.length) die('No usable contacts found.');

  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = flags.out || path.join(OUT_DIR, `ptll-${cmd}-${stamp}.csv`);
  writeCsv(records, outPath);

  if (doPush) await pushToMeta(records);
})();
