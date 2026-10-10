/**
 * Partner print kit: member handout, academy poster, and the shared gym
 * partner handbook.
 *
 *   node --use-system-ca scripts/partner-print-kit.mjs              # every gym + handbook
 *   node --use-system-ca scripts/partner-print-kit.mjs ebor 6fit    # some gyms (+ handbook)
 *   node --use-system-ca scripts/partner-print-kit.mjs --handbook   # handbook only
 *
 * Output: ad-assets/partner-kit/<slug>/
 *           member-handout.pdf         A4, gym-branded (category learner)
 *           academy-poster.png         A3 proportions, for the portal thumbnail
 *           academy-poster-a3.pdf      297×420mm, print-ready
 *         ad-assets/partner-kit/shared/gym-partner-handbook.pdf
 *
 * WHITE LABEL. The handout and poster are member-facing: they are the gym's
 * academy and never name PT Launch Lab. The regulatory line (NCFE centre
 * number, Ofqual) stays. The handbook is addressed to the gym OWNER, so it may.
 *
 * PRICE ORDER. Pay in full leads everywhere: £999.99 is the headline, the
 * monthly plan is the secondary line, never above it and never bigger. Prices
 * come from app/lib/pricing.ts, the one place the site reads them from.
 *
 * Every member-facing string is checked by memberCopyProblems() before Chrome
 * renders a pixel: no brand leak, no codes, no intakes or deadlines, no
 * "guaranteed interview", no retired platform name.
 */
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { chromium } from "playwright";
import {
  COURSE_PRICE_LABEL,
  MONTHLY_PRICE_LABEL,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  PARTNER_FEE_PENCE,
  PARTNER_FEE_RELEASE_PAYMENT,
  formatPence,
} from "../app/lib/pricing.ts";
import { accentFor, contrastRatio, logoTreatmentFor } from "./lib/ad-guards.mjs";
import {
  LADDER_MONTHLY_COMMISSION_PENCE,
  LADDER_PIF_COMMISSION_PENCE,
  MAX_MEMBER_SAVING_PENCE,
  VOLUME_BONUS_MONTHLY_PENCE,
  VOLUME_BONUS_PIF_PENCE,
  VOLUME_THRESHOLD,
} from "../app/lib/partnerCommission.ts";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();
const ORIGIN = "https://ptlaunchlab.co.uk";
const OUT_ROOT = path.join(ROOT, "ad-assets", "partner-kit");
const REG_LINE = "NCFE Accredited Centre No. 9002788 · Ofqual regulated";
const MONTHLY_TOTAL = formatPence(MONTHLY_PLAN_TOTAL_PENCE);
const FEE_PIF = formatPence(LADDER_PIF_COMMISSION_PENCE);
const FEE_MONTHLY = formatPence(LADDER_MONTHLY_COMMISSION_PENCE);
const FEE_PIF_VOL = formatPence(LADDER_PIF_COMMISSION_PENCE + VOLUME_BONUS_PIF_PENCE);
const FEE_MONTHLY_VOL = formatPence(LADDER_MONTHLY_COMMISSION_PENCE + VOLUME_BONUS_MONTHLY_PENCE);
const ORDINAL = { 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th" };

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

const args = process.argv.slice(2);
const handbookOnly = args.includes("--handbook");
const only = args.filter((a) => !a.startsWith("--"));

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Images go in as data URIs: Playwright's setContent() page has an
 * about:blank origin, and Chrome will not load file:// images from it.
 */
function fileUrl(abs) {
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mime};base64,${readFileSync(abs).toString("base64")}`;
}

function logoUrl(brand) {
  const abs = path.join(ROOT, "public", brand.logoUrl.replace(/^\//, ""));
  if (!existsSync(abs)) throw new Error(`missing logo: ${abs}`);
  return fileUrl(abs);
}

/** The gym's OWN photo, or none. Never the shared stock set — see gym-ad-creatives.mjs. */
function ownPhoto(slug) {
  const dir = path.join(ROOT, "partner-photos", slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.length ? fileUrl(path.join(dir, files[0])) : null;
}

/** A brand colour that reads as text on white paper (≥3:1), or near-black. */
function accentOnLight(brand) {
  for (const c of [brand.primaryColor, brand.sectionBg, brand.darkAccent]) {
    if (c && contrastRatio(c, "#FFFFFF") >= 3) return c;
  }
  return "#111111";
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function enrolUrl(brand) {
  return `${ORIGIN}${brand.canonicalPath}/enrol`;
}

async function qrSvg(url) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 0, color: { dark: "#000000", light: "#FFFFFF" } });
}

/**
 * What member-facing copy must never say. Run over the visible text of the
 * page (tags stripped), so it checks what a member would actually read.
 */
export function memberCopyProblems(text) {
  const rules = [
    // \s+, not \s*: the enrol URL's domain (ptlaunchlab.co.uk) is an address,
    // not the brand name, and every QR on this material resolves to it anyway.
    [/PT\s+Launch\s+Lab/i, "names PT Launch Lab"],
    [/powered by/i, "\"Powered by\" line"],
    [/\b(promo|discount|voucher)\s*code|\bcode\b/i, "mentions a code"],
    [/\bintakes?\b/i, "mentions an intake"],
    [/guaranteed\s+interview|interview\s+guarantee/i, "guaranteed interview"],
    [/\bmerve\b/i, "retired platform name"],
    [/black friday|deadline|ends (soon|on|midnight)|limited (time|places|spaces)|£\d+\s*off|was £/i, "dated offer or discount"],
  ];
  const problems = [];
  for (const [re, label] of rules) if (re.test(text)) problems.push(label);
  return problems;
}

function visibleText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

// ── member handout (A4, gym-branded) ──────────────────────────────────────

function handoutHtml(brand, qr) {
  const gym = esc(brand.gymName);
  const dark = brand.heroBg || "#000000";
  const onDark = accentFor(brand);
  const ink = accentOnLight(brand);
  const plate = logoTreatmentFor(brand) === "plate";
  const url = enrolUrl(brand).replace(/^https:\/\//, "");
  const footer = `<div class="foot"><span>${gym} PT Academy</span><span>${REG_LINE}</span></div>`;

  const qa = [
    ["Do I need any experience?", "No. The course starts at Level 2, the foundations, and builds to Level 3."],
    ["Do I have to give up my job?", "No. It is studied online and at your own pace, built for people already working full-time."],
    ["How long does it take?", "Most learners finish in 8–16 weeks. Because it is self-paced, you can go faster or slower around work and family."],
    ["Is the qualification recognised?", "Yes. Both are NCFE qualifications, regulated by Ofqual and recognised across the fitness industry."],
    ["What happens when I qualify?", "We approach at least one gym on your behalf and introduce you: a gym in the partner network, or one local to you. Whether a gym interviews or takes you on is its decision, and PT work is usually self-employed rather than a salaried job."],
    ["Can I spread the cost?", `Yes. ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}, no interest. The first is taken when you enrol, then one a month (${MONTHLY_TOTAL} in total).`],
    ["What if I change my mind?", "You can cancel within 14 days of paying, for any reason, and get a full refund. Email the address on your enrolment confirmation."],
  ];

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{font-family:Poppins,sans-serif;color:#1b1f27;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
.hero{background:${dark};color:#fff;padding:16mm 16mm 13mm;position:relative}
.hero:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3mm;background:${onDark}}
.logo{height:17mm;max-width:70mm;object-fit:contain;object-position:left center;display:block}
.plate{display:inline-block;${plate ? "background:#fff;padding:2.5mm 3.5mm;border-radius:2.5mm;" : ""}}
.eyebrow{margin-top:7mm;font-weight:600;letter-spacing:.18em;font-size:9.5pt;color:${onDark};text-transform:uppercase}
h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;font-size:40pt;line-height:.95;margin-top:3mm}
h1 .hl{color:${onDark}}
.lede{margin-top:5mm;font-size:11.5pt;line-height:1.5;color:#dfe5ee;max-width:160mm}
.body{padding:10mm 16mm 0}
h2{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;font-size:20pt;letter-spacing:.01em;color:#0d1117;margin-bottom:4mm}
h2 .hl{color:${ink}}
.price{display:flex;gap:5mm;align-items:stretch}
.lead{flex:1.35;border:2.2px solid ${ink};border-radius:4mm;padding:6mm 7mm}
.alt{flex:1;border:1px solid #d9dee6;border-radius:4mm;padding:6mm 6mm;background:#f6f7f9}
.tag{font-size:8pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${ink}}
.alt .tag{color:#6b7380}
.big{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:46pt;line-height:1;color:${ink};margin-top:2mm}
.mid{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:22pt;line-height:1.05;color:#0d1117;margin-top:2.5mm}
.small{font-size:9pt;color:#4b5563;line-height:1.45;margin-top:2mm}
.enrol{display:flex;gap:7mm;align-items:center;margin-top:9mm;background:#f6f7f9;border-radius:4mm;padding:6mm 7mm}
.qr{width:38mm;height:38mm;flex:none;background:#fff;padding:2.5mm;border-radius:2mm;border:1px solid #e3e6eb}
.qr svg{width:100%;height:100%;display:block}
ol{padding-left:5mm;font-size:10pt;line-height:1.55}
ol li{margin-bottom:1.2mm}
.url{font-weight:700;color:${ink};font-size:11pt;word-break:break-all;margin-top:2mm}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.card{border:1px solid #e3e6eb;border-radius:3.5mm;padding:5mm 5.5mm}
.card h3{font-size:11pt;font-weight:700;color:#0d1117;margin-bottom:1.5mm}
.card p{font-size:9.3pt;line-height:1.5;color:#374151}
ul.ticks{list-style:none;font-size:9.8pt;line-height:1.5}
ul.ticks li{padding-left:6mm;position:relative;margin-bottom:1.6mm}
ul.ticks li:before{content:"✔";position:absolute;left:0;color:${ink};font-weight:700}
.section{margin-top:8mm}
.qa{margin-bottom:3.6mm}
.qa b{display:block;font-size:10.2pt;color:#0d1117;margin-bottom:.6mm}
.qa span{font-size:9.4pt;line-height:1.5;color:#374151}
.note{margin-top:6mm;border-left:3px solid ${ink};padding:3mm 5mm;background:#f6f7f9;font-size:9.4pt;line-height:1.5}
.fine{font-size:7.6pt;line-height:1.45;color:#6b7380;margin-top:5mm}
.foot{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7.8pt;color:#6b7380;border-top:1px solid #e3e6eb;padding-top:2.5mm}
</style></head><body>

<section class="page">
  <div class="hero">
    <div class="plate"><img class="logo" src="${logoUrl(brand)}"></div>
    <div class="eyebrow">${gym} PT Academy</div>
    <h1>Become a qualified<br><span class="hl">Personal Trainer.</span></h1>
    <p class="lede">Two qualifications, one course: the NCFE Level 2 Certificate in Gym Instructing and the Level 3 Certificate in Personal Training. Studied online, around the job you already have.</p>
  </div>
  <div class="body">
    <h2>What it <span class="hl">costs</span></h2>
    <div class="price">
      <div class="lead">
        <div class="tag">Pay in full</div>
        <div class="big">${COURSE_PRICE_LABEL}</div>
        <div class="small">One payment. Nothing further to pay. Everything in this handout is included.</div>
      </div>
      <div class="alt">
        <div class="tag">Or spread the cost</div>
        <div class="mid">or ${MONTHLY_PRICE_LABEL} a month<br>for ${MONTHLY_PAYMENTS} months</div>
        <div class="small">No interest. First payment when you enrol, ${MONTHLY_TOTAL} in total.</div>
      </div>
    </div>
    <p class="small" style="margin-top:3mm">One price for everyone, and no closing dates. You can enrol and start any time.</p>

    <div class="enrol">
      <div class="qr">${qr}</div>
      <div>
        <h2 style="margin-bottom:2mm">How to <span class="hl">enrol</span></h2>
        <ol>
          <li>Scan the QR or go to the address below.</li>
          <li>Choose to pay in full or monthly.</li>
          <li>Pay securely online. It takes a few minutes.</li>
          <li>Your personal tutor is in touch within 24 hours and you start straight away.</li>
        </ol>
        <div class="url">${esc(url)}</div>
      </div>
    </div>
  </div>
  ${footer}
</section>

<section class="page">
  <div class="body" style="padding-top:16mm">
    <h2>What's <span class="hl">included</span></h2>
    <div class="grid">
      <div class="card"><h3>Full PT qualification</h3><p>NCFE Level 2 Certificate in Gym Instructing and Level 3 Certificate in Personal Training. Industry recognised and Ofqual regulated.</p></div>
      <div class="card"><h3>A personal tutor</h3><p>Introduced within 24 hours of enrolling. They check in, keep you on track and review your work.</p></div>
      <div class="card"><h3>Mentorship included</h3><p>Support throughout your qualification, real-world advice from industry pros, and how to actually succeed as a PT.</p></div>
      <div class="card"><h3>A gym introduction</h3><p>On qualifying, we approach at least one gym on your behalf and introduce you: a gym in the partner network, or one local to you.</p></div>
    </div>

    <div class="section">
      <h2>How it's <span class="hl">delivered</span></h2>
      <ul class="ticks">
        <li><b>100% online, at your own pace.</b> Your course lives on Praxel, our learning platform, on your phone, tablet or laptop.</li>
        <li><b>Practical units are video-assessed.</b> You film yourself coaching and demonstrating exercises, and a qualified assessor reviews it against the same standards as a classroom assessment.</li>
        <li><b>Built around a full-time job.</b> Most learners finish in 8–16 weeks. You don't quit anything to start.</li>
        <li><b>Your academy is ${gym}.</b> You can practise what you learn on the gym floor where you already train.</li>
      </ul>
    </div>

    <div class="section">
      <h2>Who it's <span class="hl">for</span></h2>
      <div class="grid">
        <ul class="ticks">
          <li>You love training</li>
          <li>You want more freedom</li>
          <li>You're stuck in a job you don't enjoy</li>
          <li>You want to earn from fitness</li>
        </ul>
        <div class="card" style="background:#f6f7f9"><h3>You don't need to</h3><p>Quit your job to start, have any experience, or be the fittest person in the gym. You just need to start.</p></div>
      </div>
    </div>

    <div class="note"><b>14-day cooling-off.</b> If you change your mind within 14 days of paying, tell us and you get a full refund, no reason needed.</div>
  </div>
  ${footer}
</section>

<section class="page">
  <div class="body" style="padding-top:16mm">
    <h2>Common <span class="hl">questions</span></h2>
    ${qa.map(([q, a]) => `<div class="qa"><b>${esc(q)}</b><span>${esc(a)}</span></div>`).join("")}

    <div class="enrol" style="margin-top:6mm">
      <div class="qr" style="width:30mm;height:30mm">${qr}</div>
      <div>
        <div class="tag">Ready when you are</div>
        <div class="mid" style="font-size:20pt"><span style="color:${ink}">${COURSE_PRICE_LABEL}</span> in full</div>
        <div class="small" style="margin-top:1mm">or ${MONTHLY_PRICE_LABEL} a month for ${MONTHLY_PAYMENTS} months</div>
        <div class="url">${esc(url)}</div>
      </div>
    </div>

    <p class="fine">Training, assessment and certification are provided by our accredited training centre, not by ${gym} staff. A gym introduction is not a guarantee of employment; any arrangement with a gym is between you and that gym, and PT work is usually on a self-employed basis. If you pay monthly and cancel after the 14-day cooling-off period, payments already made are not refundable, and you are not charged any payment not yet taken. Full terms at ptlaunchlab.co.uk/terms.</p>
  </div>
  ${footer}
</section>

</body></html>`;
}

