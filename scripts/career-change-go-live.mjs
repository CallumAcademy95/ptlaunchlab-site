/**
 * Switch the Career Change campaign on.
 *
 *   node scripts/career-change-go-live.mjs [--spend-cap-gbp 2300] [--token EAA...]
 *
 * Order matters: ads first, then ad sets, then the campaign, so nothing is
 * live at a level whose children are still paused. Re-reads status after
 * each level and stops on the first thing that does not report ACTIVE.
 * The account spend cap is only touched when --spend-cap-gbp is passed
 * explicitly, because it is a money decision.
 *
 * Reads META_SYSTEM_USER_TOKEN from the environment or .env.local.
 */
import { readFileSync } from 'node:fs';

const ACCT = 'act_37869536';
const CAMPAIGN = '52568821923718';
const V = 'v21.0';

const fromEnv = (k) => {
  try {
    const l = readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/).find((x) => x.startsWith(k + '='));
    return l ? l.slice(k.length + 1).replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};
const tokArg = process.argv.indexOf('--token');
const TOKEN = (tokArg > -1 && process.argv[tokArg + 1]) || process.env.META_SYSTEM_USER_TOKEN || fromEnv('META_SYSTEM_USER_TOKEN');
if (!TOKEN) { console.error('no META_SYSTEM_USER_TOKEN'); process.exit(1); }

const capArg = process.argv.indexOf('--spend-cap-gbp');
const capGbp = capArg > -1 ? Number(process.argv[capArg + 1]) : null;

const graph = async (path, params = {}, method = 'GET') => {
  const u = new URL(`https://graph.facebook.com/${V}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = method === 'GET'
    ? await fetch(`${u}?${body}`)
    : await fetch(u, { method, body });
  const j = await res.json();
  if (j.error) throw new Error(`${path}: ${j.error.error_user_title || ''} ${j.error.error_user_msg || j.error.message}`);
  return j;
};
const list = async (path) => (await graph(path, { fields: 'id,name,status,effective_status', limit: 100 })).data;

if (capGbp) {
  const before = await graph(ACCT, { fields: 'spend_cap,amount_spent' });
  // Asymmetric units: the account READS spend_cap back in minor units (pence)
  // but the WRITE takes major units (pounds). Sending pence here set the cap
  // to £230,000 on 2026-09-06; it was corrected by hand within the minute.
  await graph(ACCT, { spend_cap: String(Math.round(capGbp)) }, 'POST');
  const check = await graph(ACCT, { fields: 'spend_cap' });
  if (Math.round(check.spend_cap / 100) !== Math.round(capGbp)) {
    console.error(`spend cap read back as £${check.spend_cap / 100}, expected £${capGbp} — fix it in Ads Manager before going on.`);
    process.exit(1);
  }
  const after = await graph(ACCT, { fields: 'spend_cap,amount_spent' });
  console.log(`spend cap £${before.spend_cap / 100} → £${after.spend_cap / 100} (spent £${after.amount_spent / 100})`);
}

const adsets = await list(`${CAMPAIGN}/adsets`);
const ads = (await Promise.all(adsets.map((s) => list(`${s.id}/ads`)))).flat();

const activate = async (label, items) => {
  for (const it of items) await graph(it.id, { status: 'ACTIVE' }, 'POST');
  const after = await Promise.all(items.map((it) => graph(it.id, { fields: 'id,name,status,effective_status' })));
  for (const a of after) console.log(`  ${label.padEnd(8)} ${a.name.slice(0, 44).padEnd(44)} ${a.status} / ${a.effective_status}`);
  const bad = after.filter((a) => a.status !== 'ACTIVE');
  if (bad.length) { console.error(`\n${bad.length} ${label}(s) did not activate — stopping here.`); process.exit(1); }
};

console.log(`\nActivating ${ads.length} ads, ${adsets.length} ad sets, 1 campaign\n`);
await activate('ad', ads);
await activate('ad set', adsets);
await activate('campaign', [await graph(CAMPAIGN, { fields: 'id,name,status,effective_status' })]);

const acct = await graph(ACCT, { fields: 'spend_cap,amount_spent' });
const daily = (await graph(`${CAMPAIGN}/adsets`, { fields: 'daily_budget' })).data.reduce((n, s) => n + Number(s.daily_budget || 0), 0) / 100;
console.log(`\nLive. £${daily}/day across the campaign · cap headroom £${((acct.spend_cap - acct.amount_spent) / 100).toFixed(2)}\n`);
