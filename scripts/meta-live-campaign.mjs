#!/usr/bin/env node
/**
 * PT Launch Lab LIVE — Meta campaign builder (paused drafts).
 *
 * Creates the monthly LIVE-event lead campaign from LIVE-EVENT-CAMPAIGN-PLAN.md:
 *   1 campaign (OUTCOME_LEADS) -> 4 ad sets (PAUSED) -> creatives + ads (PAUSED).
 * NOTHING is ever created ACTIVE. You review + switch on in Ads Manager.
 *
 * Requires a token with `ads_management` on act_3635881119973565. The Vercel
 * META_ACCESS_TOKEN is CAPI-only (read_ads_dataset_quality) and will NOT work.
 * Generate a token: Business Settings -> System Users -> add ads_management, or
 * Graph API Explorer with ads_management scope.
 *
 * Run (Windows TLS needs --use-system-ca):
 *   META_ACCESS_TOKEN=EAA... \
 *   META_AD_ACCOUNT_ID=act_3635881119973565 \
 *   META_PAGE_ID=798389646699303 \
 *   node --use-system-ca scripts/meta-live-campaign.mjs <command> [--execute]
 *
 * Commands:
 *   recon       Read-only dump: campaigns, custom audiences, custom conversions, pixels.
 *   build       Create campaign + 4 ad sets. Dry-run unless --execute.
 *   creatives   Create creatives + ads from a manifest. Dry-run unless --execute.
 *               Needs --manifest=path/to/creatives.json and an existing campaign.
 *
 * Flags: --execute (actually write), --manifest=FILE
 */

// ─── CONFIG — edit per month ────────────────────────────────────────────────
const CONFIG = {
  campaignName: 'PT Launch Lab LIVE | July 2026',
  landingUrl: 'https://ptlaunchlab.co.uk/live',
  pixelId: '1133525198707842',

  // Custom conversion to optimise for. Created if it doesn't exist.
  conversion: {
    name: 'Live Registration',
    // Lead events where the URL contains /live (keeps it separate from course Leads).
    rule: { and: [{ event: { eq: 'Lead' } }, { url: { i_contains: '/live' } }] },
    customEventType: 'LEAD',
  },

  // Ad sets. `match` = case-insensitive keyword groups used to find your existing
  // custom audiences by name (every keyword in a group must appear). `excludeMatch`
  // likewise for exclusions. Budgets in PENCE (£8 = 800).
  // Tuned to the REAL audiences on act_37869536 (recon 2026-06-29):
  //   RT · IG Engagers / RT · FB Engagers / RT · {Deep Page,Avatar,Quiz Starter} (website),
  //   Lookalike (1%) - meta_value_based_audience.csv, + its source CSV.
  adSets: [
    {
      // All PTLL retargeting/engagement audiences (the "RT · …" set). The tiny
      // quiz/avatar website audiences fold in here rather than a separate ad set.
      name: 'LIVE Jul26 — Warm Audience',
      dailyBudgetPence: 800,
      match: [['rt']],
      excludeMatch: [['registrant'], ['live', 'register']], // none yet; future-proof
      advantageAudience: false,
    },
    {
      name: 'LIVE Jul26 — Lookalikes',
      dailyBudgetPence: 700,
      match: [['lookalike']],
      excludeMatch: [['registrant'], ['live', 'register'], ['rt']],
      advantageAudience: true,
    },
    {
      name: 'LIVE Jul26 — Broad',
      dailyBudgetPence: 1000,
      match: [], // no custom audiences — broad UK 18-45
      excludeMatch: [['registrant'], ['live', 'register']],
      advantageAudience: true,
    },
  ],

  targeting: { countries: ['GB'], ageMin: 18, ageMax: 40 },
};
// ────────────────────────────────────────────────────────────────────────────

const BASE = 'https://graph.facebook.com/v21.0';
const TOKEN = process.env.META_ACCESS_TOKEN;
const RAW_ACCT = process.env.META_AD_ACCOUNT_ID || 'act_37869536';
const ACCT = RAW_ACCT.startsWith('act_') ? RAW_ACCT : `act_${RAW_ACCT}`;
const PAGE = process.env.META_PAGE_ID;

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('--')) || 'recon';
const EXECUTE = args.includes('--execute');
const manifestArg = args.find((a) => a.startsWith('--manifest='))?.split('=')[1];

if (!TOKEN) { console.error('Missing META_ACCESS_TOKEN'); process.exit(1); }

