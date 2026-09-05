/**
 * Uploads the ad videos and creates the ads, PAUSED, on the Career Change
 * campaign built by career-change-campaign.mjs.
 *
 *   node --use-system-ca scripts/career-change-ads.mjs            # dry run
 *   node --use-system-ca scripts/career-change-ads.mjs --execute
 *
 * Idempotent by name: an ad or video that already exists is adopted, not
 * duplicated. Safe to re-run after a partial failure.
 *
 * Uses the 4:5 renders. Meta treats 4:5 as the feed ratio and it survives Reels
 * with bars; 9:16 in feed gets cropped by Meta, which is the worse trade because
 * these layouts are composed to the frame. Placement asset customisation can
 * serve the true 9:16 masters later -- the assets exist, it is only an
 * asset_feed_spec away, and it is not worth risking the first build on.
 */

import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const ACCT = 'act_37869536';
const BASE = 'https://graph.facebook.com/v21.0';
const LANDING = 'https://ptlaunchlab.co.uk/career-planner';
const VIDEO_DIR = 'C:/Projects/ptll-motion/out';
const STATIC_DIR = 'C:/Projects/ptll-motion/out/statics-jpg';

/** Which ads go on which ad set. Copy is duplicated from the campaign script's
 *  CONFIG deliberately -- these two run independently and a shared import would
 *  make a copy tweak in one silently change the other. */
const ADSETS = {
  broad: '52568821959318',
  lookalike: '52568821984118',
};

const ADS = [
  {
    name: 'A · Six in the morning',
    video: 'ad-01-fifteen-4x5.mp4',
    thumb: 'ad-01-fifteen-lockup-4x5.jpg',
    headline: 'Train around the job you\u2019ve got',
    description: 'Fully online. NCFE accredited.',
    body: `Six in the morning. Again.

Shifts. Or a nine to five that's going nowhere. And no real passion in any of it.

If fitness is the thing you actually care about, there's a route into it that doesn't involve handing your notice in on Monday.

Our Level 3 Personal Trainer course is fully online and NCFE accredited. Eight to sixteen weeks, at your pace, around the job you've already got. You don't stop earning to retrain.

And it wasn't put together by people who've only read about the industry. It was built by gym owners who've hired over five hundred trainers \u2014 so it teaches what gyms are actually looking for, not just what gets you through an exam.

Take two minutes and find out which route fits you.`,
  },
  {
    name: 'B · We do the hiring',
    video: 'ad-04-we-do-the-hiring-4x5.mp4',
    thumb: 'ad-04-we-do-the-hiring-five-hundred-4x5.jpg',
    headline: 'Built by gym owners who hire',
    description: 'The qualification we\u2019d hire from',
    body: `Most fitness course companies will tell you they train personal trainers.

We hire them.

We run gyms. We've read hundreds of applications, and a certificate on its own has never once told us whether somebody can actually coach a session.

So we built the qualification from the other side of the desk. The one we'd hire from.

NCFE accredited, fully online, eight to sixteen weeks around your current job \u2014 taught by people who've hired over five hundred trainers and know exactly what a gym is looking for when it reads your name.

Find out where you'd start.`,
  },
  {
    name: 'C · Three hundred quid',
    video: 'ad-03-three-hundred-quid-4x5.mp4',
    thumb: 'ad-03-three-hundred-quid-nope-4x5.jpg',
    headline: 'A proper route into fitness',
    description: 'NCFE accredited. 8\u201316 weeks.',
    body: `A three hundred quid PT certificate off the internet is, technically, a certificate.

It just isn't the thing a gym is asking for.

There's a difference between something that says you're qualified and a qualification that's actually accredited, actually assessed, and actually recognised by the places you want to work.

Ours is NCFE accredited. Fully online, eight to sixteen weeks, at your own pace and around the job you've already got.

Built by gym owners who've hired over five hundred trainers.

Two minutes to see which route fits you.`,
  },
  {
    name: 'D · Which route',
    video: 'ad-09-which-route-4x5.mp4',
    thumb: 'ad-09-which-route-three-routes-4x5.jpg',
    headline: 'Which fitness route fits you?',
    description: 'Free 2-minute career planner',
    body: `Want to work in fitness but not sure where you'd actually start?

Personal trainer. Fitness coach. Gym instructor. They're not the same job, they don't suit the same people, and picking the course before you've picked the route is how people end up qualified in the wrong thing.

So start with the route.

Answer a few quick questions \u2014 where you are now, what hours you can give it, what you actually want out of it \u2014 and we'll show you which way in makes sense for you. It takes about two minutes and there's nothing to pay.

Your next step gets a lot clearer.`,
  },
  {
    name: 'E · Around the job',
    video: 'ad-02-around-the-job-4x5.mp4',
    thumb: 'ad-02-around-the-job-week-filled-4x5.jpg',
    headline: 'Don\u2019t quit your job to retrain',
    description: 'Fully online, at your pace',
    body: `"I haven't got time to retrain."

Good. Don't quit your job.

The course is fully online, so it goes around the work you're already doing \u2014 evenings, weekends, whenever you've actually got an hour. Eight to sixteen weeks at your own pace, and nobody is asking you to choose between the two.

NCFE accredited, and built by gym owners who've hired over five hundred trainers.

Keep the job. Work towards something better at the same time.`,
  },
];

