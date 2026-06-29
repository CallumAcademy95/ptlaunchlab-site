#!/usr/bin/env node
/**
 * MailerLite setup for PT Launch Lab LIVE. Creates the "Live Sessions" group and
 * the Track B event campaigns as DRAFTS (review + schedule in the MailerLite UI).
 * Automations (Track A welcome) must be built in the UI — the API can't.
 *
 *   MAILERLITE_TOKEN=eyJ... node --use-system-ca scripts/mailerlite-live.mjs <cmd>
 *   cmds: groups | setup-group | campaigns
 */
const BASE = 'https://connect.mailerlite.com/api';
const T = process.env.MAILERLITE_TOKEN;
if (!T) { console.error('Missing MAILERLITE_TOKEN'); process.exit(1); }
const cmd = process.argv[2] || 'groups';

async function ml(path, method = 'GET', body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch { j = txt; }
  if (!r.ok) throw new Error(`ML ${r.status}: ${typeof j === 'string' ? j : JSON.stringify(j.errors || j.message || j)}`);
  return j;
}

const GROUP_NAME = 'Live Sessions';

async function findGroup() {
  const res = await ml(`/groups?limit=200`);
  return (res.data || []).find((g) => g.name.toLowerCase() === GROUP_NAME.toLowerCase());
}

if (cmd === 'groups') {
  const res = await ml('/groups?limit=200');
  console.log('GROUPS:');
  for (const g of res.data || []) console.log(`  ${g.name}  (id ${g.id}, ${g.active_count} active)`);
}

if (cmd === 'setup-group') {
  let g = await findGroup();
  if (g) console.log(`✓ group exists: ${g.name} (${g.id})`);
  else { g = (await ml('/groups', 'POST', { name: GROUP_NAME })).data; console.log(`+ created group ${g.name} (${g.id})`); }
}

// ── Campaigns ────────────────────────────────────────────────────────────────
const FROM = 'info@ptlaunchlab.co.uk';
const FROM_NAME = 'Callum — PT Launch Lab';
const ASK = 'https://ptlaunchlab.co.uk/ask';
const POD = 'https://ptlaunchlab.co.uk/podcast';
const QUIZ = 'https://ptlaunchlab.co.uk/quiz';
const PANEL = 'Callum Brown, Ryan Robinson & Miles Halstead, with guests Jonny Grayshon (Vaxa Fitness Transformations), Sam Hinks (SJH Coaching), Tom Blackman (Ministry of Fitness), Aaron Caseley (MOFO Body Mechanic) & Sohail Rashid (Brawn)';
const WATCH_LINK = process.env.WATCH_LINK || ''; // audience watch link; baked into [WATCH LINK] when set

// plaintext → simple branded HTML (linkify URLs, highlight [WATCH LINK], paragraphs)
function toHtml(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const blocks = text.trim().split(/\n\n+/).map((para) => {
    let p = esc(para)
      .replace(/\[WATCH LINK\]/g, WATCH_LINK
        ? `<a href="${WATCH_LINK}" style="color:#1a73e8">${WATCH_LINK}</a>`
        : '<strong style="color:#b8860b">[ PASTE WATCH LINK HERE ]</strong>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1a73e8">$1</a>')
      .replace(/\n/g, '<br>');
    return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#222">${p}</p>`;
  }).join('');
  return `<!doctype html><html><body style="margin:0;background:#f4f4f4;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif">
    ${blocks}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px">
    <p style="font-size:12px;color:#999;line-height:1.5;margin:0">PT Launch Lab · You're receiving this because you registered for PT Launch Lab LIVE.<br>
    <a href="{$unsubscribe}" style="color:#999">Unsubscribe</a></p>
  </div></body></html>`;
}

