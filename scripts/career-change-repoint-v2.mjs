/**
 * Repoint the Career Change ad sets onto the custom conversion that actually
 * fires — by REBUILDING them, because Meta will not let you change it in place.
 *
 *   node --use-system-ca scripts/career-change-repoint-v2.mjs --token EAA... [--ads winners|all] [--confirm]
 *
 * WHY THIS SCRIPT EXISTS (and why the old one could never have worked)
 * -------------------------------------------------------------------
 * `career-change-fix-conversion.mjs` tried to POST a new `promoted_object` onto
 * the two live ad sets. Run 2026-09-10, Meta refused:
 *
 *   "Can't make edits to published ad set. You can't edit your pixel,
 *    conversion event, custom conversion or optimisation for an ad set after
 *    the ad set has been published. To run an ad set with your desired
 *    changes, create a new ad set."
 *
 * That is the same wall hit in July on the Book a Call conversion. The only
 * route is: create NEW ad sets with the right conversion set AT CREATION time,
 * copy the ads across, then pause the originals.
 *
 * WHAT IS BROKEN RIGHT NOW
 * ------------------------
 * Both ad sets optimise on custom conversion 1820186202748369, whose rule was
 * written with the keys `event.event_name` / `event.content_name`. Meta accepts
 * those keys and never matches anything, so it has NEVER fired. An ad set
 * optimising on an event with no history cannot leave the learning phase — both
 * have been LEARNING since 5 Sept and delivery has been degrading.
 * The replacement, 1385682013072444, uses the account's proven shape
 * ({"event":{"eq":"Lead"}} + {"url":{"i_contains":"/career-planner"}}) and has
 * fired. Rules are immutable, which is why this is a new conversion, not an edit.
 *
 * SAFETY
 * ------
 * - Dry run by default. Nothing is written without --confirm.
 * - Everything is created PAUSED. Creating these costs nothing.
 * - This script NEVER activates the new sets and NEVER pauses the old ones.
 *   That switch-over is one deliberate step, left to a human, because doing it
 *   wrong means two live copies and DOUBLE the daily spend (£55/day -> £110).
 * - It does not touch the old custom conversion. Do not archive it while any
 *   ad set still references it.
 *
 * --ads winners  (default) copies only C and D, the two creatives Meta actually
 *                spent on. Across 6-10 Sept, D took £152 of £195 and 7 of 8
 *                leads; C took £39 and 1; A, B and E took under £4 between them
 *                across both sets and produced nothing. New ad sets restart
 *                learning regardless, so this is the moment to stop paying to
 *                re-litigate a distribution Meta has already settled.
 * --ads all      copies all five, if you would rather re-test them.
 */

import { readFileSync } from 'node:fs';

const ACCOUNT = 'act_37869536';
const CAMPAIGN = '52568821923718';
const NEW_CONVERSION = '1385682013072444';
const OLD_CONVERSION = '1820186202748369';
const V = 'v21.0';

// name -> the live ad set it replaces
const SOURCES = [
  { id: '52568821959318', label: 'Broad GB' },
  { id: '52568821984118', label: 'Lookalike 1% email list' },
];

const WINNER_PREFIXES = ['C ', 'D '];

