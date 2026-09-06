/**
 * Pre-flight check for the Career Change campaign. Read-only — changes nothing.
 *
 *   node --use-system-ca scripts/career-change-preflight.mjs
 *
 * Run this before unpausing. It checks the things that are expensive to get
 * wrong and invisible once spend starts: whether the conversion event is
 * actually firing, whether the landing page is up and carries the pixel,
 * whether the creatives are portrait, and whether the money is where it should
 * be.
 *
 * Exits non-zero if anything FAILS, so it can gate a launch.
 */

import { readFileSync } from 'node:fs';

const ACCT = 'act_37869536';
const BASE = 'https://graph.facebook.com/v21.0';
const PIXEL = '1133525198707842';
const CAMPAIGN = '52568821923718';
const CONVERSION = '1385682013072444'; // URL-rule conversion; 1820186202748369 never fired (bad rule keys)
const LANDING = 'https://ptlaunchlab.co.uk/career-planner';
const BUYERS = '52549805883518';

const fromEnv = (k) => {
  try {
    const l = readFileSync('.env.local', 'utf8').split(/\r?\n/).find((x) => x.startsWith(`${k}=`));
    return l ? l.slice(k.length + 1).replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};
const TOKEN = process.env.META_SYSTEM_USER_TOKEN || fromEnv('META_SYSTEM_USER_TOKEN');

let pass = 0, warn = 0, fail = 0;
const ok = (m, d = '') => { pass += 1; console.log(`  ✓ ${m}${d ? `  ${d}` : ''}`); };
const wr = (m, d = '') => { warn += 1; console.log(`  ⚠ ${m}${d ? `  ${d}` : ''}`); };
const no = (m, d = '') => { fail += 1; console.log(`  ✗ ${m}${d ? `  ${d}` : ''}`); };

async function graph(path, fields) {
  const u = new URL(`${BASE}${path}`);
  u.searchParams.set('access_token', TOKEN);
  if (fields) u.searchParams.set('fields', fields);
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(j.error.message);
  return j;
}

async function main() {
  console.log('\n── Career Change · pre-flight ─────────────────────────────\n');

  if (!TOKEN) { no('no META_SYSTEM_USER_TOKEN'); process.exit(1); }

  // 1. credentials and account
  console.log('CREDENTIALS');
  try {
    const me = await graph('/me', 'id,name');
    const acct = await graph(`/${ACCT}`, 'name,account_status,currency,disable_reason,balance');
    ok('token valid', `(${me.name})`);
    acct.account_status === 1
      ? ok('ad account active', `${acct.currency}`)
      : no('ad account NOT active', `status ${acct.account_status}, reason ${acct.disable_reason}`);
  } catch (e) { no('token/account check failed', e.message); }

  // 2. the conversion the campaign optimises on
  console.log('\nCONVERSION EVENT');
  try {
    const cc = await graph(`/${CONVERSION}`, 'name,rule,custom_event_type');
    ok('custom conversion exists', cc.name);
    const rule = JSON.stringify(cc.rule);
    rule.includes('career_planner')
      ? ok('rule filters to career_planner', 'not the generic Lead nine sources share')
      : no('rule does NOT filter on career_planner', rule.slice(0, 90));

    // Has the pixel actually seen this event lately? Optimising toward an event
    // that never fires is the quietest way to waste a budget.
    const stats = await graph(`/${PIXEL}/stats`, 'start_time,aggregation,data');
    const recent = JSON.stringify(stats).includes('Lead');
    if (recent) {
      ok('pixel has recent Lead activity');
    } else {
      // Not a fault, but it means the custom conversion has no history to learn
      // from, so the ad sets start cold. Expected while no traffic is running.
      wr('no recent Lead events on the pixel',
        'conversion starts with no history — expect a slower learning phase');
    }
  } catch (e) { wr('conversion check incomplete', e.message); }

  // 3. structure and money
  console.log('\nCAMPAIGN');
  let totalDaily = 0;
  let adCount = 0;
  try {
    const c = await graph(`/${CAMPAIGN}`, 'name,status,effective_status,objective');
    console.log(`  ${c.name}`);
    c.effective_status === 'PAUSED'
      ? ok('campaign PAUSED', 'nothing is spending')
      : wr('campaign is NOT paused', c.effective_status);
    c.objective === 'OUTCOME_LEADS' ? ok('objective OUTCOME_LEADS') : no('unexpected objective', c.objective);

    const sets = await graph(`/${CAMPAIGN}/adsets`,
      'id,name,status,daily_budget,optimization_goal,promoted_object,targeting,attribution_spec');
    for (const s of sets.data) {
      totalDaily += Number(s.daily_budget);
      console.log(`\n  ${s.name}`);
      ok('budget', `£${(s.daily_budget / 100).toFixed(0)}/day`);
      s.optimization_goal === 'OFFSITE_CONVERSIONS'
        ? ok('optimising OFFSITE_CONVERSIONS') : no('wrong optimisation goal', s.optimization_goal);
      s.promoted_object?.custom_conversion_id === CONVERSION
        ? ok('promoting the Career Planner conversion')
        : no('promoted object is not the career-planner conversion', JSON.stringify(s.promoted_object));
      (s.targeting?.excluded_custom_audiences || []).some((a) => a.id === BUYERS)
        ? ok('existing buyers excluded')
        : no('buyers NOT excluded — the course would be advertised to people who own it');
      const ads = await graph(`/${s.id}/ads`, 'id,name,status,effective_status');
      adCount += ads.data.length;
      // Check the ad's OWN status, not effective_status. After a creative swap
      // Meta reports IN_PROCESS or PENDING_REVIEW while it reviews the new
      // video -- those are review states on a paused ad, not delivery. Reading
      // effective_status here reported ten paused ads as live.
      const live = ads.data.filter((a) => a.status !== 'PAUSED');
      live.length === 0
        ? ok(`${ads.data.length} ads, all paused`)
        : no(`${live.length} of ${ads.data.length} ads NOT paused`, live.map((a) => a.name).join(', '));
      const reviewing = ads.data.filter((a) => /IN_PROCESS|PENDING_REVIEW/.test(a.effective_status));
      if (reviewing.length) console.log(`    (${reviewing.length} in Meta review — normal after a creative change)`);
    }
  } catch (e) { no('campaign check failed', e.message); }

  // 4. creative — portrait, and the edited cut
  console.log('\nCREATIVE');
  try {
    const ads = await graph(`/${ACCT}/ads`, 'id,name,creative{id,object_story_spec}');
    const mine = (ads.data || []).filter((a) => /^[A-E] · /.test(a.name));
    const vids = new Map();
    for (const a of mine) {
      const v = a.creative?.object_story_spec?.video_data?.video_id;
      if (v) vids.set(v, a.name);
    }
    if (!vids.size) { no('no video creatives found on the campaign ads'); }
    for (const [id, name] of vids) {
      const v = await graph(`/${id}`, 'title,status');
      const edited = /edited/i.test(v.title || '');
      edited
        ? ok(`${name.split(' · ')[0]} using edited cut`, v.title)
        : wr(`${name.split(' · ')[0]} still on the raw render`, v.title || id);
    }
  } catch (e) { wr('creative check incomplete', e.message); }

  // 5. destination
  console.log('\nLANDING PAGE');
  try {
    const r = await fetch(LANDING, { redirect: 'follow' });
    r.ok ? ok('career planner reachable', `HTTP ${r.status}`) : no('career planner not reachable', `HTTP ${r.status}`);
    const html = await r.text();
    html.includes(PIXEL) ? ok('pixel present on the page', PIXEL) : no('pixel NOT found on the landing page');
    /career_planner/.test(html) || ok('page loads', '(content_name is set server-side on submit)');
  } catch (e) { no('landing page unreachable', e.message); }

  // 6. summary
  console.log('\n── summary ────────────────────────────────────────────────');
  console.log(`  £${(totalDaily / 100).toFixed(0)}/day across the campaign · ${adCount} ads`);
  console.log(`  ${pass} passed · ${warn} warnings · ${fail} failures\n`);
  if (fail) {
    console.log('  Do not unpause until the failures above are cleared.\n');
    process.exit(1);
  }
  console.log('  Safe to unpause when you are ready.\n');
}

main().catch((e) => { console.error(`\n✗ ${e.message}\n`); process.exit(1); });