const CAMPAIGNS = [
  { key: 'B1', name: 'LIVE Jul26 — B1 Announce',
    subject: 'Next PT Launch Lab LIVE: The Real State of the PT Industry in 2026',
    body: `{$name|"there"}, the next live session is locked in.

📅 Wednesday 15 July, 8:00pm (UK)
🎙️ The Real State of the PT Industry in 2026
🎤 On the panel: ${PANEL}.

You're already on the list, so you're in — here's your watch link: [WATCH LINK]

Want something specific covered? Submit your question now and we'll answer the best ones live: ${ASK}` },

  { key: 'B2', name: 'LIVE Jul26 — B2 One week to go',
    subject: '1 week: The Real State of the PT Industry in 2026',
    body: `{$name|"there"}, one week until we go live.

Here's what we're getting into:
• Is the PT market really saturated?
• Are GLP-1 weight-loss drugs a threat or an opportunity for coaches?
• Where the money's actually being made in fitness in 2026
• Where the industry is heading next — plus your live Q&A

With: Callum, Ryan & Miles + Jonny Grayshon, Sam Hinks, Tom Blackman, Aaron Caseley and Sohail Rashid.

Last call to get your question in — we read every one: ${ASK}
Your watch link: [WATCH LINK]` },

  { key: 'B3', name: 'LIVE Jul26 — B3 Tomorrow night',
    subject: 'Tomorrow, 8pm 👀',
    body: `{$name|"there"}, we go live tomorrow at 8pm.

The questions we're settling:
• Is the PT market saturated?
• Are GLP-1 drugs a threat or an opportunity for coaches?
• Where the money's really being made in 2026
• Your live Q&A

Watch link: [WATCH LINK]
Final chance to submit a question: ${ASK}` },

  { key: 'B4', name: 'LIVE Jul26 — B4 Live in 1 hour',
    subject: '⏰ Live in 1 hour',
    body: `{$name|"there"}, we're live in an hour (8pm). Grab a brew and your questions.
👉 [WATCH LINK]` },

  { key: 'B5', name: 'LIVE Jul26 — B5 We are live',
    subject: '🔴 We\'re LIVE now',
    body: `{$name|"there"}, we've started — come join us. Drop your questions in the chat.
👉 [WATCH LINK]` },

  { key: 'B6a', name: 'LIVE Jul26 — B6a Thanks (attendees)',
    subject: 'Thanks for being on the live',
    body: `{$name|"there"}, cheers for joining last night — proper session.

The full episode lands in about a week; we'll send it over. In the meantime, if last night got you thinking about getting qualified or growing your business, have a look: ${QUIZ}` },

  { key: 'B6b', name: 'LIVE Jul26 — B6b Missed you (no-shows)',
    subject: 'Sorry we missed you last night',
    body: `{$name|"there"}, you missed a good one. No worries — it's coming as a podcast episode in about a week and we'll send it straight to you.

Next live is monthly, so you're already on the list for the next one.` },

  { key: 'B7', name: 'LIVE Jul26 — B7 Episode is up',
    subject: '🎧 Last week\'s live is now up',
    body: `{$name|"there"}, the full recording from 15 July is now live as a podcast episode:

🎧 ${POD}

Next session's date drops soon — you're on the list.
Callum` },
];