async function graph(path, method = 'GET', body) {
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  const opts = { method };
  if (method === 'GET') {
    url.searchParams.set('access_token', TOKEN);
    if (body) for (const [k, v] of Object.entries(body)) url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
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
  if (j.error) throw new Error(`Meta ${j.error.code}${j.error.error_subcode ? '/' + j.error.error_subcode : ''}: ${j.error.message}${j.error.error_user_msg ? ` — ${j.error.error_user_msg}` : ''}`);
  return j;
}

const getAll = async (path, fields) => (await graph(path, 'GET', { fields, limit: '500' })).data || [];
const matchAud = (auds, groups) => {
  const hits = new Map();
  for (const g of groups) for (const a of auds) {
    const n = a.name.toLowerCase();
    if (g.every((kw) => n.includes(kw))) hits.set(a.id, a);
  }
  return [...hits.values()];
};

// ─── recon ──────────────────────────────────────────────────────────────────
async function recon() {
  const acct = await graph(`/${ACCT}`, 'GET', { fields: 'name,currency,account_status,timezone_name' });
  console.log(`\nACCOUNT  ${acct.name} | ${acct.currency} | status ${acct.account_status} | ${acct.timezone_name}`);

  const camps = await getAll(`/${ACCT}/campaigns`, 'id,name,status,objective');
  console.log(`\nCAMPAIGNS (${camps.length})`);
  camps.forEach((c) => console.log(`  [${c.status}] ${c.name} — ${c.objective} — ${c.id}`));

  const auds = await getAll(`/${ACCT}/customaudiences`, 'id,name,subtype,approximate_count_lower_bound');
  console.log(`\nCUSTOM AUDIENCES (${auds.length})`);
  auds.forEach((a) => console.log(`  ${a.name} [${a.subtype}] ~${a.approximate_count_lower_bound ?? '?'} — ${a.id}`));

  const cc = await getAll(`/${ACCT}/customconversions`, 'id,name,custom_event_type');
  console.log(`\nCUSTOM CONVERSIONS (${cc.length})`);
  cc.forEach((c) => console.log(`  ${c.name} [${c.custom_event_type}] — ${c.id}`));

  console.log('\nADSET AUDIENCE MAPPING PREVIEW');
  for (const s of CONFIG.adSets) {
    const inc = matchAud(auds, s.match);
    const exc = matchAud(auds, s.excludeMatch);
    console.log(`  ${s.name}`);
    console.log(`    include: ${inc.length ? inc.map((a) => a.name).join(', ') : '(broad — none)'}`);
    console.log(`    exclude: ${exc.length ? exc.map((a) => a.name).join(', ') : '(none found)'}`);
  }
  console.log('');
}

async function ensureConversion(existing) {
  let conv = existing.find((c) => c.name.toLowerCase() === CONFIG.conversion.name.toLowerCase());
  if (conv) { console.log(`  ✓ custom conversion exists: ${conv.name} (${conv.id})`); return conv.id; }
  if (!EXECUTE) { console.log(`  + would CREATE custom conversion "${CONFIG.conversion.name}"`); return '<new>'; }
  const r = await graph(`/${ACCT}/customconversions`, 'POST', {
    name: CONFIG.conversion.name,
    custom_event_type: CONFIG.conversion.customEventType,
    rule: CONFIG.conversion.rule,
    event_source_id: CONFIG.pixelId,
  });
  console.log(`  + created custom conversion ${CONFIG.conversion.name} (${r.id})`);
  return r.id;
}

// ─── build ──────────────────────────────────────────────────────────────────
async function build() {
  console.log(`\n${EXECUTE ? '🟢 EXECUTE' : '🟡 DRY-RUN (no --execute)'} — building "${CONFIG.campaignName}"\n`);

  const auds = await getAll(`/${ACCT}/customaudiences`, 'id,name,subtype');
  const ccs = await getAll(`/${ACCT}/customconversions`, 'id,name,custom_event_type');
  const convId = await ensureConversion(ccs);

  // campaign (idempotent by name)
  const camps = await getAll(`/${ACCT}/campaigns`, 'id,name,status');
  let camp = camps.find((c) => c.name === CONFIG.campaignName);
  if (camp) {
    console.log(`  ✓ campaign exists: ${camp.name} (${camp.id})`);
  } else if (EXECUTE) {
    camp = await graph(`/${ACCT}/campaigns`, 'POST', {
      name: CONFIG.campaignName, objective: 'OUTCOME_LEADS', status: 'PAUSED',
      special_ad_categories: [], is_adset_budget_sharing_enabled: false,
    });
    console.log(`  + created campaign ${CONFIG.campaignName} (${camp.id})`);
  } else {
    console.log(`  + would CREATE campaign ${CONFIG.campaignName}`);
    camp = { id: '<new>' };
  }

  const existingSets = camp.id !== '<new>' ? await getAll(`/${camp.id}/adsets`, 'id,name') : [];

  for (const s of CONFIG.adSets) {
    const inc = matchAud(auds, s.match);
    const exc = matchAud(auds, s.excludeMatch);
    const dup = existingSets.find((x) => x.name === s.name);

    console.log(`\n  AD SET: ${s.name}  £${(s.dailyBudgetPence / 100).toFixed(2)}/day`);
    console.log(`    include: ${inc.length ? inc.map((a) => a.name).join(', ') : '(broad)'}`);
    console.log(`    exclude: ${exc.length ? exc.map((a) => a.name).join(', ') : '(none)'}`);
    if (dup) { console.log(`    ✓ already exists (${dup.id}) — skipping`); continue; }

    const targeting = {
      geo_locations: { countries: CONFIG.targeting.countries },
      age_min: CONFIG.targeting.ageMin,
      targeting_automation: { advantage_audience: s.advantageAudience ? 1 : 0 },
    };
    // Advantage+ Audience rejects a hard age cap (treats age as a suggestion);
    // only apply age_max on the non-Advantage+ (Warm) ad set.
    if (!s.advantageAudience) targeting.age_max = CONFIG.targeting.ageMax;
    if (inc.length) targeting.custom_audiences = inc.map((a) => ({ id: a.id }));
    if (exc.length) targeting.excluded_custom_audiences = exc.map((a) => ({ id: a.id }));

    const payload = {
      name: s.name,
      campaign_id: camp.id,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'OFFSITE_CONVERSIONS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      daily_budget: s.dailyBudgetPence,
      destination_type: 'WEBSITE',
      is_adset_budget_sharing_enabled: false,
      promoted_object: { custom_conversion_id: convId },
      targeting,
      status: 'PAUSED',
    };

    if (!EXECUTE) { console.log('    + would CREATE ad set (PAUSED)'); continue; }
    const r = await graph(`/${ACCT}/adsets`, 'POST', payload);
    console.log(`    + created ad set (${r.id})`);
  }

  console.log(`\n${EXECUTE ? 'Done. Review in Ads Manager, attach creative, then switch ON.' : 'Dry-run complete. Re-run with --execute to create.'}\n`);
}

// ─── creatives ───────────────────────────────────────────────────────────────
// manifest: { "ads": [ { "adSet": "LIVE Jul26 — Broad", "name": "...",
//   "headline": "...", "primaryText": "...", "imagePathOrUrl": "...",
//   "cta": "SIGN_UP" } ] }
async function creatives() {
  if (!manifestArg) { console.error('Need --manifest=path/to/creatives.json'); process.exit(1); }
  const fs = await import('node:fs');
  const manifest = JSON.parse(fs.readFileSync(manifestArg, 'utf8'));
  console.log(`\n${EXECUTE ? '🟢 EXECUTE' : '🟡 DRY-RUN'} — ${manifest.ads.length} ad(s)\n`);

  const camps = await getAll(`/${ACCT}/campaigns`, 'id,name');
  const camp = camps.find((c) => c.name === CONFIG.campaignName);
  if (!camp) { console.error(`Campaign "${CONFIG.campaignName}" not found — run build first.`); process.exit(1); }
  const sets = await getAll(`/${camp.id}/adsets`, 'id,name');

  const existingAds = (await Promise.all(sets.map((s) => getAll(`/${s.id}/ads`, 'id,name')))).flat();

  for (const ad of manifest.ads) {
    const set = sets.find((s) => s.name === ad.adSet);
    const link = ad.url || CONFIG.landingUrl;
    console.log(`  AD: ${ad.name} -> ${ad.adSet}`);
    if (!set) { console.log(`    ✗ ad set not found — skipping`); continue; }
    if (existingAds.some((x) => x.name === ad.name)) { console.log('    ✓ already exists — skipping'); continue; }
    if (!EXECUTE) { console.log(`    + would upload image, create creative + ad (PAUSED) — ${link}`); continue; }

    // upload image (URL, or local file as base64 bytes)
    let up;
    if (/^https?:\/\//.test(ad.imagePathOrUrl)) {
      up = await graph(`/${ACCT}/adimages`, 'POST', { url: ad.imagePathOrUrl });
    } else {
      const fs2 = await import('node:fs');
      const b64 = fs2.readFileSync(ad.imagePathOrUrl).toString('base64');
      up = await graph(`/${ACCT}/adimages`, 'POST', { bytes: b64 });
    }
    const imageHash = Object.values(up.images)[0].hash;

    const creative = await graph(`/${ACCT}/adcreatives`, 'POST', {
      name: `${ad.name} — creative`,
      object_story_spec: {
        page_id: PAGE,
        link_data: {
          link,
          message: ad.primaryText,
          name: ad.headline,
          description: ad.description || undefined,
          call_to_action: { type: ad.cta || 'SIGN_UP', value: { link } },
          image_hash: imageHash,
        },
      },
    });

    const r = await graph(`/${ACCT}/ads`, 'POST', {
      name: ad.name, adset_id: set.id, creative: { creative_id: creative.id }, status: 'PAUSED',
    });
    console.log(`    + created ad ${r.id} (creative ${creative.id})`);
  }
  console.log('');
}

const fns = { recon, build, creatives };
if (!fns[command]) { console.error(`Unknown command "${command}". Use: recon | build | creatives`); process.exit(1); }
fns[command]().catch((e) => { console.error('\n✗', e.message, '\n'); process.exit(1); });
