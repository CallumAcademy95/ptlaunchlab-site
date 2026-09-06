/**
 * Builds the Career Change cold acquisition campaign, PAUSED.
 *
 *   node --use-system-ca scripts/career-change-campaign.mjs            # dry run
 *   node --use-system-ca scripts/career-change-campaign.mjs --execute  # create
 *
 * Needs META_SYSTEM_USER_TOKEN (or META_ACCESS_TOKEN) with ads_management.
 * Everything is created PAUSED. Nothing here starts spending; a human presses go.
 *
 * Idempotent by name at every level, so a half-finished run can be repeated
 * safely — it adopts what already exists rather than making a second copy.
 *
 * The one thing this fixes that matters more than the campaign itself: cold is
 * optimised on a custom conversion filtered to `content_name = career_planner`,
 * NOT the generic Lead event. Nine sources fire Lead on this site, two of which
 * are actively wrong to chase -- `gym_partnership` is B2B, and the quiz's
 * `alreadyQualified` result is somebody who already holds the qualification and
 * cannot buy the course. Optimising on raw Lead pays Meta to find them.
 */

import { readFileSync } from 'node:fs';

// ─── config ─────────────────────────────────────────────────────────────────
const CONFIG = {
  campaignName: 'PTLL · Career Change — Cold 2026-09',
  pixelId: '1133525198707842',
  landing: 'https://ptlaunchlab.co.uk/career-planner',

  conversion: {
    name: 'Career Planner Lead',
    customEventType: 'LEAD',
    // Single-value whitelist is correct HERE because this campaign's entire job
    // is career-planner opt-ins. Do not copy this shape for a general "clean
    // Lead" conversion: as an exclusion it must enumerate the junk, or every
    // lead source added later silently drops out of it.
    // Rule keys are `event` and `url` (or a bare custom-data key), NOT
    // `event.event_name` / `event.content_name`. Meta accepts the dotted keys
    // and silently never matches: the first build's conversion sat at zero
    // for a day of live spend. Rules are immutable once created, so get this
    // right first time or you are creating a replacement and repointing.
    rule: {
      and: [
        { event: { eq: 'Lead' } },
        { url: { i_contains: '/career-planner' } },
      ],
    },
  },

  // Buyers, excluded everywhere: never advertise the course to people who own it.
  excludeAudienceId: '52549805883518',
  lookalikeId: '52550445633718',

  adSets: [
    {
      name: 'Cold · Broad GB · Career Planner Lead',
      dailyBudgetPence: 4000,
      // No interests on purpose. Under Andromeda the creative does the
      // targeting, and interest stacking now mostly shrinks the pool Meta has
      // to work with.
      // No age_max. With Advantage+ audience on, Meta treats age as a
      // suggestion and rejects a hard upper bound outright. That is the right
      // trade here anyway: the career-changer is defined by circumstance rather
      // than age, and capping at 48 would have excluded the returner avatar.
      targeting: {
        geo_locations: { countries: ['GB'] },
        age_min: 25,
        targeting_automation: { advantage_audience: 1 },
      },
    },
    {
      name: 'Cold · Lookalike 1% email list · Career Planner Lead',
      dailyBudgetPence: 1500,
      // advantage_audience 0 on purpose: the whole reason this ad set exists is
      // to test the lookalike against broad. Letting Meta expand past it would
      // blur the two together and there would be nothing to read.
      targeting: {
        geo_locations: { countries: ['GB'] },
        age_min: 25,
        age_max: 48,
        custom_audiences: [{ id: '52550445633718' }],
        targeting_automation: { advantage_audience: 0 },
      },
    },
  ],

  // Copy lives in one place so a rewrite never means touching the API calls.
  ads: [
    {
      name: 'A · Six in the morning',
      headline: 'Train around the job you’ve got',
      description: 'Fully online. NCFE accredited.',
      video: 'ad-01-fifteen',
      body: `Six in the morning. Again.

Shifts. Or a nine to five that's going nowhere. And no real passion in any of it.

If fitness is the thing you actually care about, there's a route into it that doesn't involve handing your notice in on Monday.

Our Level 3 Personal Trainer course is fully online and NCFE accredited. Eight to sixteen weeks, at your pace, around the job you've already got. You don't stop earning to retrain.

And it wasn't put together by people who've only read about the industry. It was built by gym owners who've hired over five hundred trainers — so it teaches what gyms are actually looking for, not just what gets you through an exam.

Take two minutes and find out which route fits you.`,
    },
    {
      name: 'B · We do the hiring',
      headline: 'Built by gym owners who hire',
      description: 'The qualification we’d hire from',
      video: 'ad-04-we-do-the-hiring',
      body: `Most fitness course companies will tell you they train personal trainers.

We hire them.

We run gyms. We've read hundreds of applications, and a certificate on its own has never once told us whether somebody can actually coach a session.

So we built the qualification from the other side of the desk. The one we'd hire from.

NCFE accredited, fully online, eight to sixteen weeks around your current job — taught by people who've hired over five hundred trainers and know exactly what a gym is looking for when it reads your name.

Find out where you'd start.`,
    },
    {
      name: 'C · Three hundred quid',
      headline: 'A proper route into fitness',
      description: 'NCFE accredited. 8–16 weeks.',
      video: 'ad-03-three-hundred-quid',
      body: `A three hundred quid PT certificate off the internet is, technically, a certificate.

It just isn't the thing a gym is asking for.

There's a difference between something that says you're qualified and a qualification that's actually accredited, actually assessed, and actually recognised by the places you want to work.

Ours is NCFE accredited. Fully online, eight to sixteen weeks, at your own pace and around the job you've already got.

Built by gym owners who've hired over five hundred trainers.

Two minutes to see which route fits you.`,
    },
    {
      name: 'D · Which route',
      headline: 'Which fitness route fits you?',
      description: 'Free 2-minute career planner',
      video: 'ad-09-which-route',
      body: `Want to work in fitness but not sure where you'd actually start?

Personal trainer. Fitness coach. Gym instructor. They're not the same job, they don't suit the same people, and picking the course before you've picked the route is how people end up qualified in the wrong thing.

So start with the route.

Answer a few quick questions — where you are now, what hours you can give it, what you actually want out of it — and we'll show you which way in makes sense for you. It takes about two minutes and there's nothing to pay.

Your next step gets a lot clearer.`,
    },
    {
      name: 'E · Around the job',
      headline: 'Don’t quit your job to retrain',
      description: 'Fully online, at your pace',
      video: 'ad-02-around-the-job',
      body: `"I haven't got time to retrain."

Good. Don't quit your job.

The course is fully online, so it goes around the work you're already doing — evenings, weekends, whenever you've actually got an hour. Eight to sixteen weeks at your own pace, and nobody is asking you to choose between the two.

NCFE accredited, and built by gym owners who've hired over five hundred trainers.

Keep the job. Work towards something better at the same time.`,
    },
  ],
};