// Track A welcome emails — created as DRAFTS so you can duplicate their content
// into a MailerLite automation (trigger: joins "Live Sessions"). The API can't
// build automations, so this is the fastest path: ready-made emails to copy in.
const WELCOME = [
  { key: 'A1', name: 'LIVE Welcome — A1 You\'re in',
    subject: 'You\'re in 🎟️ here\'s your watch link',
    body: `{$name|"Hey"}, you're on the list for PT Launch Lab LIVE.

📅 Next session: Wednesday 15 July, 8:00pm (UK)
🎙️ The Real State of the PT Industry in 2026

Save your watch link: [WATCH LINK]
Add it to your calendar so you don't forget.

🎤 Got a question for the panel? Submit it here and we'll answer the best ones live: ${ASK}

A quick heads up on what you've joined: once a month we go live with leading UK coaches and gym owners — no scripts, real talk, your questions answered. A week later it lands as a podcast episode. You'll also hear from us between sessions with the best episodes and the odd thing we think will genuinely help you.

See you on the live,
Callum — PT Launch Lab` },

  { key: 'A2', name: 'LIVE Welcome — A2 Who we are',
    subject: 'Why three gym owners started doing this',
    body: `{$name|"there"}, quick intro so you know who's in your inbox.

PT Launch Lab is run by us — Callum, Ryan and Miles — gym owners and coaches who've hired and trained hundreds of PTs. We got sick of the fitness industry being full of hype and influencers who've never actually built anything.

So we started having the honest conversations on the record: what actually works, what's nonsense, and how real people build careers and businesses in fitness. That's the live panel. That's the podcast.

If you only listen to one episode first, make it this one: ${POD}

More soon,
Callum` },

  { key: 'A3', name: 'LIVE Welcome — A3 Quick win',
    subject: 'The 3 things actually working for PTs right now',
    body: `{$name|"there"}, no pitch today — just something useful.

From what we and the coaches we know are seeing on the ground, three things are quietly working in 2026 while everyone else panics about AI and saturation:

1. Niching down hard enough that you're the obvious choice for ONE type of client.
2. Owning the in-person/accountability piece machines can't replace.
3. Treating retention as the business — keeping clients 12+ months, not chasing new ones.

We go deep on this stuff live. Speaking of which — your next session is Wednesday 15 July, 8pm.

Callum` },

  { key: 'A4', name: 'LIVE Welcome — A4 Soft course intro',
    subject: 'In case you didn\'t know what we actually do',
    body: `{$name|"there"}, you joined us for the live panel — but a lot of people don't realise PT Launch Lab is also how you become a qualified PT in the first place.

We run the NCFE Level 3 Personal Trainer qualification — 100% online, built by gym owners, with real mentorship and business support (not just a certificate and good luck). Ofqual regulated, CIMSPA recognised.

No pressure at all — but if becoming a PT (or finally getting qualified) is on your mind, the 60-second quiz tells you the right path for your situation:
👉 ${QUIZ}

Either way, see you on the next live.
Callum` },

  { key: 'A5', name: 'LIVE Welcome — A5 Best-of podcast',
    subject: '3 episodes worth your commute',
    body: `{$name|"there"}, if you've got a drive or a session ahead, start here:

🎧 How I built an online PT business to £500K — Ryan's full story
🎧 Is becoming a personal trainer still worth it? The honest answer
🎧 Will AI replace personal trainers? The honest answer

All here: ${POD}

Then come settle the debates with us live, Wednesday 15 July, 8pm.
Callum` },
];

async function createDrafts(list, groupId) {
  const existing = (await ml('/campaigns?filter[status]=draft&limit=100')).data || [];
  for (const c of list) {
    if (existing.some((e) => e.name === c.name)) { console.log(`  ✓ exists, skipping: ${c.name}`); continue; }
    const res = await ml('/campaigns', 'POST', {
      name: c.name, type: 'regular', groups: [groupId],
      emails: [{ subject: c.subject, from_name: FROM_NAME, from: FROM, content: toHtml(c.body) }],
    });
    console.log(`  + created draft: ${c.name} (${res.data.id})`);
  }
}