// ─── plumbing ───────────────────────────────────────────────────────────────
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
    // Meta's `message` is often just "Invalid parameter"; the actual reason
    // lives in error_user_title / error_user_msg. Dropping those turns a
    // one-line diagnosis into guesswork.
    const e = j.error;
    const detail = [e.error_user_title, e.error_user_msg].filter(Boolean).join(' — ');
    throw new Error(`Meta ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''}: ${e.message}${detail ? `
    ${detail}` : ''}`);
  }
  return j;
}

/** Video upload — multipart, because the bytes cannot go through a form encoder. */
async function uploadVideo(file, name) {
  const fd = new FormData();
  fd.set('access_token', TOKEN);
  fd.set('name', name);
  fd.set('source', new Blob([readFileSync(file)]), basename(file));
  const r = await fetch(`${BASE}/${ACCT}/advideos`, { method: 'POST', body: fd });
  const j = await r.json();
  if (j.error) throw new Error(`advideos: Meta ${j.error.code}: ${j.error.message}`);
  return j;
}

/**
 * Image upload. NOT the same shape as video: /adimages rejects a `source` file
 * part and wants base64 in `bytes`. It also keys the response by the uploaded
 * filename rather than returning a flat object.
 */
async function uploadImage(file) {
  const j = await graph(`/${ACCT}/adimages`, 'POST', {
    bytes: readFileSync(file).toString('base64'),
  });
  const first = Object.values(j.images || {})[0];
  if (!first?.hash) throw new Error(`adimages returned no hash for ${basename(file)}`);
  return first.hash;
}

/** Meta will not build a creative from a video still being processed. */
async function waitForVideo(id, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    const v = await graph(`/${id}`, 'GET', { fields: 'status' });
    const s = v.status?.video_status;
    if (s === 'ready') return true;
    if (s === 'error') throw new Error(`video ${id} failed processing`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

// ─── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${EXECUTE ? '🟢 EXECUTE' : '🟡 DRY RUN — pass --execute'}\n`);

  // Pre-flight: every asset must exist before anything is uploaded, so a missing
  // file is a clean stop rather than a half-built ad set.
  let missing = 0;
  for (const a of ADS) {
    for (const [kind, p] of [['video', `${VIDEO_DIR}/${a.video}`], ['thumb', `${STATIC_DIR}/${a.thumb}`]]) {
      if (!existsSync(p)) { console.log(`  ✗ missing ${kind}: ${p}`); missing += 1; }
    }
  }
  if (missing) { console.error(`\n${missing} asset(s) missing — nothing uploaded.\n`); process.exit(1); }
  console.log(`  ✓ all ${ADS.length * 2} assets present\n`);

  if (!EXECUTE) {
    for (const a of ADS) console.log(`  · would upload ${a.video} + create ad "${a.name}" on both ad sets`);
    console.log('\n  Nothing created. Re-run with --execute.\n');
    return;
  }

  const existingAds = (await graph(`/${ACCT}/ads`, 'GET', { fields: 'id,name', limit: '500' })).data || [];
  const existingVideos = (await graph(`/${ACCT}/advideos`, 'GET', { fields: 'id,title', limit: '500' })).data || [];

  for (const a of ADS) {
    // 1. video — adopt an earlier upload rather than filling the library with
    //    copies every time this is re-run after a failure downstream.
    let videoId = existingVideos.find((v) => v.title === a.video)?.id;
    if (videoId) {
      console.log(`  ✓ video already uploaded: ${a.video} (${videoId})`);
    } else {
      const vid = await uploadVideo(`${VIDEO_DIR}/${a.video}`, a.video);
      videoId = vid.id;
      process.stdout.write(`  + ${a.video} → ${videoId}, processing…`);
      const ready = await waitForVideo(videoId);
      console.log(ready ? ' ready' : ' still processing (creative may fail)');
    }

    // 2. thumbnail
    const hash = await uploadImage(`${STATIC_DIR}/${a.thumb}`);

    // 3. creative
    const creative = await graph(`/${ACCT}/adcreatives`, 'POST', {
      name: `${a.name} — creative`,
      object_story_spec: {
        page_id: PAGE,
        video_data: {
          video_id: videoId,
          image_hash: hash,
          title: a.headline,
          message: a.body,
          link_description: a.description,
          call_to_action: { type: 'LEARN_MORE', value: { link: LANDING } },
        },
      },
      // No degrees_of_freedom_spec. Opting out of standard enhancements via
      // that field is deprecated and now rejects the creative outright
      // ("Creative should not include standard enhancements"). Enhancements are
      // an account-level setting in Ads Manager now.
    });
    console.log(`    creative ${creative.id}`);

    // 4. one ad per ad set
    for (const [label, adsetId] of Object.entries(ADSETS)) {
      const adName = `${a.name} · ${label}`;
      const found = existingAds.find((x) => x.name === adName);
      if (found) { console.log(`    ✓ ad exists: ${adName}`); continue; }
      const ad = await graph(`/${ACCT}/ads`, 'POST', {
        name: adName,
        adset_id: adsetId,
        creative: { creative_id: creative.id },
        status: 'PAUSED',
      });
      console.log(`    + ad ${adName} (${ad.id})`);
    }
  }

  console.log('\n  All ads PAUSED. Review in Ads Manager before enabling.\n');
}

main().catch((e) => { console.error(`\n✗ ${e.message}\n`); process.exit(1); });
