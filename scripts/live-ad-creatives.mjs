#!/usr/bin/env node
/**
 * Generates the PT Launch Lab LIVE static ad creatives as on-brand HTML, then
 * renders each to PNG at Meta sizes via headless Chrome. Pure typography + SVG
 * icons on the brand palette — no AI image model, so text is always crisp and
 * the date is trivially editable (see DATE below).
 *
 *   node scripts/live-ad-creatives.mjs
 *
 * Output: ad-assets/live-july2026/<id>-<w>x<h>.png  (+ .html alongside for tweaks)
 *
 * The three concepts mirror the live Meta matrix: Saturated / Worth-It /
 * Contrarian. To move the event date, edit DATE — every creative updates.
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

// ── Event date — single knob ────────────────────────────────────────────────
const DATE = {
  dayLine1: 'WEDNESDAY',
  dayLine2: '29 JULY',
  dayInline: 'WED 29 JULY',       // eyebrow / footer strips
  dayShort: '29 July',            // sentence-case footer
  time: '8:00PM',
  tz: '(UK)',
};

// ── Brand ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A2137', deep: '#061726', gold: '#F5C518', red: '#E11D2A',
  white: '#FFFFFF', soft: '#AEBFD4', faint: '#8296AF', line: 'rgba(245,197,24,.30)',
};

// ── SVG icon set (stroke = currentColor) ────────────────────────────────────
const svg = (inner, sw = 2.2) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block">${inner}</svg>`;
const ICON = {
  calendar: svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  ticket: svg('<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"/><path d="M14 7v10"/>'),
  monitor: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>', 2.6),
  users: svg('<path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.2"/><path d="M22 20v-1a4 4 0 0 0-3-3.8"/><path d="M16 3.2A4 4 0 0 1 16 11"/>'),
  trend: svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>'),
  chat: svg('<path d="M21 11.5a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>'),
  play: svg('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>'),
  mic: svg('<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>'),
};

const g = (t) => `<span style="color:${C.gold}">${t}</span>`;

// ── Concepts ────────────────────────────────────────────────────────────────
const ADS = [
  {
    id: 'lead-saturated',
    variant: 'saturated',
    headline: [`EVERYONE SAYS PT IS`, `${g('SATURATED.')} THE PEOPLE`, `MAKING MONEY ${g('DISAGREE.')}`],
    sub: "Join 8 of the UK&rsquo;s leading fitness business owners for a live discussion on the future of the PT industry.",
    features: [
      ['check', 'Ask questions live'],
      ['users', 'Hear from 8 industry leaders'],
      ['trend', 'Discover where the opportunities are in 2026'],
    ],
    cta: 'RESERVE YOUR FREE SEAT',
  },
  {
    id: 'worth-it',
    variant: 'worthit',
    headline: [`IS BECOMING A PT STILL`, `${g('WORTH IT')} IN 2026?`, `WE&rsquo;RE SETTLING IT ${g('LIVE.')}`],
    sub: `Join a ${g('free')} live discussion on the future of the PT industry.`,
    checklist: [
      'Is becoming a PT still worth it?',
      'Where the biggest opportunities are in 2026.',
      'Ask your questions live.',
    ],
    cta: 'RESERVE MY FREE SEAT',
  },
  {
    id: 'contrarian',
    variant: 'contrarian',
    headline: [`MOST PTs ARE`, `WORRYING ABOUT`, `THE ${g('WRONG THINGS')}`, `IN 2026.`],
    sub: 'The people actually building fitness businesses are focused on something else entirely.',
    features: [
      ['chat', 'ASK QUESTIONS LIVE'],
      ['mic', 'LIVE PANEL DISCUSSION'],
      ['play', 'STREAMING ONLINE'],
    ],
    cta: 'REGISTER FREE',
  },
];

const SIZES = [[1080, 1080], [1080, 1920]];

// ── Shared bits ─────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700&family=Poppins:wght@400;500;600;700;800&display=swap');`;

const logo = (s = 1) => `
  <div style="font-family:'Barlow Condensed';font-weight:800;line-height:.82;letter-spacing:.5px;font-size:${34 * s}px">
    <span style="color:${C.white}">PT</span><br>
    <span style="color:${C.gold}">LAUNCH</span><br>
    <span style="color:${C.white}">LAB</span>
  </div>`;

const livePill = (s = 1) => `
  <div style="display:inline-flex;align-items:center;gap:${10 * s}px;background:${C.red};color:${C.white};
    font-family:'Barlow Condensed';font-weight:800;font-size:${34 * s}px;letter-spacing:1px;
    padding:${10 * s}px ${20 * s}px;border-radius:${8 * s}px">
    <span style="width:${16 * s}px;height:${16 * s}px;border-radius:50%;background:${C.white};display:inline-block"></span>LIVE
  </div>`;

const infoItem = (icon, label, s = 1) => `
  <div style="display:flex;align-items:center;gap:${10 * s}px;color:${C.gold}">
    <span style="font-size:${28 * s}px;flex:0 0 auto">${ICON[icon]}</span>
    <span style="font-family:'Barlow Condensed';font-weight:700;color:${C.white};font-size:${26 * s}px;line-height:1.05;letter-spacing:.5px">${label}</span>
  </div>`;

const cta = (label, s = 1) => `
  <div style="display:inline-flex;align-items:center;justify-content:center;gap:${16 * s}px;background:${C.gold};color:${C.deep};
    font-family:'Barlow Condensed';font-weight:800;font-size:${44 * s}px;letter-spacing:.5px;
    padding:${20 * s}px ${40 * s}px;border-radius:${12 * s}px">
    ${label} <span style="font-family:'Poppins';font-weight:700">&rarr;</span>
  </div>`;

const eyebrow = (s = 1) => `
  <div style="font-family:'Barlow Condensed';font-style:italic;font-weight:700;color:${C.gold};
    letter-spacing:1.5px;font-size:${30 * s}px">PT LAUNCH LAB LIVE &bull; ${DATE.dayInline} &bull; ${DATE.time.replace(':00', '')} &bull; FREE</div>`;

const headline = (lines, s = 1, size = 96) => lines.map((l) => `
  <div style="font-family:'Barlow Condensed';font-weight:800;color:${C.white};line-height:.94;
    font-size:${size * s}px;letter-spacing:-.5px">${l}</div>`).join('');

// ── Layout A — "Saturated" (full info header + feature row + dual footer) ─────
function saturated(ad, w, h) {
  const tall = h > w; const s = tall ? 1.12 : 1;
  const feat = ad.features.map(([ic, tx]) => `
    <div style="display:flex;align-items:center;gap:${14 * s}px;flex:1">
      <span style="font-size:${34 * s}px;color:${C.gold};flex:0 0 auto">${ICON[ic]}</span>
      <span style="font-family:'Poppins';font-weight:500;color:${C.white};font-size:${21 * s}px;line-height:1.2">${tx}</span>
    </div>`).join(`<div style="width:1px;background:${C.line};align-self:stretch"></div>`);
  return `
  <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:${tall ? 84 : 60}px ${58}px;box-sizing:border-box">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px">
      <div style="display:flex;align-items:center;gap:${28 * s}px">${logo(s)}${livePill(s)}</div>
      <div style="text-align:left;display:flex;flex-direction:column;gap:${8 * s}px">
        <div style="font-family:'Barlow Condensed';font-weight:800;color:${C.gold};font-size:${26 * s}px;line-height:1;letter-spacing:.5px">LIVE ONLINE<br>PANEL DISCUSSION</div>
        ${infoItem('calendar', `${DATE.dayLine1} ${DATE.dayLine2}`, s * .9)}
        ${infoItem('clock', `${DATE.time} ${DATE.tz}`, s * .9)}
        ${infoItem('ticket', 'FREE TO ATTEND', s * .9)}
      </div>
    </div>
    <div style="margin:${tall ? 40 : 8}px 0">
      ${headline(ad.headline, s, tall ? 92 : 88)}
      <div style="height:5px;width:${140 * s}px;background:${C.gold};margin:${28 * s}px 0 ${22 * s}px"></div>
      <div style="font-family:'Poppins';font-weight:500;color:${C.soft};font-size:${26 * s}px;line-height:1.45;max-width:${820 * s}px">${ad.sub}</div>
    </div>
    <div style="display:flex;align-items:center;gap:${18 * s}px;padding:${20 * s}px 0;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}">${feat}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:${20 * s}px">
      ${cta(ad.cta, s)}
      <div style="font-family:'Poppins';font-weight:600;color:${C.faint};font-size:${20 * s}px;text-align:right">Instant confirmation.<br>ptlaunchlab.co.uk/live</div>
    </div>
  </div>`;
}

// ── Layout B — "Worth It" (outlined date pill + checklist) ────────────────────
function worthit(ad, w, h) {
  const tall = h > w; const s = tall ? 1.12 : 1;
  const rows = ad.checklist.map((t) => `
    <div style="display:flex;align-items:center;gap:${18 * s}px;padding:${14 * s}px 0;border-bottom:1px solid ${C.line}">
      <span style="font-size:${30 * s}px;color:${C.gold};flex:0 0 auto">${ICON.check}</span>
      <span style="font-family:'Poppins';font-weight:500;color:${C.white};font-size:${28 * s}px">${t}</span>
    </div>`).join('');
  return `
  <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:${tall ? 84 : 60}px ${58}px;box-sizing:border-box">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
      ${logo(s)}
      <div style="display:flex;flex-direction:column;align-items:center;gap:${4 * s}px;border:2px solid ${C.line};border-radius:${16 * s}px;padding:${14 * s}px ${26 * s}px">
        <div style="display:flex;align-items:center;gap:${10 * s}px;font-family:'Barlow Condensed';font-weight:800;color:${C.white};font-size:${28 * s}px;letter-spacing:.5px">
          <span style="width:${14 * s}px;height:${14 * s}px;border-radius:50%;background:${C.red};display:inline-block"></span>LIVE ONLINE DISCUSSION</div>
        <div style="font-family:'Barlow Condensed';font-weight:700;color:${C.gold};font-size:${24 * s}px;letter-spacing:1px">${DATE.dayLine1} ${DATE.dayLine2} &bull; ${DATE.time} &bull; FREE</div>
      </div>
    </div>
    <div style="margin:${tall ? 30 : 4}px 0">
      ${headline(ad.headline, s, tall ? 98 : 94)}
    </div>
    <div>
      <div style="font-family:'Poppins';font-weight:600;color:${C.soft};font-size:${28 * s}px;margin-bottom:${18 * s}px">${ad.sub}</div>
      ${rows}
    </div>
    <div style="margin-top:${28 * s}px">
      ${cta(ad.cta, s)}
      <div style="text-align:center;font-family:'Poppins';font-weight:600;color:${C.faint};font-size:${22 * s}px;margin-top:${22 * s}px;letter-spacing:.5px">
        Live online &bull; ${DATE.dayShort} &bull; 8PM &bull; Free<br>
        <span style="color:${C.soft}">ptlaunchlab.co.uk/${g('live')}</span>
      </div>
    </div>
  </div>`;
}

// ── Layout C — "Contrarian" (red event bar + info strip + brush banner) ───────
function contrarian(ad, w, h) {
  const tall = h > w; const s = tall ? 1.12 : 1;
  const feat = ad.features.map(([ic, tx]) => `
    <div style="display:flex;align-items:center;gap:${12 * s}px;flex:1">
      <span style="font-size:${30 * s}px;color:${C.gold};flex:0 0 auto">${ICON[ic]}</span>
      <span style="font-family:'Barlow Condensed';font-weight:700;color:${C.white};font-size:${24 * s}px;line-height:1.05;letter-spacing:.5px">${tx}</span>
    </div>`).join(`<div style="width:1px;background:${C.line};align-self:stretch"></div>`);
  const bar = (icon, label) => `
    <div style="display:flex;align-items:center;gap:${10 * s}px;flex:1;justify-content:center">
      <span style="font-size:${28 * s}px;color:${C.gold};flex:0 0 auto">${ICON[icon]}</span>
      <span style="font-family:'Barlow Condensed';font-weight:700;color:${C.white};font-size:${24 * s}px;line-height:1.05;letter-spacing:.5px">${label}</span>
    </div>`;
  return `
  <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:${tall ? 80 : 56}px ${54}px;box-sizing:border-box">
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
        ${logo(s)}
        <div style="display:inline-flex;align-items:center;gap:${12 * s}px;background:${C.red};color:${C.white};
          font-family:'Barlow Condensed';font-weight:800;font-size:${34 * s}px;letter-spacing:1px;padding:${10 * s}px ${24 * s}px;border-radius:${8 * s}px">
          <span style="width:${16 * s}px;height:${16 * s}px;border-radius:50%;background:${C.white};display:inline-block"></span>LIVE ONLINE EVENT</div>
      </div>
      <div style="display:flex;align-items:center;gap:${8 * s}px;border:2px solid ${C.line};border-radius:${14 * s}px;padding:${16 * s}px ${18 * s}px;margin-top:${26 * s}px">
        ${bar('calendar', `${DATE.dayLine1} ${DATE.dayLine2}`)}
        <div style="width:1px;background:${C.line};align-self:stretch"></div>
        ${bar('clock', `${DATE.time} ${DATE.tz}`)}
        <div style="width:1px;background:${C.line};align-self:stretch"></div>
        ${bar('monitor', 'LIVE ONLINE')}
        <div style="width:1px;background:${C.line};align-self:stretch"></div>
        ${bar('ticket', 'FREE')}
      </div>
    </div>
    <div>
      ${eyebrow(s)}
      <div style="margin-top:${16 * s}px">${headline(ad.headline, s, tall ? 96 : 90)}</div>
      <div style="font-family:'Poppins';font-weight:500;color:${C.soft};font-size:${26 * s}px;line-height:1.45;max-width:${760 * s}px;margin-top:${22 * s}px">${ad.sub}</div>
    </div>
    <div style="display:flex;align-items:center;gap:${16 * s}px;padding:${18 * s}px 0;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}">${feat}</div>
    <div>
      <div style="text-align:center;margin-bottom:${18 * s}px">
        <span style="display:inline-block;background:${C.gold};color:${C.deep};font-family:'Barlow Condensed';font-style:italic;font-weight:800;
          font-size:${28 * s}px;letter-spacing:1px;padding:${8 * s}px ${28 * s}px;transform:skewX(-6deg)">LIVE &bull; NOT PRE-RECORDED</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
        ${cta(ad.cta, s)}
        <div style="display:flex;align-items:center;gap:${10 * s}px;font-family:'Poppins';font-weight:600;color:${C.faint};font-size:${22 * s}px">
          <span style="font-size:${24 * s}px;color:${C.faint}">${ICON.globe}</span>ptlaunchlab.co.uk/live</div>
      </div>
    </div>
  </div>`;
}

const LAYOUT = { saturated, worthit, contrarian };

function page(ad, w, h) {
  const inner = LAYOUT[ad.variant](ad, w, h);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONTS}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${w}px;height:${h}px}
    body{background:radial-gradient(130% 100% at 78% -10%, ${C.bg} 0%, ${C.bg} 40%, ${C.deep} 100%);overflow:hidden;-webkit-font-smoothing:antialiased}
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
      `--screenshot=${pngPath}`, `--window-size=${w},${h}`, '--virtual-time-budget=8000',
      `file:///${htmlPath.replace(/\\/g, '/')}`,
    ], { stdio: 'ignore' });
    made.push(pngPath);
    console.log('OK', `${base}.png`);
  }
}
console.log(`\nRendered ${made.length} creatives to ad-assets/live-july2026/`);
