/**
 * Swaps Callum's edited videos into the existing Career Change ads.
 *
 *   node --use-system-ca scripts/career-change-swap-creatives.mjs            # dry run
 *   node --use-system-ca scripts/career-change-swap-creatives.mjs --execute
 *
 * The ads keep their ids, names, ad sets, targeting and copy. Only the creative
 * changes, so nothing about the campaign structure has to be rebuilt and no
 * learning is thrown away (there is none yet, but the same holds later).
 *
 * Ads stay PAUSED throughout. This never changes a status.
 *
 * Source is the "upload ready" folder, NOT the editor's export folder: the
 * exports come out of a 2880x2160 landscape frame with the portrait content
 * pillarboxed inside, and Meta reads the container rather than the content. Any
 * of those uploaded raw would run as a small letterboxed landscape ad.
 */

import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const ACCT = 'act_37869536';
const BASE = 'https://graph.facebook.com/v21.0';
const LANDING = 'https://ptlaunchlab.co.uk/career-planner';
const EDITED = 'C:/Users/User/ptll-ads/2026-09-03-career-planner/ready for ads/upload ready';
const THUMBS = 'C:/Projects/ptll-motion/out/statics-jpg';

/**
 * Ad name prefix -> the edited file that belongs to it.
 * Named by hand because the editor's filenames do not follow a scheme --
 * "5x4" where it means 4x5, a truncated "we-do-the-hiri", and "which route
 * delivery" with no ratio in it at all (Callum confirmed that one is the 4:5).
 */
const MAP = [
  { ad: 'A · Six in the morning', file: '6am fifteen 4x5.mp4', thumb: 'ad-01-fifteen-lockup-4x5.jpg',
    headline: 'Train around the job you\u2019ve got', description: 'Fully online. NCFE accredited.' },
  { ad: 'B · We do the hiring', file: 'we-do-the-hiri 5x4.mp4', thumb: 'ad-04-we-do-the-hiring-five-hundred-4x5.jpg',
    headline: 'Built by gym owners who hire', description: 'The qualification we\u2019d hire from' },
  { ad: 'C · Three hundred quid', file: 'three-hundred 5x4.mp4', thumb: 'ad-03-three-hundred-quid-nope-4x5.jpg',
    headline: 'A proper route into fitness', description: 'NCFE accredited. 8\u201316 weeks.' },
  { ad: 'D · Which route', file: 'which route delivery.mp4', thumb: 'ad-09-which-route-three-routes-4x5.jpg',
    headline: 'Which fitness route fits you?', description: 'Free 2-minute career planner' },
  { ad: 'E · Around the job', file: 'around-the-job 4x5.mp4', thumb: 'ad-02-around-the-job-week-filled-4x5.jpg',
    headline: 'Don\u2019t quit your job to retrain', description: 'Fully online, at your pace' },
];