// ── Track C: weekly nurture (3/week — Mon podcast, Wed value/course, Fri podcast)
const POD_EP = (slug) => `${POD}/${slug}`;
const NURTURE = [
  // ── Week 1 ──
  { name: 'LIVE Nurture — W1 Mon — Worth it? (pod)',
    subject: 'Is becoming a PT still worth it in 2026?',
    preview: 'The honest answer — from people who actually hire trainers.',
    body: `{$name|"there"}, it's the question we get more than any other: is it even worth becoming a personal trainer anymore?

Everyone's got an opinion. Most come from people who've never actually built anything in fitness.

So we answered it properly on the podcast — the money, the saturation, and the part nobody tells you:

🎧 ${POD_EP('is-becoming-a-personal-trainer-still-worth-it-the-honest-answer')}

Give it 20 minutes before you talk yourself into — or out of — anything.

Callum` },
  { name: 'LIVE Nurture — W1 Wed — Niche (value)',
    subject: 'The fastest way to stand out as a PT',
    preview: "It isn't another qualification.",
    body: `{$name|"there"}, quick one that's worth more than most £500 courses.

The PTs who fill their books fastest aren't the most qualified. They're the most specific.

"I train people" is forgettable. "I help busy dads over 40 get strong without living in the gym" is a decision.

Pick one type of person you're genuinely the obvious choice for. Say it everywhere. Watch how much easier everything gets — content, sales, referrals.

That's it. Try it this week.

Callum` },
  { name: 'LIVE Nurture — W1 Fri — Ryan £500k (pod)',
    subject: 'How Ryan built an online PT business to £500K',
    preview: 'The full story — what worked and what he\'d never do again.',
    body: `{$name|"there"}, if you ever wonder what's actually possible as a coach, listen to this one.

Ryan built an online PT business to £500K — then tells the honest version: what worked, what nearly broke him, and what he'd do differently from day one.

🎧 ${POD_EP('how-i-built-an-online-pt-business-to-500k-ryans-full-story')}

Not a highlight reel. The real thing.

Callum` },

  // ── Week 2 ──
  { name: 'LIVE Nurture — W2 Mon — Sick of 9-5 (pod)',
    subject: 'Sick of the 9–5?',
    preview: 'How to build a fitness career you actually want.',
    body: `{$name|"there"}, most people don't hate hard work. They hate building someone else's future.

If that's hitting a bit close, this episode is for you — how to build a fitness career on your terms, without quitting on a whim and hoping it works out.

🎧 ${POD_EP('sick-of-the-9-5-how-to-build-a-fitness-career-you-actually-want')}

Callum` },
  { name: 'LIVE Nurture — W2 Wed — What we do (course)',
    subject: 'In case you didn\'t know what we actually do',
    preview: 'Beyond the live panel and the podcast.',
    body: `{$name|"there"}, you're on our list for the live sessions — but a lot of people don't realise PT Launch Lab is also how you become a qualified PT in the first place.

We run the NCFE Level 3 Personal Trainer qualification: 100% online, built by gym owners, with real mentorship and business support. Ofqual regulated, CIMSPA recognised. Not a certificate-and-good-luck course.

No pressure — but if getting qualified (or finally finishing) is on your mind, the 60-second quiz points you to the right path:

👉 ${QUIZ}

Callum` },
  { name: 'LIVE Nurture — W2 Fri — AI replace PTs (pod)',
    subject: 'Will AI replace personal trainers?',
    preview: 'The honest answer (not the scary one).',
    body: `{$name|"there"}, every other post right now says AI is coming for coaching jobs.

We took it seriously and gave the honest answer on the podcast — where AI genuinely changes things, and the part of this job it can't touch.

🎧 ${POD_EP('will-ai-replace-personal-trainers-the-honest-answer')}

Worth a listen before you panic (or get complacent).

Callum` },

  // ── Week 3 ──
  { name: 'LIVE Nurture — W3 Mon — Dizzee Rascal (pod)',
    subject: 'From the stage with Dizzee Rascal to personal training',
    preview: 'One of our favourite career-change stories.',
    body: `{$name|"there"}, this one's a proper story.

From a council estate, to performing on stage with Dizzee Rascal, to becoming a personal trainer. Proof there's no "right" background to do this — just a decision and the work.

🎧 ${POD_EP('from-council-estate-to-stage-with-dizzee-rascal-now-im-a-personal-trainer')}

Callum` },
  { name: 'LIVE Nurture — W3 Wed — Retention (value)',
    subject: 'The number that actually grows a PT business',
    preview: 'Hint: it\'s not new leads.',
    body: `{$name|"there"}, most struggling coaches think they have a lead problem. Usually they have a retention problem.

Keeping a client 12 months instead of 3 doesn't just triple their value — it gives you referrals, results to show, and a business that isn't a constant scramble for the next sign-up.

This week: look at why clients leave, not just how to get more. Fix that first.

We go deep on this with coaches who've done it on the live sessions — you're already on the list.

Callum` },
  { name: 'LIVE Nurture — W3 Fri — Shut down £500k (pod)',
    subject: 'Why I shut down my £500K online PT business',
    preview: 'The honest story behind walking away.',
    body: `{$name|"there"}, success isn't always what it looks like from the outside.

This episode is the honest story of building an online PT business to £500K — and choosing to shut it down. The lessons in here will save you years.

🎧 ${POD_EP('why-i-shut-down-my-500k-online-pt-business-the-honest-story')}

Callum` },

  // ── Week 4 ──
  { name: 'LIVE Nurture — W4 Mon — Gemma corporate (pod)',
    subject: 'How Gemma left her corporate job to become a PT',
    preview: 'If you\'re stuck at a desk wondering "what if".',
    body: `{$name|"there"}, if there's a version of you still sat at a desk wondering "what if" — listen to Gemma's story.

She left a corporate job to become a personal trainer. How she planned the exit, what surprised her, and what she'd tell anyone thinking about it.

🎧 ${POD_EP('how-gemma-left-her-corporate-job-to-become-a-personal-trainer')}

Callum` },
  { name: 'LIVE Nurture — W4 Wed — Not sure (book call)',
    subject: 'Not sure where to start?',
    preview: 'A 15-minute chat, no pitch.',
    body: `{$name|"there"}, if you've been thinking about getting qualified or going full-time but you're not sure what the right next step is for your situation — just talk to us.

Book a quick, no-pressure call. We'll give you a straight answer on the best route for you, even if that's "not yet".

👉 https://ptlaunchlab.co.uk/book-call

Or if you'd rather start anonymous, the 60-second quiz does a similar job: ${QUIZ}

Callum` },
  { name: 'LIVE Nurture — W4 Fri — AI-proof Sohail (pod)',
    subject: 'Why in-person PT will be AI-proof',
    preview: 'Sohail Rashid on the GLP-1 boom and what\'s next.',
    body: `{$name|"there"}, to round off the month — one of our sharpest conversations on where this industry is heading.

Sohail Rashid on why in-person coaching will be AI-proof, the GLP-1 weight-loss boom, and where the real opportunities are for coaches in 2026.

🎧 ${POD_EP('why-in-person-personal-training-will-be-ai-proof-sohail-rashid')}

And remember — we go even deeper on this live every month. You're on the list.

Callum` },
];

