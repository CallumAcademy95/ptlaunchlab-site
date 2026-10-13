/**
 * Build the learner prospectus (public/prospectus.html and public/prospectus.pdf).
 *
 *   npx tsx scripts/build-learner-prospectus.mts            write the HTML only
 *   npx tsx scripts/build-learner-prospectus.mts --pdf      HTML + print to PDF
 *
 * WHY THIS IS GENERATED
 * /prospectus/thank-you opens public/prospectus.pdf after every prospectus form.
 * The March 2026 version was designed once and then drifted: £1,399 / £599
 * deposit prices, Payl8r finance, "17 verified reviews", REPs, a "guaranteed gym
 * interview", Skool, the Merve app and "£3K, £5K and beyond per month".
 *
 * So nothing that has a source on the site is typed here. Prices come from
 * app/lib/pricing.ts, review quotes from app/lib/reviewsData.ts (verbatim),
 * Gemma from app/lib/graduates.ts, NAP from app/lib/contactDetails.ts and the
 * credential from app/lib/localPages.ts. The prose obeys the truth rules in
 * docs/superpowers/specs/2026-10-13-ptlaunchlab-prospectus-design.md, and
 * tests/prospectus.test.mts checks the output against them.
 *
 * Unit titles and refs (page 4) were checked on 13 Oct 2026 against the Praxel
 * course seed in albaco-lms: lib/supabase/migrations/003_seed_ncfe_pt.sql
 * (titles, in unit order) and scripts/build-qualification-docs.mjs (refs by
 * unit number). The site itself lists topic areas, not units.
 *
 * Relative imports carry .ts so node's own test runner can import this file.
 */
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  COURSE_PRICE_LABEL,
  MONTHLY_PRICE_LABEL,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  formatPence,
} from "../app/lib/pricing.ts";
import { reviews } from "../app/lib/reviewsData.ts";
import { GRADUATES } from "../app/lib/graduates.ts";
import {
  ADDRESS_ONE_LINE,
  PHONE_NATIONAL,
  PHONE_TEL,
  CONTACT_EMAIL,
  GOOGLE_PROFILE_URL,
} from "../app/lib/contactDetails.ts";
import { COURSE_CREDENTIAL } from "../app/lib/localPages.ts";

const OUT_HTML = path.resolve("public/prospectus.html");
const OUT_PDF = path.resolve("public/prospectus.pdf");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const PHOTOS = ["callum.webp", "ryan.webp", "miles.webp"];

const SITE = "https://ptlaunchlab.co.uk";
const ENROL = `${SITE}/enrol`;
const BOOK = `${SITE}/book-call`;
const EDITION = "October 2026";

const MONTHLY = `${MONTHLY_PAYMENTS} × ${MONTHLY_PRICE_LABEL}`;
const MONTHLY_TOTAL = formatPence(MONTHLY_PLAN_TOTAL_PENCE);

// The four reviews: support, qualifying around a job, career change, and help
// after qualifying. Picked by name so a reorder of reviewsData cannot swap them;
// a missing name throws rather than printing a gap.
const REVIEW_NAMES = ["Michelle", "Rachel Waldock", "Rebecca Davies", "Matthew Bell"];
const pickedReviews = REVIEW_NAMES.map((n) => {
  const r = reviews.find((x) => x.name === n);
  if (!r) throw new Error(`review not found in reviewsData.ts: ${n}`);
  return r;
});

const gemma = (() => {
  const g = GRADUATES.find((x) => x.id === "gemma");
  if (!g) throw new Error("Gemma not found in graduates.ts");
  return g;
})();
const gemmaVideo = gemma.videoUrl?.replace("/embed/", "/watch?v=");

// Praxel seed, 003_seed_ncfe_pt.sql + build-qualification-docs.mjs (see header).
const UNITS_L2: [string, string][] = [
  ["Anatomy and Physiology for Exercise", "T/617/4001"],
  ["Maximising the Customer Experience in a Gym Environment", "A/617/4002"],
  ["Supporting Client Health and Well-being", "D/617/4008"],
  ["Conducting Client Consultations and Gym Inductions", "F/617/4003"],
  ["Planning and Reviewing Gym-Based Exercise Programmes", "R/617/4006"],
  ["Instructing and Supervising Gym-Based Exercise Programmes", "Y/617/4007"],
];
const UNITS_L3: [string, string][] = [
  ["Applied Anatomy and Physiology for Activity, Health and Fitness", "D/617/1707"],
  ["Client Motivation and Lifestyle Management", "H/617/1708"],
  ["Programming Personal Training Sessions", "K/617/1709"],
  ["Delivering Personal Training Sessions", "D/617/1710"],
  ["Nutrition to Support a Physical Activity Programme", "H/617/1711"],
  ["Business Acumen for Personal Trainers", "K/617/1712"],
];

