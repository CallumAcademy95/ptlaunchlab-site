/**
 * Build the gym partner prospectus PDF.
 *
 *   npx tsx scripts/build-gym-prospectus.mts            write the HTML only
 *   npx tsx scripts/build-gym-prospectus.mts --pdf      HTML + print to PDF
 *
 * WHY THIS IS GENERATED RATHER THAN DESIGNED ONCE
 * The previous prospectus (public/gym-partner-prospectus.pdf, 2026-04-01) drifted
 * away from the contract and became the single worst document in the estate:
 *
 *   - a full page headed "One Partner Gym Per Area" promising "a strictly
 *     exclusive territorial basis", "no competing academies in your postcode
 *     area" and "first-mover advantage locked in permanently". The agreement
 *     grants NO territorial exclusivity; the licence to the gym is expressly
 *     non-exclusive (Clause 6.2).
 *   - "£500 ... paid upfront, at the point of enrolment. There's no waiting, no
 *     conditions, and no ambiguity." Clause 5.4 says the opposite: 30 days for a
 *     pay-in-full learner, second-instalment-plus-30 for everyone else.
 *   - £2,500 and £5,000 presented as "year one upfront income for an active
 *     partner gym" — an income projection with nothing behind it.
 *
 * That is the same class of failure that produced agreement v3.0, where the sign
 * page and the emailed PDF had become two different contracts. So the commercial
 * terms in this document are not typed here: they are rendered from
 * KEY_TERMS_FOR_ACKNOWLEDGEMENT in app/lib/partnershipAgreement.ts, the same
 * source the sign page and the agreement PDF use. Change the deal there and this
 * follows. Never hand-write a term into this file.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  KEY_TERMS_FOR_ACKNOWLEDGEMENT,
  PARTNERSHIP_AGREEMENT_VERSION,
} from "../app/lib/partnershipAgreement";

const OUT_HTML = path.resolve("public/gym-partner-prospectus.html");
const OUT_PDF = path.resolve("public/gym-partner-prospectus.pdf");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Verified 2026-08-29 by scripts/audit-partner-platform.mts. Update both together.
const PROOF = {
  partnerGyms: 9,
  bestGymEnrolments: 3,
  bestGymSince: "May",
  gymsWithNone: 4,
};

const NAVY = "#070D1B";
const CARD = "#102342";
const GOLD = "#F5C518";
const INK = "#1B2434";
const MUTED = "#5A6B7F";
const BODY = "#333A46";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const page = (inner: string) => `<section class="page">${inner}</section>`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>PT Launch Lab — Gym Partnership</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Poppins:wght@300;400;500;600&display=swap">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Poppins','Helvetica Neue',Arial,sans-serif; color:${BODY};
         font-weight:300; font-size:11pt; line-height:1.6; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page { width:210mm; height:297mm; padding:20mm 18mm; position:relative; page-break-after:always; overflow:hidden; }
  .page:last-child { page-break-after:auto; }
  h1,h2,h3,.cond { font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif; }
  h1 { font-size:34pt; line-height:1; font-weight:700; color:${NAVY}; margin:0 0 6mm; letter-spacing:-.01em; }
  h2 { font-size:22pt; line-height:1.05; font-weight:600; color:${NAVY}; margin:0 0 4mm; }
  h3 { font-size:13pt; font-weight:600; color:${NAVY}; margin:0 0 1.5mm; letter-spacing:.01em; }
  p { margin:0 0 4mm; max-width:150mm; }
  .eyebrow { font-family:'Barlow Condensed',sans-serif; font-size:10pt; font-weight:600; letter-spacing:.2em;
             text-transform:uppercase; color:${GOLD}; margin-bottom:3mm; }
  .cover { background:${NAVY}; color:#fff; }
  .cover h1 { color:#fff; font-size:44pt; }
  .cover p { color:#AEBBD2; font-size:12pt; max-width:130mm; }
  .rule { height:3px; background:${GOLD}; width:28mm; margin:6mm 0; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:5mm; margin:5mm 0; }
  .box { border:1px solid #DCE3EF; border-left:3px solid ${GOLD}; padding:4mm 5mm; background:#FBFCFE; }
  .box p { margin:0; font-size:10pt; }
  .term { border-top:1px solid #DCE3EF; padding:2.6mm 0; }
  .term .clause { font-family:'Barlow Condensed',sans-serif; font-size:9.5pt; font-weight:600; letter-spacing:.14em;
                  text-transform:uppercase; color:#8A94A6; }
  .term p { margin:0.8mm 0 0; font-size:10pt; line-height:1.5; }
  .kicker { background:${CARD}; color:#fff; padding:4.5mm 6mm; margin:5mm 0 0; }
  .kicker p { color:#C7D3E8; margin:0; font-size:10.5pt; }
  .kicker strong { color:${GOLD}; font-weight:600; }
  .foot { position:absolute; bottom:12mm; left:18mm; right:18mm; font-size:8.5pt; color:#8A94A6;
          border-top:1px solid #E4E9F2; padding-top:3mm; display:flex; justify-content:space-between; }
  .cover .foot { color:#6D7C96; border-color:#1E2D47; }
  .big { font-family:'Barlow Condensed',sans-serif; font-size:30pt; font-weight:700; color:${NAVY}; line-height:1; }
  ul { margin:0 0 4mm; padding-left:5mm; } li { margin-bottom:2mm; }
</style></head><body>

${page(`
  <div class="eyebrow">Gym partnership</div>
  <h1>Your members are<br>your next trainers.</h1>
  <div class="rule"></div>
  <p>A white-label PT academy for your gym. Your members qualify under your brand,
  come out as trainers who already know your floor, and you are paid £500 for each
  one who enrols.</p>
  <p style="margin-top:10mm;font-size:10.5pt;">PT Launch Lab Ltd · Pontefract<br>
  ptlaunchlab.co.uk/gym-partnership</p>
  <div class="foot"><span>Partnership terms v${PARTNERSHIP_AGREEMENT_VERSION}</span><span>1</span></div>
`).replace('<section class="page">', '<section class="page cover">')}

${page(`
  <h2>The problem this solves</h2>
  <p>Most independent gyms lose good trainers to other clubs, struggle to replace them
  quickly, and carry empty floor space while they look. Hiring is reactive: you only
  start when someone leaves, and you are dependent on the right person happening to be
  on the market that month.</p>
  <p>Meanwhile you already have members who would like to work in the industry and have
  no idea how to start. Most of them go elsewhere to qualify, and then work elsewhere too.</p>

  <h2 style="margin-top:10mm;">How it works</h2>
  <div class="grid">
    <div class="box"><h3>1. Your branded academy</h3>
      <p>Your logo, your own enrolment link and a QR code for the gym. Members scan,
      enrol and qualify under your brand.</p></div>
    <div class="box"><h3>2. We deliver all of it</h3>
      <p>Tutoring, assessment, certification and learner support. NCFE Level 2 and
      Level 3, Ofqual regulated, CIMSPA recognised. Most learners qualify in 8 to 16
      weeks around a job. You teach nothing.</p></div>
    <div class="box"><h3>3. You are paid</h3>
      <p>£500 for every member who enrols through your academy.</p></div>
    <div class="box"><h3>4. They stay on your floor</h3>
      <p>A trainer who qualified in your gym, with your members, is far likelier to
      rent space from you than someone who answered an advert.</p></div>
  </div>
  <div class="kicker"><p><strong>What it costs you:</strong> nothing. No fee, no minimum,
  no tie-in, and either side can end it on 30 days' written notice.</p></div>
  <div class="foot"><span>PT Launch Lab · Gym partnership</span><span>2</span></div>
`)}

${page(`
  <h2>What it is worth</h2>
  <p>£500 per learner, so the arithmetic is easy. Put your own number in:</p>
  <table style="width:100%;border-collapse:collapse;margin:5mm 0 6mm;">
    <tr style="background:${NAVY};color:#fff;">
      <th style="text-align:left;padding:3mm 4mm;font-family:'Barlow Condensed',sans-serif;font-size:10pt;letter-spacing:.12em;text-transform:uppercase;font-weight:600;">Members enrolling</th>
      <th style="text-align:right;padding:3mm 4mm;font-family:'Barlow Condensed',sans-serif;font-size:10pt;letter-spacing:.12em;text-transform:uppercase;font-weight:600;">Over a year</th>
    </tr>
    <tr><td style="padding:3mm 4mm;border-bottom:1px solid #E4E9F2;">One a month</td>
        <td style="padding:3mm 4mm;border-bottom:1px solid #E4E9F2;text-align:right;" class="cond"><span style="font-size:15pt;font-weight:700;color:${NAVY};">£6,000</span></td></tr>
    <tr><td style="padding:3mm 4mm;border-bottom:1px solid #E4E9F2;">Three a month</td>
        <td style="padding:3mm 4mm;border-bottom:1px solid #E4E9F2;text-align:right;" class="cond"><span style="font-size:15pt;font-weight:700;color:${NAVY};">£18,000</span></td></tr>
    <tr style="background:#FFFBEC;"><td style="padding:3mm 4mm;border-bottom:2px solid ${GOLD};"><strong>Five a month</strong></td>
        <td style="padding:3mm 4mm;border-bottom:2px solid ${GOLD};text-align:right;" class="cond"><span style="font-size:19pt;font-weight:700;color:${NAVY};">£30,000</span></td></tr>
  </table>
  <p style="font-size:9.5pt;color:#6E7A8E;margin-top:-2mm;">Illustration of the fee at different
  volumes, not a forecast of what your gym will do. What you actually enrol depends on your
  membership and how often you mention it.</p>

  <p style="margin-top:5mm;">And the fee is the smaller half. Every member you help qualify is a
  trainer who already knows your gym and is likely to build their business on your floor rather
  than someone else's, paying rent and bringing their own clients through your door.</p>

  <div class="kicker"><p><strong>Where the programme is now:</strong> ${PROOF.partnerGyms} gyms are
  running an academy with us, and the strongest has had ${PROOF.bestGymEnrolments} of its members
  enrol since ${PROOF.bestGymSince}. It is a young programme. The gyms getting results are simply
  the ones that mention it when a member asks, and on the call we will show you exactly what they do.</p></div>
  <div class="foot"><span>PT Launch Lab · Gym partnership</span><span>3</span></div>
`)}

${page(`
  <h2>The commercial terms</h2>
  <p style="font-size:10pt;color:#6E7A8E;">Reproduced from the partnership agreement
  v${PARTNERSHIP_AGREEMENT_VERSION}. These are the terms you would sign, not a summary written for a brochure.</p>
  ${KEY_TERMS_FOR_ACKNOWLEDGEMENT.map(
    (t) => `<div class="term"><div class="clause">${esc(t.clause)}</div>
      <h3>${esc(t.title)}</h3><p>${esc(t.detail)}</p></div>`
  ).join("\n")}
  <h2 style="margin-top:5mm;">On territory</h2>
  <p>We aim to work with one gym per area, and we will tell you honestly whether anyone
  near you is already set up. That is how we intend to run it, not a right granted by the
  agreement, and we would rather say so than have you find out later.</p>

  <div class="kicker"><p><strong>Next step:</strong> a fifteen minute call. If your gym
  is not a fit we will say so. callum@ptlaunchlab.co.uk · ptlaunchlab.co.uk/gym-partnership</p></div>
  <div class="foot"><span>PT Launch Lab Ltd · Pontefract · Partnership terms v${PARTNERSHIP_AGREEMENT_VERSION}</span><span>4</span></div>
`)}

</body></html>`;

mkdirSync(path.dirname(OUT_HTML), { recursive: true });
writeFileSync(OUT_HTML, html, "utf8");
console.log(`html  -> ${OUT_HTML}  (${(html.length / 1024).toFixed(0)}KB)`);

if (process.argv.includes("--pdf")) {
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${OUT_PDF}`,
    `file:///${OUT_HTML.replace(/\\/g, "/")}`,
  ], { stdio: "inherit", timeout: 90_000 });
  console.log(`pdf   -> ${OUT_PDF}`);
}