const argv = process.argv;
const arg = (flag, fallback = '') => {
  const i = argv.indexOf(flag);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const CONFIRM = argv.includes('--confirm');
const ADS_MODE = arg('--ads', 'winners');

const fromEnv = (k) => {
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split(/\r?\n/).find((x) => x.startsWith(k + '='));
    return line ? line.slice(k.length + 1).replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};
const TOKEN = arg('--token') || process.env.META_SYSTEM_USER_TOKEN || fromEnv('META_SYSTEM_USER_TOKEN');
if (!TOKEN) { console.error('No token. Pass --token EAA... or set META_SYSTEM_USER_TOKEN.'); process.exit(1); }

async function graph(path, params = {}, method = 'GET') {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const url = `https://graph.facebook.com/${V}/${path}`;
  const res = method === 'GET' ? await fetch(`${url}?${body}`) : await fetch(url, { method, body });
  const json = await res.json();
  if (json.error) {
    const e = json.error;
    throw new Error(`${method} ${path}: ${e.error_user_title || ''} ${e.error_user_msg || e.message}`);
  }
  return json;
}

const money = (pence) => `£${(Number(pence) / 100).toFixed(2)}`;

async function main() {
  console.log(`\n  ${CONFIRM ? 'LIVE RUN' : 'DRY RUN — nothing will be written'}   ads=${ADS_MODE}\n`);

  const target = await graph(NEW_CONVERSION, { fields: 'name,rule,last_fired_time' });
  if (!target.last_fired_time) {
    console.error(`  REFUSING: target conversion ${NEW_CONVERSION} has never fired. Repointing onto a second dead event would repeat the original fault.`);
    process.exit(1);
  }
  console.log(`  Target conversion: ${target.name}`);
  console.log(`    rule       ${target.rule}`);
  console.log(`    last fired ${target.last_fired_time}\n`);

  const created = [];

  for (const src of SOURCES) {
    const s = await graph(src.id, {
      fields: 'name,daily_budget,billing_event,optimization_goal,bid_strategy,attribution_spec,targeting,pacing_type,promoted_object,effective_status',
    });

    if (s.promoted_object?.custom_conversion_id !== OLD_CONVERSION) {
      console.log(`  SKIP ${s.name} — already on ${s.promoted_object?.custom_conversion_id}, not the dead one.\n`);
      continue;
    }

    const ads = (await graph(`${src.id}/ads`, { fields: 'id,name,effective_status', limit: '50' })).data || [];
    const chosen = ADS_MODE === 'all'
      ? ads
      : ads.filter((a) => WINNER_PREFIXES.some((p) => a.name.startsWith(p)));

    const newName = `${s.name} · v2`;
    console.log(`  ${s.name}`);
    console.log(`    -> create "${newName}"  ${money(s.daily_budget)}/day  PAUSED  conversion ${NEW_CONVERSION}`);
    console.log(`    -> copy ${chosen.length} of ${ads.length} ads: ${chosen.map((a) => a.name.split(' ')[0]).join(', ') || '(none)'}`);

    if (!CONFIRM) { console.log(''); continue; }

    const adset = await graph(`${ACCOUNT}/adsets`, {
      name: newName,
      campaign_id: CAMPAIGN,
      daily_budget: String(s.daily_budget),
      billing_event: s.billing_event,
      optimization_goal: s.optimization_goal,
      bid_strategy: s.bid_strategy,
      attribution_spec: JSON.stringify(s.attribution_spec),
      targeting: JSON.stringify(s.targeting),
      pacing_type: JSON.stringify(s.pacing_type),
      promoted_object: JSON.stringify({ custom_conversion_id: NEW_CONVERSION }),
      status: 'PAUSED',
    }, 'POST');

    const check = await graph(adset.id, { fields: 'name,promoted_object,effective_status,daily_budget' });
    const ok = check.promoted_object?.custom_conversion_id === NEW_CONVERSION;
    console.log(`    ${ok ? 'ok ' : 'NO '} ${adset.id}  ${check.effective_status}  conversion ${check.promoted_object?.custom_conversion_id}`);
    if (!ok) { console.error('    promoted_object did not take — stopping before copying ads.'); process.exit(1); }

    for (const ad of chosen) {
      const copy = await graph(`${ad.id}/copies`, {
        adset_id: adset.id,
        status_option: 'PAUSED',
      }, 'POST');
      console.log(`       copied ${ad.name.slice(0, 34).padEnd(34)} -> ${copy.copied_ad_id || copy.id}`);
    }

    created.push({ old: src.id, oldName: s.name, new: adset.id, newName, budget: s.daily_budget });
    console.log('');
  }

  if (!CONFIRM) {
    console.log('  Re-run with --confirm to create these, PAUSED.\n');
    return;
  }

  console.log('\n  Created, all PAUSED. Nothing is spending yet.\n');
  console.log('  SWITCH-OVER — do these two together, or you will pay twice:\n');
  for (const c of created) {
    console.log(`    activate ${c.new}   (${c.newName}, ${money(c.budget)}/day)`);
    console.log(`    pause    ${c.old}   (${c.oldName})`);
  }
  console.log(`\n  Only after both old sets are paused: archive the dead conversion ${OLD_CONVERSION}.`);
  console.log('  Expect the new sets to re-enter the learning phase. They were stuck in it anyway.\n');
}

main().catch((e) => { console.error(`\n  FAILED: ${e.message}\n`); process.exit(1); });