const NAVY = "#081729";
const NAVY_2 = "#12284A";
const GOLD = "#F5C518";
const INK = "#081729";
const BODY = "#333A46";
const MUTED = "#6A7689";
const LINE = "#E1E6EE";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const short = (url: string) => url.replace(/^https:\/\//, "");

const foot = (n: number, dark = false) =>
  `<div class="foot${dark ? " dark" : ""}"><span>PT Launch Lab · Course prospectus · ${EDITION}</span><span>${n}</span></div>`;

const page = (n: number, inner: string, cls = "") =>
  `<section class="page${cls ? ` ${cls}` : ""}">${inner}${foot(n, cls.includes("navy"))}</section>`;

const actions = (dark = false) => `
  <div class="actions${dark ? " dark" : ""}">
    <a class="btn primary" href="${ENROL}"><span class="btn-label">Enrol now</span><span class="btn-url">${short(ENROL)}</span></a>
    <a class="btn" href="${BOOK}"><span class="btn-label">Book a free call</span><span class="btn-url">${short(BOOK)}</span></a>
  </div>`;

const units = (list: [string, string][], start: number) =>
  list
    .map(
      ([title, ref], i) =>
        `<tr><td class="num">${start + i}</td><td>${esc(title)}</td><td class="ref">${ref}</td></tr>`,
    )
    .join("\n");

const CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; }
  body { font-family:'Poppins','Helvetica Neue',Arial,sans-serif; color:${BODY}; background:#fff;
         font-weight:300; font-size:10.5pt; line-height:1.6;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  a { color:inherit; }
  .page { width:210mm; height:297mm; padding:20mm 20mm 26mm; position:relative;
          page-break-after:always; break-after:page; overflow:hidden; }
  .page:last-child { page-break-after:auto; break-after:auto; }
  h1,h2,h3,.cond { font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif; }
  h1 { font-size:40pt; line-height:1.02; font-weight:700; color:#fff; margin:0 0 6mm; letter-spacing:-.005em; }
  h2 { font-size:28pt; line-height:1.05; font-weight:700; color:${INK}; margin:0 0 5mm; }
  h3 { font-size:14pt; line-height:1.15; font-weight:600; color:${INK}; margin:0 0 1.5mm; }
  p { margin:0 0 4mm; }
  strong { font-weight:600; color:${INK}; }
  .eyebrow { font-family:'Barlow Condensed',sans-serif; font-size:10pt; font-weight:600; letter-spacing:.2em;
             text-transform:uppercase; color:#B58F00; margin-bottom:3mm; }
  .lede { font-size:12pt; line-height:1.55; color:${BODY}; max-width:150mm; }
  .rule { height:3px; background:${GOLD}; width:24mm; margin:0 0 7mm; }

  .navy { background:${NAVY}; color:#C9D3E3; }
  .navy h1, .navy h2, .navy h3, .navy strong { color:#fff; }
  .navy .eyebrow { color:${GOLD}; }
  .navy .lede { color:#C9D3E3; }

  .logo { height:15mm; display:block; margin-bottom:14mm; }
  .glance { background:${NAVY_2}; border-top:3px solid ${GOLD}; padding:6mm 7mm 4mm; margin:8mm 0 8mm; }
  .glance .eyebrow { margin-bottom:3mm; }
  .glance dl { margin:0; display:grid; grid-template-columns:34mm 1fr; column-gap:4mm; }
  .glance dt { font-family:'Barlow Condensed',sans-serif; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
               font-size:10pt; color:${GOLD}; padding:2mm 0; border-bottom:1px solid #1F3A63; }
  .glance dd { margin:0; padding:2mm 0; border-bottom:1px solid #1F3A63; color:#E6ECF5; font-size:10pt; line-height:1.45; }
  .glance dt:nth-last-of-type(1), .glance dd:last-of-type { border-bottom:0; }

  .actions { display:flex; gap:5mm; margin:4mm 0 0; }
  .btn { flex:1; display:block; text-decoration:none; border:1.5px solid ${INK}; padding:3.5mm 5mm; border-radius:2mm; color:${INK}; }
  .btn .btn-label { display:block; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:15pt; line-height:1.1; }
  .btn .btn-url { display:block; font-size:9pt; color:${MUTED}; }
  .btn.primary { background:${GOLD}; border-color:${GOLD}; color:${NAVY}; }
  .btn.primary .btn-url { color:#5A4A00; }
  .actions.dark .btn { border-color:#55688A; color:#fff; }
  .actions.dark .btn .btn-url { color:#AEBBD2; }
  .actions.dark .btn.primary { border-color:${GOLD}; color:${NAVY}; }
  .actions.dark .btn.primary .btn-url { color:#5A4A00; }

  .pain { border-left:3px solid ${GOLD}; padding:1mm 0 1mm 6mm; margin:0 0 7mm; max-width:150mm; }
  .pain p { margin:0; }
  .wayout { background:${NAVY}; color:#C9D3E3; padding:7mm 8mm; margin-top:10mm; }
  .wayout h3 { color:#fff; font-size:17pt; margin-bottom:3mm; }
  .wayout p { margin:0 0 3mm; } .wayout p:last-child { margin:0; }
  .wayout strong { color:${GOLD}; }

  .steps { margin:8mm 0 0; }
  .step { display:grid; grid-template-columns:16mm 1fr; column-gap:5mm; padding:5mm 0; border-top:1px solid ${LINE}; }
  .step:last-child { border-bottom:1px solid ${LINE}; }
  .step .n { font-family:'Barlow Condensed',sans-serif; font-size:30pt; font-weight:700; color:${GOLD}; line-height:1; }
  .step p { margin:0; }
  .step .tag { font-family:'Barlow Condensed',sans-serif; font-size:9.5pt; font-weight:600; letter-spacing:.14em;
               text-transform:uppercase; color:${MUTED}; margin-bottom:.5mm; }

  table.units { width:100%; border-collapse:collapse; margin:0 0 7mm; font-size:10pt; }
  table.units caption { text-align:left; font-family:'Barlow Condensed',sans-serif; font-size:13pt; font-weight:700;
                        color:#fff; background:${NAVY}; padding:2.5mm 4mm; }
  table.units caption span { color:${GOLD}; font-weight:600; letter-spacing:.06em; }
  table.units td { padding:2.6mm 3mm; border-bottom:1px solid ${LINE}; vertical-align:top; }
  table.units td.num { width:10mm; font-family:'Barlow Condensed',sans-serif; font-weight:700; color:#B58F00; font-size:12pt; }
  table.units td.ref { width:28mm; text-align:right; color:${MUTED}; font-size:9pt; white-space:nowrap; }
  .note { font-size:9.5pt; color:${MUTED}; }

  .rating { display:flex; align-items:center; gap:6mm; margin:2mm 0 7mm; }
  .rating .score { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:46pt; color:${INK}; line-height:1; }
  .rating .stars { color:${GOLD}; font-size:17pt; letter-spacing:1mm; line-height:1; }
  .rating .lbl { font-size:10pt; color:${MUTED}; }
  .reviews { display:grid; grid-template-columns:1fr 1fr; gap:5mm; }
  .card { border:1px solid ${LINE}; border-top:3px solid ${GOLD}; padding:5mm 5mm 4mm; background:#FBFCFE; }
  blockquote.review { margin:0 0 3mm; font-size:9.6pt; line-height:1.55; color:${BODY}; }
  .who { font-size:9pt; color:${MUTED}; } .who strong { font-size:9.5pt; }
  .gemma { background:${NAVY}; color:#C9D3E3; padding:6mm 7mm; margin-top:6mm; display:grid; grid-template-columns:1fr 44mm; gap:6mm; align-items:center; }
  .gemma h3 { color:#fff; margin-bottom:2mm; }
  .gemma blockquote { margin:0 0 2mm; font-size:11pt; line-height:1.5; color:#fff; font-style:italic; }
  .gemma .who { color:#AEBBD2; }
  .gemma a.watch { display:block; text-align:center; text-decoration:none; background:${GOLD}; color:${NAVY};
                   font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13pt; padding:3.5mm 3mm; border-radius:2mm; }

  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:5mm; margin:6mm 0 8mm; }
  .stat { border-top:3px solid ${GOLD}; padding-top:2.5mm; }
  .stat .v { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:26pt; color:${INK}; line-height:1; }
  .stat .l { font-size:9pt; color:${MUTED}; line-height:1.4; margin-top:1mm; }
  .founder { display:grid; grid-template-columns:30mm 1fr; gap:6mm; padding:5mm 0; border-top:1px solid ${LINE}; }
  .founder img { width:30mm; height:30mm; object-fit:cover; border-radius:50%; display:block; }
  .founder .role { font-family:'Barlow Condensed',sans-serif; font-size:9.5pt; font-weight:600; letter-spacing:.14em;
                   text-transform:uppercase; color:#B58F00; margin-bottom:1mm; }
  .founder p { margin:0; font-size:10pt; }

  .price-grid { display:grid; grid-template-columns:1.25fr 1fr; gap:5mm; margin:4mm 0 7mm; }
  .price { border:1px solid ${LINE}; padding:6mm; }
  .price.featured { background:${NAVY}; border:0; border-top:4px solid ${GOLD}; color:#C9D3E3; }
  .price .lbl { font-family:'Barlow Condensed',sans-serif; font-size:10pt; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:${MUTED}; }
  .price.featured .lbl { color:${GOLD}; }
  .price .amt { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:40pt; line-height:1.05; color:${INK}; margin:1mm 0 2mm; }
  .price.featured .amt { color:#fff; font-size:50pt; }
  .price .amt.small { font-size:28pt; }
  .price p { margin:0; font-size:9.8pt; line-height:1.5; }
  ul.incl { list-style:none; padding:0; margin:0 0 7mm; columns:2; column-gap:8mm; }
  ul.incl li { break-inside:avoid; padding:1.6mm 0 1.6mm 7mm; position:relative; font-size:10pt; line-height:1.45; }
  ul.incl li::before { content:""; position:absolute; left:0; top:3.1mm; width:3.2mm; height:1.8mm;
                       border-left:2px solid #B58F00; border-bottom:2px solid #B58F00; transform:rotate(-45deg); }
  .accred { border:1px solid ${LINE}; padding:5mm 6mm; display:grid; grid-template-columns:repeat(3,1fr); gap:5mm; margin-bottom:4mm; }
  .accred h3 { font-size:12.5pt; }
  .accred p { margin:0; font-size:9pt; line-height:1.45; }
  .credential { font-size:9.5pt; color:${MUTED}; margin:0 0 7mm; }

  .faq { display:grid; grid-template-columns:1fr 1fr; column-gap:8mm; row-gap:4.5mm; margin:3mm 0 7mm; }
  .faq h3 { font-size:12.5pt; margin-bottom:1mm; }
  .faq p { margin:0; font-size:9.6pt; line-height:1.5; }
  .contact { background:${NAVY}; color:#C9D3E3; padding:6mm 7mm; margin-top:6mm; }
  .contact h3 { color:#fff; }
  .contact .nap { display:grid; grid-template-columns:1fr 1fr; gap:1.5mm 6mm; font-size:9.6pt; margin-top:2mm; }
  .contact .nap a { color:#fff; text-decoration:none; }

  .foot { position:absolute; bottom:11mm; left:20mm; right:20mm; font-size:8pt; color:#8A94A6;
          border-top:1px solid ${LINE}; padding-top:2.5mm; display:flex; justify-content:space-between; }
  .foot.dark { color:#7D8BA5; border-color:#1F3A63; }
`;

export function buildProspectusHtml(): string {
  const p1 = page(
    1,
    `
  <img class="logo" src="logo.svg" alt="PT Launch Lab">
  <div class="eyebrow">Course prospectus · ${EDITION}</div>
  <h1>Qualify as a Personal Trainer online in 8–16 weeks, around your current job. Then we introduce you to a gym.</h1>
  <p class="lede">One course. One price. Everything you need to go from where you are now to coaching on a gym floor.</p>
  <div class="glance">
    <div class="eyebrow">At a glance</div>
    <dl>
      <dt>Price</dt><dd><strong>${COURSE_PRICE_LABEL}</strong>, everything included. Flexible ways to pay at checkout.</dd>
      <dt>Time</dt><dd>Most learners qualify in 8–16 weeks, studying around work.</dd>
      <dt>Qualification</dt><dd>NCFE Level 2 &amp; 3. Ofqual regulated, CIMSPA recognised.</dd>
      <dt>Where</dt><dd>Online, on Praxel, our learning platform. Practicals are filmed at any gym.</dd>
      <dt>Support</dt><dd>A personal tutor, assigned within 24 hours.</dd>
      <dt>After you qualify</dt><dd>The £500 Mentorship Hub, and a guaranteed introduction to a gym.</dd>
      <dt>Rated</dt><dd>5.0★ Google rating.</dd>
    </dl>
  </div>
  ${actions(true)}
`,
    "navy",
  );

  const p2 = page(
    2,
    `
  <div class="eyebrow">Sound familiar?</div>
  <h2>You want to work in fitness.<br>You just can't see how to get there.</h2>
  <div class="rule"></div>
  <div class="pain">
    <h3>You're in a job that isn't you</h3>
    <p>Sunday evenings feel heavy. The work pays the bills, but it doesn't give you much back.
    You keep telling yourself you'll change it next year.</p>
  </div>
  <div class="pain">
    <h3>Fitness is the best part of your week</h3>
    <p>You train. You read about it. Friends ask you for advice. You already know you'd enjoy
    coaching people. You just don't have the qualification.</p>
  </div>
  <div class="pain">
    <h3>You can't stop earning to retrain</h3>
    <p>Rent and bills don't pause while you study. A full-time course, or weeks off work,
    isn't an option.</p>
  </div>
  <div class="wayout">
    <h3>The way out</h3>
    <p>You don't have to quit to qualify. You study online, in the evenings and at weekends, and you
    keep your wage while you do it. Most learners qualify in <strong>8–16 weeks</strong>.</p>
    <p>When you qualify, <strong>we introduce you to a gym</strong>. That is the whole idea, and the rest
    of this prospectus explains how it works.</p>
  </div>
`,
  );

  const p3 = page(
    3,
    `
  <div class="eyebrow">How it works</div>
  <h2>Four steps, from your current job to a gym floor.</h2>
  <div class="rule"></div>
  <div class="steps">
    <div class="step"><div class="n">01</div><div>
      <div class="tag">Learn</div>
      <h3>Study online, at your own pace</h3>
      <p>The course runs on Praxel, our learning platform. You study when it suits you, around work
      and family. Your personal tutor is assigned within 24 hours of enrolling and is there for your
      questions all the way through.</p></div></div>
    <div class="step"><div class="n">02</div><div>
      <div class="tag">Qualify</div>
      <h3>Practicals filmed at any gym</h3>
      <p>The practical assessments are video-assessed. You film yourself coaching at any gym, and a
      tutor reviews it. There's no in-person training and nothing to travel to. You finish with the
      NCFE Level 2 &amp; 3.</p></div></div>
    <div class="step"><div class="n">03</div><div>
      <div class="tag">Get into a gym</div>
      <h3>A guaranteed warm introduction</h3>
      <p>Once you qualify, we approach at least one gym on your behalf: one in our partner network,
      or one local to you. It's a warm introduction, not a job-board listing. Whether they interview
      you, and whether you get the job, is their call. We've hired 500+ PTs ourselves, so we know what
      gyms look for and we prepare you for it.</p></div></div>
    <div class="step"><div class="n">04</div><div>
      <div class="tag">Build</div>
      <h3>The £500 Mentorship Hub</h3>
      <p>Included in the fee. A private dashboard built to walk you from qualifying to your first paying
      client, with Callum, Miles and Ryan a message away when you're stuck.</p></div></div>
  </div>
`,
  );

  const p4 = page(
    4,
    `
  <div class="eyebrow">What you'll study</div>
  <h2>One qualification. Twelve units.</h2>
  <div class="rule"></div>
  <p class="lede">You study for the ${esc(COURSE_CREDENTIAL)}. Units 1 to 6 cover gym instructing at Level 2.
  Units 7 to 12 take you to Level 3 personal training.</p>
  <table class="units">
    <caption>Level 2 <span>· Gym instructing</span></caption>
    ${units(UNITS_L2, 1)}
  </table>
  <table class="units">
    <caption>Level 3 <span>· Personal training</span></caption>
    ${units(UNITS_L3, 7)}
  </table>
  <p class="note">Every unit is studied online on Praxel. The codes on the right are the unit reference numbers.</p>
`,
  );

  const p5 = page(
    5,
    `
  <div class="eyebrow">What learners say</div>
  <h2>Don't take our word for it.</h2>
  <div class="rating">
    <div class="score">5.0</div>
    <div><div class="stars">★★★★★</div>
    <div class="lbl">5.0★ Google rating · <a href="${GOOGLE_PROFILE_URL}">read the reviews on Google</a></div></div>
  </div>
  <div class="reviews">
    ${pickedReviews
      .map(
        (r) => `<div class="card"><blockquote class="review">${esc(r.quote)}</blockquote>
      <div class="who"><strong>${esc(r.name)}</strong> · ${esc(r.label)}</div></div>`,
      )
      .join("\n    ")}
  </div>
  <div class="gemma">
    <div>
      <h3>Gemma's story</h3>
      <blockquote>“${esc(gemma.quote)}”</blockquote>
      <div class="who">${esc(gemma.name)} · ${esc(gemma.course)}</div>
    </div>
    ${gemmaVideo ? `<a class="watch" href="${gemmaVideo}">Watch Gemma's story</a>` : ""}
  </div>
`,
  );

  const p6 = page(
    6,
    `
  <div class="eyebrow">Who's behind it</div>
  <h2>We run gyms. We hire trainers.</h2>
  <div class="rule"></div>
  <p class="lede">PT Launch Lab was founded in Pontefract by Callum, Miles and Ryan. They built the
  academy they wished had existed when they were starting out.</p>
  <div class="stats">
    <div class="stat"><div class="v">500+</div><div class="l">PTs hired by our team</div></div>
    <div class="stat"><div class="v">£500K+</div><div class="l">Revenue from a fitness business Ryan built as an independent PT</div></div>
    <div class="stat"><div class="v">30+ yrs</div><div class="l">Miles's time in the fitness industry</div></div>
  </div>
  <div class="founder"><img src="callum.webp" alt="Callum Brown"><div>
    <div class="role">Co-Founder &amp; Educator</div><h3>Callum Brown</h3>
    <p>Callum moved from job to job, trade to trade, before personal training clicked. He built a
    client base on the gym floor, then became a qualified educator in personal training
    qualifications. He understands the people this course is built for, because he was one.</p></div></div>
  <div class="founder"><img src="ryan.webp" alt="Ryan Robinson"><div>
    <div class="role">Co-Founder &amp; Mentor</div><h3>Ryan Robinson</h3>
    <p>Ryan has 17 years on the gym floor and a professional boxing career. He founded Ultimate Shred, an
    online PT business he scaled to over £500,000 in revenue as an independent personal trainer.</p></div></div>
  <div class="founder"><img src="miles.webp" alt="Miles Halstead"><div>
    <div class="role">Co-Founder &amp; Director</div><h3>Miles Halstead</h3>
    <p>More than thirty years in the fitness industry, from corporate management to owning his own
    chain of gyms. He has been on both sides of the hiring table hundreds of times.</p></div></div>
`,
  );

  const p7 = page(
    7,
    `
  <div class="eyebrow">Price and what's included</div>
  <h2>One price. Everything included.</h2>
  <div class="rule"></div>
  <div class="price-grid">
    <div class="price featured">
      <div class="lbl">Pay in full</div>
      <div class="amt">${COURSE_PRICE_LABEL}</div>
      <p>One payment. Full access as soon as you enrol.</p>
    </div>
    <div class="price">
      <div class="lbl">Or monthly</div>
      <div class="amt small">${MONTHLY}</div>
      <p>${MONTHLY_TOTAL} in total. The first payment is taken today, when you enrol.</p>
    </div>
  </div>
  <p><strong>Flexible ways to pay at checkout.</strong> Nothing is sold as a paid upgrade afterwards.</p>
  <h3 style="margin-top:6mm;">What's included</h3>
  <ul class="incl">
    <li>The NCFE Level 2 &amp; 3 qualification</li>
    <li>The full course online, on Praxel</li>
    <li>A personal tutor, assigned within 24 hours</li>
    <li>Video-assessed practicals, filmed at any gym</li>
    <li>The £500 Mentorship Hub</li>
    <li>A guaranteed warm introduction to a gym</li>
    <li>Direct access to Callum, Miles and Ryan</li>
  </ul>
  <h3>The qualification</h3>
  <div class="accred">
    <div><h3>NCFE</h3><p>The awarding organisation that issues your certificate.</p></div>
    <div><h3>Ofqual regulated</h3><p>Reference 603/4388/6, on Ofqual's public register, so you can check it yourself.</p></div>
    <div><h3>CIMSPA</h3><p>Recognised by CIMSPA, the professional body for UK sport and physical activity.</p></div>
  </div>
  <p class="credential">Full title: ${esc(COURSE_CREDENTIAL)}</p>
  ${actions()}
`,
  );

  const p8 = page(
    8,
    `
  <div class="eyebrow">Questions people ask</div>
  <h2>Before you decide.</h2>
  <div class="rule"></div>
  <div class="faq">
    <div><h3>Is it really all online?</h3>
      <p>Yes. You study on Praxel, our learning platform. There's no in-person training and nothing
      to travel to.</p></div>
    <div><h3>How much time will it take?</h3>
      <p>Most learners qualify in 8–16 weeks, studying around their job. You set the pace.</p></div>
    <div><h3>What does it cost?</h3>
      <p>${COURSE_PRICE_LABEL} in full, or ${MONTHLY} (${MONTHLY_TOTAL} in total, the first payment
      today). Flexible ways to pay at checkout. Everything is included.</p></div>
    <div><h3>Do I need experience?</h3>
      <p>None at all. Whether you're new to fitness or already coaching informally, the course takes you
      from zero to qualified.</p></div>
    <div><h3>How do the practicals work?</h3>
      <p>They're video-assessed. You film yourself coaching at any gym, and a tutor reviews it.</p></div>
    <div><h3>Will I get a job?</h3>
      <p>We guarantee the introduction: once you qualify, we approach at least one gym on your behalf.
      Whether they interview you, and whether you get the job, is their call.</p></div>
  </div>
  <h2 style="font-size:22pt;margin-top:2mm;">Your next step</h2>
  <p>Ready? Enrol and you get access straight away. Still have questions? Book a free 15-minute call.
  We'll give you straight answers, and if the course isn't right for you, we'll say so.</p>
  ${actions()}
  <div class="contact">
    <h3>PT Launch Lab</h3>
    <div class="nap">
      <span>${esc(ADDRESS_ONE_LINE)}</span>
      <span><a href="tel:${PHONE_TEL}">${PHONE_NATIONAL}</a></span>
      <span><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></span>
      <span><a href="${SITE}">${short(SITE)}</a></span>
    </div>
  </div>
`,
  );

  return `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PT Launch Lab Course Prospectus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Poppins:wght@300;400;500;600&display=swap">
<style>${CSS}</style></head><body>
${[p1, p2, p3, p4, p5, p6, p7, p8].join("\n")}
</body></html>
`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const html = buildProspectusHtml();
  mkdirSync(path.dirname(OUT_HTML), { recursive: true });
  writeFileSync(OUT_HTML, html, "utf8");
  console.log(`html  -> ${OUT_HTML}  (${(html.length / 1024).toFixed(0)}KB)`);

  if (process.argv.includes("--pdf")) {
    // The founder photos in /public are 1200px webp. Chrome re-encodes them
    // losslessly, which put the PDF at 3.5 MB. The PDF is printed from a temp
    // copy of the page whose photos are the same files, downscaled to 400px
    // JPEG data URIs. public/prospectus.html itself keeps the /public paths.
    const { default: sharp } = await import("sharp");
    let printHtml = html.replace('src="logo.svg"', `src="${pathToFileURL(path.resolve("public/logo.svg")).href}"`);
    for (const f of PHOTOS) {
      const jpg = await sharp(path.resolve("public", f)).resize(400, 400).jpeg({ quality: 82 }).toBuffer();
      printHtml = printHtml.replace(`src="${f}"`, `src="data:image/jpeg;base64,${jpg.toString("base64")}"`);
    }
    const tmpDir = mkdtempSync(path.join(tmpdir(), "prospectus-"));
    const printFile = path.join(tmpDir, "prospectus-print.html");
    writeFileSync(printFile, printHtml, "utf8");
    try {
      execFileSync(
        CHROME,
        [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          "--no-pdf-header-footer",
          "--virtual-time-budget=10000",
          `--print-to-pdf=${OUT_PDF}`,
          pathToFileURL(printFile).href,
        ],
        { stdio: "inherit", timeout: 90_000 },
      );
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    console.log(`pdf   -> ${OUT_PDF}`);
  }
}