if (cmd === 'nurture') {
  const g = await findGroup();
  if (!g) { console.error('Live Sessions group not found — run setup-group first.'); process.exit(1); }
  await createDrafts(NURTURE, g.id);
  console.log('\nNurture drafts created. Schedule 3/week (Mon/Wed/Fri) to "Live Sessions" — pause during event week.');
}

if (cmd === 'welcome') {
  const g = await findGroup();
  if (!g) { console.error('Live Sessions group not found — run setup-group first.'); process.exit(1); }
  await createDrafts(WELCOME, g.id);
  console.log('\nWelcome drafts created. In MailerLite: build an Automation (trigger = joins "Live Sessions"),');
  console.log('then for each step duplicate the matching A1–A5 draft\'s content. Set delays 0 / 2d / 4d / 7d / 10d.');
}

if (cmd === 'campaigns') {
  const g = await findGroup();
  if (!g) { console.error('Live Sessions group not found — run setup-group first.'); process.exit(1); }
  const existing = (await ml('/campaigns?filter[status]=draft&limit=100')).data || [];
  for (const c of CAMPAIGNS) {
    if (existing.some((e) => e.name === c.name)) { console.log(`  ✓ exists, skipping: ${c.name}`); continue; }
    const res = await ml('/campaigns', 'POST', {
      name: c.name,
      type: 'regular',
      groups: [g.id],
      emails: [{ subject: c.subject, from_name: FROM_NAME, from: FROM, content: toHtml(c.body) }],
    });
    console.log(`  + created draft: ${c.name} (${res.data.id})`);
  }
  console.log('\nDrafts created. In MailerLite: paste the watch link, then schedule per the send plan.');
}
