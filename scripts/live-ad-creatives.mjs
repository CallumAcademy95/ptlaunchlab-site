#!/usr/bin/env node
/**
 * Generates PT Launch Lab LIVE static ad creatives as on-brand HTML, then
 * renders each to PNG at Meta sizes via headless Chrome. Pure typography +
 * brand palette — no AI image model (crisp text, fully editable).
 *
 *   node scripts/live-ad-creatives.mjs
 *
 * Output: ad-assets/live-july2026/<id>-<w>x<h>.png  (+ .html alongside for tweaks)
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'ad-assets', 'live-july2026');
mkdirSync(OUT, { recursive: true });

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));
if (!CHROME) { console.error('No Chrome/Edge found'); process.exit(1); }

// ── Brand ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#072B4A', deep: '#051D33', card: '#0D3559', cardAlt: '#102342',
  gold: '#F5C518', blue: '#3B82F6', white: '#FFFFFF', soft: '#B4C2D6', faint: '#8FA4BD',
};
const SPEAKERS = [
  ['Callum Brown', 'PT Launch Lab'], ['Ryan Robinson', 'PT Launch Lab'], ['Miles Halstead', 'PT Launch Lab'],
  ['Jerome Scherrer', 'Muscle Mechanics'], ['Sam Hinks', 'SJH Coaching'], ['Tom Blackman', 'Ministry of Fitness'],
  ['Aaron Caseley', 'MOFO Body Mechanic'], ['Sohail Rashid', 'Brawn'],
];
const EYEBROW = 'PT LAUNCH LAB LIVE · WED 22 JULY · 8PM · FREE';

// gold helper
const g = (t) => `<span style="color:${C.gold}">${t}</span>`;

// ── Ad concepts ───────────────────────────────────────────────────────────────
// kind: 'hook' (eyebrow+headline+sub+cta) or 'grid' (speaker grid)
const ADS = [
  {
    id: 'lead-saturated', kind: 'hook',
    headline: `EVERYONE SAYS PT IS ${g('SATURATED.')}`,
    headline2: `THE PEOPLE MAKING MONEY ${g('DISAGREE.')}`,
    sub: '8 UK gym owners &amp; coaches. One live discussion. Your questions, answered.',
  },
  {
    id: 'glp1', kind: 'hook',
    headline: `${g('OZEMPIC.')} AI. SATURATION.`,
    headline2: `WHAT IT ACTUALLY MEANS FOR PTs.`,
    sub: 'A live, unfiltered panel on where the fitness industry is really heading in 2026.',
  },
  {
    id: 'worth-it', kind: 'hook',
    headline: `IS BECOMING A PT STILL ${g('WORTH IT')} IN 2026?`,
    headline2: `WE&rsquo;RE SETTLING IT ${g('LIVE.')}`,
    sub: 'Saturation · GLP-1 drugs · where the money is · where it&rsquo;s heading. Plus live Q&amp;A.',
  },
  {
    id: 'authority-grid', kind: 'grid',
    title: `THE REAL STATE OF THE ${g('PT INDUSTRY')} IN 2026`,
    strap: '8 fitness industry leaders. One live discussion. No fluff.',
  },
];

const SIZES = [[1080, 1080], [1080, 1920]];

// ── HTML ──────────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

const logo = (scale = 1) => `
  <div style="display:inline-block;background:${C.gold};color:${C.bg};font-family:'Barlow Condensed';font-weight:800;
    line-height:.84;letter-spacing:.5px;padding:${14 * scale}px ${16 * scale}px;font-size:${30 * scale}px;border-radius:${4 * scale}px">
    PT<br>LAUNCH<br>LAB
  </div>`;

const cta = (scale = 1) => `
  <div style="display:inline-flex;align-items:center;gap:${14 * scale}px;background:${C.gold};color:${C.bg};
    font-family:'Poppins';font-weight:700;font-size:${30 * scale}px;padding:${20 * scale}px ${34 * scale}px;border-radius:${10 * scale}px">
    Register free <span style="font-size:${34 * scale}px;line-height:0">&rarr;</span>
  </div>`;

function hookHtml(ad, w, h) {
  const tall = h > w;
  const s = tall ? 1.18 : 1;
  const hSize = tall ? 118 : 104;
  return `
  <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;
    padding:${tall ? 96 : 72}px ${72}px;box-sizing:border-box">
    <div>
      ${logo(s)}
      <div style="margin-top:${tall ? 70 : 44}px;font-family:'Poppins';font-weight:700;color:${C.gold};
        letter-spacing:3px;font-size:${22 * s}px">${EYEBROW}</div>
    </div>
    <div>
      <div style="font-family:'Barlow Condensed';font-weight:800;color:${C.white};line-height:.92;
        font-size:${hSize}px;letter-spacing:-.5px">${ad.headline}</div>
      <div style="font-family:'Barlow Condensed';font-weight:800;color:${C.white};line-height:.92;
        font-size:${hSize}px;letter-spacing:-.5px;margin-top:${10}px">${ad.headline2}</div>
      <div style="height:5px;width:${120}px;background:${C.gold};opacity:.6;margin:${tall ? 48 : 34}px 0"></div>
      <div style="font-family:'Poppins';font-weight:500;color:${C.soft};font-size:${30 * s}px;line-height:1.4;max-width:900px">${ad.sub}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      ${cta(s)}
      <div style="font-family:'Poppins';font-weight:600;color:${C.faint};font-size:${20 * s}px;text-align:right">ptlaunchlab.co.uk/live</div>
    </div>
  </div>`;
}

function gridHtml(ad, w, h) {
  const tall = h > w;
  const s = tall ? 1.15 : 1;
  const cards = SPEAKERS.map(([n, o]) => {
    const initials = n.split(' ').map((x) => x[0]).join('');
    return `
    <div style="display:flex;align-items:center;gap:${16 * s}px;background:${C.card};border:1px solid rgba(245,197,24,.25);
      border-radius:${12 * s}px;padding:${16 * s}px ${18 * s}px">
      <div style="flex:0 0 auto;width:${64 * s}px;height:${64 * s}px;border-radius:50%;background:${C.cardAlt};
        border:2px solid ${C.gold};display:flex;align-items:center;justify-content:center;
        font-family:'Barlow Condensed';font-weight:800;color:${C.gold};font-size:${26 * s}px">${initials}</div>
      <div style="min-width:0">
        <div style="font-family:'Barlow Condensed';font-weight:700;color:${C.white};font-size:${28 * s}px;line-height:1">${n}</div>
        <div style="font-family:'Poppins';font-weight:500;color:${C.faint};font-size:${18 * s}px;margin-top:${4 * s}px">${o}</div>
      </div>
    </div>`;
  }).join('');
  return `
  <div style="display:flex;flex-direction:column;height:100%;padding:${tall ? 90 : 64}px ${64}px;box-sizing:border-box">
    <div style="display:flex;align-items:flex-start;justify-content:space-between">
      ${logo(s)}
      <div style="font-family:'Poppins';font-weight:700;color:${C.gold};letter-spacing:2px;font-size:${20 * s}px;text-align:right;max-width:520px">${EYEBROW}</div>
    </div>
    <div style="font-family:'Barlow Condensed';font-weight:800;color:${C.white};line-height:.94;
      font-size:${tall ? 84 : 76}px;letter-spacing:-.5px;margin:${tall ? 56 : 38}px 0 ${10}px">${ad.title}</div>
    <div style="font-family:'Poppins';font-weight:500;color:${C.soft};font-size:${26 * s}px;margin-bottom:${tall ? 50 : 34}px">${ad.strap}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:${16 * s}px">${cards}</div>
    <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:${tall ? 50 : 34}px">
      ${cta(s)}
      <div style="font-family:'Poppins';font-weight:600;color:${C.faint};font-size:${20 * s}px">ptlaunchlab.co.uk/live</div>
    </div>
  </div>`;
}

function page(ad, w, h) {
  const inner = ad.kind === 'grid' ? gridHtml(ad, w, h) : hookHtml(ad, w, h);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONTS}
    *{margin:0;padding:0}
    html,body{width:${w}px;height:${h}px}
    body{background:radial-gradient(120% 90% at 80% 0%, ${C.card} 0%, ${C.bg} 45%, ${C.deep} 100%);overflow:hidden}
  </style></head><body>${inner}</body></html>`;
}

// ── Render ──────────────────────────────────────────────────────────────────
const made = [];
for (const ad of ADS) {
  for (const [w, h] of SIZES) {
    const base = `${ad.id}-${w}x${h}`;
    const htmlPath = join(OUT, `${base}.html`);
    const pngPath = join(OUT, `${base}.png`);
    writeFileSync(htmlPath, page(ad, w, h));
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      `--screenshot=${pngPath}`, `--window-size=${w},${h}`, '--virtual-time-budget=6000',
      '--default-background-color=00000000',
      `file:///${htmlPath.replace(/\\/g, '/')}`,
    ], { stdio: 'ignore' });
    made.push(pngPath);
    console.log('✓', `${base}.png`);
  }
}
console.log(`\nRendered ${made.length} creatives to ad-assets/live-july2026/`);