const fromEnv = (k) => {
  try {
    const l = readFileSync('.env.local', 'utf8').split(/\r?\n/).find((x) => x.startsWith(`${k}=`));
    return l ? l.slice(k.length + 1).replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};
const TOKEN = process.env.META_SYSTEM_USER_TOKEN || fromEnv('META_SYSTEM_USER_TOKEN');
const PAGE = fromEnv('META_PAGE_ID') || '798389646699303';
const EXECUTE = process.argv.includes('--execute');
if (!TOKEN) { console.error('No META_SYSTEM_USER_TOKEN'); process.exit(1); }

async function graph(path, method = 'GET', body) {
  const url = new URL(`${BASE}${path}`);
  const opts = { method };
  if (method === 'GET') {
    url.searchParams.set('access_token', TOKEN);
    if (body) for (const [k, v] of Object.entries(body)) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
  } else {
    const f = new URLSearchParams();
    f.set('access_token', TOKEN);
    if (body) for (const [k, v] of Object.entries(body)) {
      if (v == null) continue;
      f.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    opts.body = f.toString();
  }
  const r = await fetch(url, opts);
  const j = await r.json();
  if (j.error) {
    const e = j.error;
    const d = [e.error_user_title, e.error_user_msg].filter(Boolean).join(' — ');
    throw new Error(`Meta ${e.code}: ${e.message}${d ? `\n    ${d}` : ''}`);
  }
  return j;
}

async function uploadVideo(file, name) {
  const fd = new FormData();
  fd.set('access_token', TOKEN);
  fd.set('name', name);
  fd.set('source', new Blob([readFileSync(file)]), basename(file));
  const r = await fetch(`${BASE}/${ACCT}/advideos`, { method: 'POST', body: fd });
  const j = await r.json();
  if (j.error) throw new Error(`advideos: ${j.error.message}`);
  return j.id;
}

/** /adimages wants base64 in `bytes`, not a file part, and keys by filename. */
async function uploadImage(file) {
  const j = await graph(`/${ACCT}/adimages`, 'POST', { bytes: readFileSync(file).toString('base64') });
  const first = Object.values(j.images || {})[0];
  if (!first?.hash) throw new Error(`no hash for ${basename(file)}`);
  return first.hash;
}

async function waitForVideo(id, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    const v = await graph(`/${id}`, 'GET', { fields: 'status' });
    if (v.status?.video_status === 'ready') return true;
    if (v.status?.video_status === 'error') throw new Error(`video ${id} failed processing`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  console.log(`\n${EXECUTE ? '🟢 EXECUTE' : '🟡 DRY RUN — pass --execute'}\n`);

  let missing = 0;
  for (const m of MAP) {
    for (const [kind, p] of [['video', `${EDITED}/${m.file}`], ['thumb', `${THUMBS}/${m.thumb}`]]) {
      if (!existsSync(p)) { console.log(`  ✗ missing ${kind}: ${p}`); missing += 1; }
    }
  }
  if (missing) { console.error(`\n${missing} file(s) missing — nothing changed.\n`); process.exit(1); }
  console.log(`  ✓ all ${MAP.length * 2} source files present\n`);

  const ads = (await graph(`/${ACCT}/ads`, 'GET', { fields: 'id,name,status', limit: '500' })).data || [];

  for (const m of MAP) {
    const targets = ads.filter((a) => a.name.startsWith(m.ad));
    if (!targets.length) { console.log(`  ! no ads named "${m.ad}*" — skipped`); continue; }

    if (!EXECUTE) {
      console.log(`  · "${m.file}" → ${targets.length} ad(s): ${targets.map((t) => t.name).join(', ')}`);
      continue;
    }

    const vidId = await uploadVideo(`${EDITED}/${m.file}`, `edited · ${m.file}`);
    process.stdout.write(`  + ${m.file} → ${vidId}, processing…`);
    console.log((await waitForVideo(vidId)) ? ' ready' : ' still processing');

    const hash = await uploadImage(`${THUMBS}/${m.thumb}`);

    // Copy is read off the ad it replaces, so a creative swap can never quietly
    // rewrite the ad's words.
    const old = await graph(`/${targets[0].id}`, 'GET', { fields: 'creative{object_story_spec}' });
    const body = old.creative?.object_story_spec?.video_data?.message;
    if (!body) throw new Error(`could not read existing copy from ad ${targets[0].id}`);

    const creative = await graph(`/${ACCT}/adcreatives`, 'POST', {
      name: `${m.ad} — edited`,
      object_story_spec: {
        page_id: PAGE,
        video_data: {
          video_id: vidId,
          image_hash: hash,
          title: m.headline,
          message: body,
          link_description: m.description,
          call_to_action: { type: 'LEARN_MORE', value: { link: LANDING } },
        },
      },
    });

    for (const t of targets) {
      await graph(`/${t.id}`, 'POST', { creative: { creative_id: creative.id } });
      console.log(`    ↻ ${t.name} → creative ${creative.id} (${t.status})`);
    }
  }

  console.log('\n  Creatives swapped. Ads unchanged otherwise, still PAUSED.\n');
}

main().catch((e) => { console.error(`\n✗ ${e.message}\n`); process.exit(1); });