// ─── plumbing ───────────────────────────────────────────────────────────────
const BASE = 'https://graph.facebook.com/v21.0';
const ACCT = 'act_37869536';

const fromEnvFile = (key) => {
  try {
    const env = readFileSync('.env.local', 'utf8');
    const line = env.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};

const TOKEN =
  process.env.META_SYSTEM_USER_TOKEN ||
  process.env.META_ACCESS_TOKEN ||
  fromEnvFile('META_SYSTEM_USER_TOKEN');
const PAGE = process.env.META_PAGE_ID || fromEnvFile('META_PAGE_ID') || '798389646699303';
const EXECUTE = process.argv.includes('--execute');

if (!TOKEN) {
  console.error('No token. Set META_SYSTEM_USER_TOKEN, or put it in .env.local.');
  process.exit(1);
}

async function graph(path, method = 'GET', body) {
  const url = new URL(`${BASE}${path}`);
  const opts = { method };
  if (method === 'GET') {
    url.searchParams.set('access_token', TOKEN);
    if (body) for (const [k, v] of Object.entries(body)) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
  } else {
    const form = new URLSearchParams();
    form.set('access_token', TOKEN);
    if (body) for (const [k, v] of Object.entries(body)) {
      if (v == null) continue;
      form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    opts.body = form.toString();
  }
  const res = await fetch(url, opts);
  const j = await res.json();
  if (j.error) {
    throw new Error(`Meta ${j.error.code}: ${j.error.message}${j.error.error_user_msg ? ` — ${j.error.error_user_msg}` : ''}`);
  }
  return j;
}

const list = async (edge, fields) =>
  (await graph(`/${ACCT}/${edge}`, 'GET', { fields, limit: '500' })).data || [];

const step = (msg) => console.log(`  ${EXECUTE ? '+' : '·'} ${msg}`);

// ─── build ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${EXECUTE ? '🟢 EXECUTE' : '🟡 DRY RUN — pass --execute to create'}`);
  console.log(`   ${CONFIG.campaignName}\n`);

  const me = await graph('/me', 'GET', { fields: 'id,name' });
  const acct = await graph(`/${ACCT}`, 'GET', { fields: 'name,account_status,currency' });
  console.log(`   token ok (${me.name || me.id}) · ${acct.name} · ${acct.currency} · status ${acct.account_status}\n`);

  // 1. custom conversion
  const ccs = await list('customconversions', 'id,name');
  let convId = ccs.find((c) => c.name.toLowerCase() === CONFIG.conversion.name.toLowerCase())?.id;
  if (convId) {
    console.log(`  ✓ custom conversion exists: ${CONFIG.conversion.name} (${convId})`);
  } else if (EXECUTE) {
    const r = await graph(`/${ACCT}/customconversions`, 'POST', {
      name: CONFIG.conversion.name,
      custom_event_type: CONFIG.conversion.customEventType,
      rule: CONFIG.conversion.rule,
      event_source_id: CONFIG.pixelId,
    });
    convId = r.id;
    step(`created custom conversion "${CONFIG.conversion.name}" (${convId})`);
  } else {
    step(`would create custom conversion "${CONFIG.conversion.name}"`);
    convId = '<new>';
  }

  // 2. campaign — paused
  const camps = await list('campaigns', 'id,name,status');
  let campId = camps.find((c) => c.name === CONFIG.campaignName)?.id;
  if (campId) {
    console.log(`  ✓ campaign exists (${campId})`);
  } else if (EXECUTE) {
    const r = await graph(`/${ACCT}/campaigns`, 'POST', {
      name: CONFIG.campaignName,
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: [],
      // Meta now demands this explicitly whenever the budget sits at ad-set
      // level. False on purpose: sharing lets ad sets lend each other 20%, and
      // the broad set is funded at exactly the level that clears the learning
      // threshold. Letting Meta quietly move that money defeats the point of
      // picking the number.
      is_adset_budget_sharing_enabled: false,
    });
    campId = r.id;
    step(`created campaign (${campId})`);
  } else {
    step('would create campaign, PAUSED, OUTCOME_LEADS');
    campId = '<new>';
  }

  // 3. ad sets — paused
  const existingSets = campId.startsWith('<')
    ? []
    : (await graph(`/${campId}/adsets`, 'GET', { fields: 'id,name', limit: '100' })).data || [];

  const setIds = [];
  for (const s of CONFIG.adSets) {
    const found = existingSets.find((x) => x.name === s.name);
    if (found) {
      console.log(`  ✓ ad set exists: ${s.name} (${found.id})`);
      setIds.push(found.id);
      continue;
    }
    if (!EXECUTE) {
      step(`would create ad set "${s.name}" — £${(s.dailyBudgetPence / 100).toFixed(0)}/day`);
      setIds.push('<new>');
      continue;
    }
    const r = await graph(`/${ACCT}/adsets`, 'POST', {
      name: s.name,
      campaign_id: campId,
      status: 'PAUSED',
      daily_budget: s.dailyBudgetPence,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'OFFSITE_CONVERSIONS',
      // Explicit, because the account's default now resolves to a capped
      // strategy and Meta then demands a bid amount. No cap is right for a cold
      // test: a bid cap on an ad set that has not learned yet mostly just
      // throttles delivery and slows the learning it needs.
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      // The whole point of the rebuild. Optimisation cannot be changed on a
      // published ad set, so getting this right now avoids a rebuild later.
      // custom_conversion_id ALONE. Passing pixel_id alongside it is rejected as
      // an invalid combination -- the conversion already knows its pixel.
      promoted_object: { custom_conversion_id: convId },
      attribution_spec: [
        { event_type: 'CLICK_THROUGH', window_days: 7 },
        { event_type: 'VIEW_THROUGH', window_days: 1 },
      ],
      targeting: {
        ...s.targeting,
        excluded_custom_audiences: [{ id: CONFIG.excludeAudienceId }],
      },
    });
    step(`created ad set "${s.name}" (${r.id}) — £${(s.dailyBudgetPence / 100).toFixed(0)}/day`);
    setIds.push(r.id);
  }

  // 4. ads — reported, not created. Video assets must be uploaded to the account
  //    first; the creative cannot reference a local file.
  console.log('\n  Ads (creatives need video_id from an upload — see --help):');
  for (const a of CONFIG.ads) {
    console.log(`    · ${a.name}`);
    console.log(`        video     ${a.video}-9x16.mp4 / -4x5.mp4`);
    console.log(`        headline  ${a.headline}`);
    console.log(`        link      ${CONFIG.landing}`);
  }

  console.log(`\n  Budget: £${(CONFIG.adSets.reduce((n, s) => n + s.dailyBudgetPence, 0) / 100).toFixed(0)}/day across ${CONFIG.adSets.length} ad sets`);
  console.log(`  Everything created PAUSED. Review in Ads Manager before enabling.\n`);
  if (!EXECUTE) console.log('  Nothing was created. Re-run with --execute.\n');
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