// ── academy poster (A3) ───────────────────────────────────────────────────

/** 297×420mm at 96dpi. The PDF prints at exactly A3; the PNG renders at 2×. */
const A3 = { w: 1123, h: 1587 };

function posterHtml(brand, qr, photo) {
  const gym = esc(brand.gymName);
  const accent = accentFor(brand);
  const bg = brand.heroBg || "#000000";
  const plate = logoTreatmentFor(brand) === "plate";
  const url = enrolUrl(brand).replace(/^https:\/\//, "");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
@page{size:297mm 420mm;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${A3.w}px;height:${A3.h}px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:${bg};font-family:Poppins,sans-serif;color:#fff;position:relative;overflow:hidden;text-align:center}
.photo{position:absolute;inset:0;background:url('${photo ?? ""}') center/cover no-repeat;filter:grayscale(1) brightness(.34) contrast(1.05)}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%, ${accent}33, transparent 60%)}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.15) 40%,rgba(0,0,0,.65))}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:78px 70px 0}
.plate{${plate ? "background:#fff;padding:14px 20px;border-radius:14px;" : ""}display:inline-block}
.logo{height:${plate ? 112 : 124}px;max-width:520px;object-fit:contain;display:block}
h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;line-height:.9;margin-top:34px}
h1 .a{display:block;font-size:178px;color:#fff;letter-spacing:-.005em}
h1 .b{display:block;font-size:178px;color:${accent};letter-spacing:-.005em}
.sub{font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;font-size:44px;line-height:1.18;margin-top:28px}
.qr{margin-top:36px;width:372px;height:372px;background:#fff;padding:24px}
.qr svg{width:100%;height:100%;display:block}
.scan{font-weight:600;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#cfd6e0;margin-top:16px}
.price{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:150px;line-height:.95;color:${accent};margin-top:26px}
.monthly{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:40px;text-transform:uppercase;letter-spacing:.02em;color:#fff;margin-top:6px}
.url{font-size:21px;color:#cfd6e0;margin-top:14px}
.foot{position:absolute;left:60px;right:60px;bottom:44px;display:flex;align-items:center;justify-content:space-between;gap:24px;text-align:left}
.foot .name{font-weight:700;font-size:28px}
.foot .reg{font-size:15px;color:#aab3c0;text-align:right}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:${accent}}
</style></head><body>
${photo ? `<div class="photo"></div><div class="shade"></div>` : `<div class="glow"></div>`}
<div class="wrap">
  <div class="plate"><img class="logo" src="${logoUrl(brand)}"></div>
  <h1><span class="a">Want to</span><span class="b">become a PT?</span></h1>
  <div class="sub">Train where you already train.<br>Qualify without leaving this gym.</div>
  <div class="qr">${qr}</div>
  <div class="scan">Scan to enrol</div>
  <div class="price">${COURSE_PRICE_LABEL}</div>
  <div class="monthly">or ${MONTHLY_PRICE_LABEL} a month for ${MONTHLY_PAYMENTS} months</div>
  <div class="url">${esc(url)}</div>
</div>
<div class="foot"><div class="name">${gym} PT Academy</div><div class="reg">${REG_LINE}</div></div>
<div class="bar"></div>
</body></html>`;
}

// ── partner handbook (A4, owner-facing, PT Launch Lab branded) ────────────

function handbookHtml() {
  const NAVY = "#070D1B";
  const GOLD = "#F5C518";
  const nth = ORDINAL[PARTNER_FEE_RELEASE_PAYMENT] ?? `${PARTNER_FEE_RELEASE_PAYMENT}th`;
  const foot = (n) => `<div class="foot"><span>PT Launch Lab · Gym partner handbook · v4.1 terms, October 2026</span><span>${n}</span></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{font-family:Poppins,sans-serif;color:#1b1f27;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:#fff;padding:18mm 17mm 0}
.page:last-child{page-break-after:auto}
.cover{background:${NAVY};color:#fff;padding:0}
.cover .in{position:absolute;left:18mm;right:18mm;top:60mm}
.k{font-weight:600;letter-spacing:.2em;font-size:10pt;color:${GOLD};text-transform:uppercase}
.cover h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;font-size:62pt;line-height:.92;margin-top:5mm}
.cover p{font-size:12pt;line-height:1.55;color:#c9d2df;margin-top:8mm;max-width:150mm}
.cover .meta{position:absolute;left:18mm;bottom:18mm;font-size:9pt;color:#8c99ad}
.cover .bar{position:absolute;left:0;right:0;bottom:0;height:4mm;background:${GOLD}}
h2{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;font-size:24pt;color:${NAVY};margin-bottom:4mm}
h2:before{content:"";display:block;width:16mm;height:2mm;background:${GOLD};margin-bottom:3mm}
h3{font-size:11.5pt;font-weight:700;color:${NAVY};margin:5mm 0 1.5mm}
p,li{font-size:10pt;line-height:1.55;color:#2b313b}
p+p{margin-top:2.5mm}
ul{padding-left:5mm;margin-top:1.5mm}
li{margin-bottom:1.3mm}
.box{border:1px solid #dde2ea;border-radius:3mm;padding:5mm 6mm;margin-top:4mm}
.gold{border-left:3px solid ${GOLD};background:#fbf8ec;border-radius:0 3mm 3mm 0}
.price{display:flex;gap:5mm;margin-top:3mm}
.price .lead{flex:1.35;border:2px solid ${NAVY};border-radius:3mm;padding:5mm 6mm}
.price .alt{flex:1;border:1px solid #dde2ea;border-radius:3mm;padding:5mm 6mm;background:#f6f7f9}
.tag{font-size:8pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#6b7380}
.big{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:40pt;line-height:1;color:${NAVY};margin-top:1.5mm}
.mid{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:19pt;line-height:1.05;color:${NAVY};margin-top:2mm}
.sm{font-size:8.8pt;color:#4b5563;margin-top:1.5mm;line-height:1.45}
table{width:100%;border-collapse:collapse;margin-top:3mm}
th{text-align:left;font-size:8.6pt;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:${NAVY};padding:2.6mm 3.5mm}
td{vertical-align:top;font-size:9.6pt;line-height:1.5;padding:2.6mm 3.5mm;border-bottom:1px solid #e6e9ef;color:#2b313b}
td:first-child{font-weight:600;color:${NAVY};width:44mm}
.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:3mm}
.foot{position:absolute;left:17mm;right:17mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7.8pt;color:#7a8494;border-top:1px solid #e6e9ef;padding-top:2.5mm}
</style></head><body>

<section class="page cover">
  <div class="in">
    <div class="k">PT Launch Lab · Gym partners</div>
    <h1>Gym partner<br>handbook</h1>
    <p>How the partnership works, start to finish: what your members pay, what you earn and when, what your gym does, and what we do.</p>
  </div>
  <div class="meta">v4.1 terms · October 2026 · Your signed partnership agreement is the binding document; this handbook summarises it.</div>
  <div class="bar"></div>
</section>

<section class="page">
  <h2>The partnership in one page</h2>
  <p>Your gym runs its own PT Academy, <b>“[Your gym] PT Academy”</b>, with its own branded page, enrol link, QR code and marketing. Members who want to become personal trainers enrol through it. PT Launch Lab delivers everything behind it: the qualification, the tutors, the learning platform, the payments and the support.</p>
  <div class="box gold">
    <ul>
      <li><b>${FEE_PIF} per learner who pays in full, ${FEE_MONTHLY} on the monthly plan</b>, including VAT, rising to ${FEE_PIF_VOL} / ${FEE_MONTHLY_VOL} in any quarter with ${VOLUME_THRESHOLD}+ learners.</li>
      <li><b>Zero cost and zero admin</b> to your gym. No fee, no subscription, no staff time required.</li>
      <li><b>One partner gym per area.</b> We don't run a second academy on your doorstep.</li>
      <li><b>No codes and no deadlines.</b> One price, the same as our own site, unless you choose to give your members a saving. Members can enrol any time.</li>
    </ul>
  </div>
  <h3>It's white-label</h3>
  <p>Everything your members see is your academy, under your name and logo. Member-facing material does not name PT Launch Lab. The only third-party line on it is the regulatory one: <i>${REG_LINE}</i>.</p>
  <h3>The course your members get</h3>
  <ul>
    <li>Two qualifications, one course: the NCFE Level 2 Certificate in Gym Instructing and the Level 3 Certificate in Personal Training, Ofqual regulated.</li>
    <li>Studied 100% online on <b>Praxel</b>, our learning platform, at the learner's own pace. Practical units are video-assessed.</li>
    <li>A personal tutor introduced within 24 hours of enrolling, and mentorship throughout.</li>
    <li>Most learners finish in 8–16 weeks, around a full-time job.</li>
    <li>On qualifying, we approach at least one gym on the learner's behalf and introduce them. It is an introduction, not a promise of an interview or a job.</li>
  </ul>
  ${foot(2)}
</section>

<section class="page">
  <h2>What your members pay</h2>
  <div class="price">
    <div class="lead"><div class="tag">Pay in full</div><div class="big">${COURSE_PRICE_LABEL}</div><div class="sm">One payment at enrolment. Lead with this one: it also pays you fastest.</div></div>
    <div class="alt"><div class="tag">Or monthly</div><div class="mid">or ${MONTHLY_PRICE_LABEL} a month<br>for ${MONTHLY_PAYMENTS} months</div><div class="sm">First payment at checkout, no interest, ${MONTHLY_TOTAL} in total.</div></div>
  </div>
  <ul style="margin-top:4mm">
    <li>The same price on your academy page as everywhere else, unless you opt into a member price (below). There are no codes to hand out or chase.</li>
    <li>Rolling enrolment: no closing dates. A member can start the day they decide.</li>
    <li>14-day cooling-off: a learner who cancels within 14 days of paying gets a full refund.</li>
  </ul>

  <h2 style="margin-top:9mm">What you earn, and when</h2>
  <table>
    <tr><th>Item</th><th>The rule</th></tr>
    <tr><td>Pay-in-full learner</td><td>${FEE_PIF}, including VAT. Paid 30 days after the learner enrols and pays in full.</td></tr>
    <tr><td>Monthly learner</td><td>${FEE_MONTHLY}, including VAT. Paid when the learner's ${nth} monthly payment clears.</td></tr>
    <tr><td>Volume rate</td><td>In any quarter where ${VOLUME_THRESHOLD} or more learners enrol through your gym, every learner that quarter earns ${FEE_PIF_VOL} (pay in full) or ${FEE_MONTHLY_VOL} (monthly). The top-up is paid after the quarter ends.</td></tr>
    <tr><td>Member price (optional)</td><td>You can give your members up to ${formatPence(MAX_MEMBER_SAVING_PENCE)} off the pay-in-full price, shown on your academy page. It comes out of your fee for that learner.</td></tr>
    <tr><td>Once paid</td><td>It's yours. No clawback once a fee has been paid.</td></tr>
    <tr><td>Tracking</td><td>Enrolments and fees show in your partner portal.</td></tr>
  </table>
  <div class="box">
    <p><b>Illustration, not a forecast:</b> one member a month paying in full is 12 × ${FEE_PIF} = ${formatPence(LADDER_PIF_COMMISSION_PENCE * 12)} a year. Two a month puts every quarter on the volume rate: 24 × ${FEE_PIF_VOL} = ${formatPence((LADDER_PIF_COMMISSION_PENCE + VOLUME_BONUS_PIF_PENCE) * 24)}.</p>
  </div>
  ${foot(3)}
</section>

<section class="page">
  <h2>Who does what</h2>
  <div class="two">
    <div class="box" style="margin-top:0">
      <h3 style="margin-top:0">Your gym</h3>
      <ul>
        <li>Put the poster up and the screen video on your TV.</li>
        <li>Keep member handouts at reception.</li>
        <li>Mention the academy to members who'd be good at it, and point them to the QR code or enrol link.</li>
        <li>Optional: run the Meta ad pack from your own ad account, at a budget you choose.</li>
        <li>Talk about it as an introduction on qualifying, never a guaranteed interview or job.</li>
      </ul>
    </div>
    <div class="box" style="margin-top:0">
      <h3 style="margin-top:0">PT Launch Lab</h3>
      <ul>
        <li>Your branded academy page, enrol link and QR code.</li>
        <li>Enrolment, payments and the 14-day cooling-off.</li>
        <li>All teaching, tutoring, assessment and certification, on Praxel.</li>
        <li>Learner support and mentorship from start to finish.</li>
        <li>The gym introduction when a learner qualifies.</li>
        <li>Paying your fee, on the rules on page 3.</li>
      </ul>
    </div>
  </div>

  <h2 style="margin-top:9mm">What we provide every month</h2>
  <ul>
    <li><b>A fresh marketing kit</b> in your partner portal: screen video and editable slides, posters, the member handout and social graphics, all in your branding.</li>
    <li><b>A ready-to-run Meta ad pack</b> for your area, sending local people to your academy page.</li>
    <li><b>First introductions to qualified learners.</b> When learners from your academy qualify, you get the first introduction, before anyone else.</li>
  </ul>

  <h2 style="margin-top:9mm">The longer-term upside</h2>
  <p>Learners who qualify through your academy are trained PTs who already know your gym. That creates a <b>potential</b> pipeline of self-employed trainers who could rent floor space from you. No partner-academy learner has qualified yet, so treat this as potential, not a track record.</p>
  ${foot(4)}
</section>

<section class="page">
  <h2>Getting started</h2>
  <ol style="padding-left:5mm">
    <li><p><b>Log in to your partner portal.</b> Your Resources tab holds this month's kit: poster (with a print-ready A3 PDF), member handout, screen video and editable slides, and your Meta ad pack. The Playbook tab has the copy to go with it.</p></li>
    <li><p><b>Print and place.</b> A3 poster at the front desk or changing-room wall, handouts at reception, the video on loop on your screens.</p></li>
    <li><p><b>Tell your team.</b> Anyone on the desk should be able to say: “It's our PT Academy. ${COURSE_PRICE_LABEL}, or ${MONTHLY_PRICE_LABEL} a month for ${MONTHLY_PAYMENTS} months. Scan the QR to enrol.”</p></li>
    <li><p><b>Point people at the link.</b> Every enrolment through your QR code or enrol link is attributed to your gym automatically.</p></li>
  </ol>

  <h2 style="margin-top:9mm">Do and don't</h2>
  <div class="two">
    <div class="box" style="margin-top:0"><h3 style="margin-top:0">Do</h3><ul>
      <li>Lead with ${COURSE_PRICE_LABEL}, then mention the monthly option.</li>
      <li>Say members can enrol and start any time.</li>
      <li>Describe the introduction on qualifying as an introduction.</li>
    </ul></div>
    <div class="box" style="margin-top:0"><h3 style="margin-top:0">Don't</h3><ul>
      <li>Offer codes, discounts or deadlines. There aren't any.</li>
      <li>Promise an interview, a job or earnings.</li>
      <li>Put PT Launch Lab branding on member material.</li>
    </ul></div>
  </div>

  <h2 style="margin-top:9mm">Questions</h2>
  <p>Email <b>info@ptlaunchlab.co.uk</b>. For anything contractual, your signed partnership agreement is the binding document and takes precedence over this summary.</p>
  ${foot(5)}
</section>

</body></html>`;
}

// ── render ────────────────────────────────────────────────────────────────

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

async function load(html, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  return page;
}

async function pdf(html, out, size) {
  const page = await load(html, { width: 794, height: 1123 });
  await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true, ...size });
  await page.close();
}

const slugs = handbookOnly ? [] : Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));
if (only.length && !slugs.length && !handbookOnly) throw new Error(`no such gym: ${only.join(", ")}`);

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const dir = path.join(OUT_ROOT, slug);
  mkdirSync(dir, { recursive: true });
  const qr = await qrSvg(enrolUrl(brand));

  const handout = handoutHtml(brand, qr);
  const poster = posterHtml(brand, qr, ownPhoto(slug));
  for (const [name, html] of [["handout", handout], ["poster", poster]]) {
    const problems = memberCopyProblems(visibleText(html));
    if (problems.length) throw new Error(`${slug} ${name}: ${problems.join(", ")}`);
    writeFileSync(path.join(dir, `${name}.html`), html, "utf8");
  }

  await pdf(handout, path.join(dir, "member-handout.pdf"), {});
  await pdf(poster, path.join(dir, "academy-poster-a3.pdf"), {});
  const page = await load(poster, { width: A3.w, height: A3.h });
  await page.screenshot({ path: path.join(dir, "academy-poster.png"), fullPage: false });
  await page.close();
  console.log(`${slug.padEnd(16)} handout · poster png · poster A3 pdf   -> ${enrolUrl(brand)}`);
}

if (!only.length || handbookOnly) {
  const dir = path.join(OUT_ROOT, "shared");
  mkdirSync(dir, { recursive: true });
  const html = handbookHtml();
  writeFileSync(path.join(dir, "handbook.html"), html, "utf8");
  await pdf(html, path.join(dir, "gym-partner-handbook.pdf"), {});
  console.log("shared           gym partner handbook");
}

await browser.close();
console.log(`\nOutput: ${OUT_ROOT}`);
