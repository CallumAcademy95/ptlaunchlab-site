/**
 * Fill the demo partner's Resource Drive.
 *
 *   npx tsx scripts/seed-demo-resources.mts --apply
 *
 * Generates Northgate Strength's own material rather than borrowing a real
 * gym's. Reusing someone else's artwork with the logo removed still leaves
 * their photography, their offer and their layout in a video shown to
 * prospects — and eventually a partner recognises it.
 *
 * Produces: an A3 QR poster, an A4 member handout, ten gym-screen slides, and a
 * signed partnership agreement built by the same generator that produces the
 * real ones. Everything is uploaded against the demo partner only.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import QRCode from "qrcode";
import { renderHtml } from "./render-image.mjs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}` };
const BUCKET = "partner-resources";

const BRAND = JSON.parse(readFileSync(path.join(ROOT, "scripts", "gym-brands.json"), "utf8")).demo;
const ACCENT = BRAND.darkAccent;
const NAVY = BRAND.heroBg;
const URL_TEXT = `ptlaunchlab.co.uk${BRAND.canonicalPath}`;
const OUT = path.join(ROOT, "ad-assets", "gym-tv", "demo");

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;
const LOGO = "file:///" + path.join(ROOT, "public", "logos", "ultimate-shred.png").replace(/\\/g, "/");

const qr = await QRCode.toDataURL(`https://${URL_TEXT}`, {
  errorCorrectionLevel: "H",
  margin: 1,
  width: 700,
  color: { dark: "#0B1F38FF", light: "#FFFFFFFF" },
});

/** A3 at 150dpi, portrait — what a gym actually prints for the front desk. */
const poster = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1754px;height:2480px;background:${NAVY};font-family:Poppins,sans-serif;color:#fff;
  display:flex;flex-direction:column;padding:150px 130px;position:relative}
.logo{height:130px;width:auto;object-fit:contain;margin-bottom:110px}
.kick{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:52px;letter-spacing:.2em;
  text-transform:uppercase;color:${ACCENT};margin-bottom:44px}
h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:210px;line-height:.92;
  text-transform:uppercase;margin-bottom:56px}
h1 .hl{color:${ACCENT}}
.sub{font-size:60px;line-height:1.4;color:#D6DEE9;max-width:1350px}
.spacer{flex:1}
.qrrow{display:flex;align-items:center;gap:64px}
.qr{background:#fff;padding:34px;border-radius:28px;line-height:0}
.qr img{width:420px;height:420px;display:block}
.ask{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:86px;line-height:1.06;text-transform:uppercase}
.ask span{color:${ACCENT}}
.url{font-size:40px;color:#9FB0C4;margin-top:26px}
.bar{position:absolute;left:0;right:0;bottom:0;height:26px;background:${ACCENT}}
</style></head><body>
<img class="logo" src="${LOGO}">
<div class="kick">Northgate Strength PT Academy</div>
<h1>Become a<br><span class="hl">qualified</span><br>Personal<br>Trainer.</h1>
<div class="sub">Right here, in this gym. Around the job you already have.</div>
<div class="spacer"></div>
<div class="qrrow">
  <div class="qr"><img src="${qr}"></div>
  <div>
    <div class="ask">Thinking about it?<br><span>Scan here.</span></div>
    <div class="url">${URL_TEXT}</div>
  </div>
</div>
<div class="bar"></div>
</body></html>`;

/** A4 at 150dpi — the sheet you hand someone who asks at the desk. */
const handout = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1240px;height:1754px;background:#fff;font-family:Poppins,sans-serif;color:#1E2A38;position:relative}
.top{background:${NAVY};padding:56px 80px;color:#fff}
.top .kick{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:24px;letter-spacing:.2em;
  text-transform:uppercase;color:${ACCENT};margin-bottom:14px}
.top h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:76px;line-height:1;text-transform:uppercase}
.body{padding:56px 80px}
h2{font-family:'Barlow Condensed',sans-serif;font-size:38px;text-transform:uppercase;color:${NAVY};margin:0 0 18px}
p{font-size:23px;line-height:1.6;color:#3A4A5C;margin:0 0 26px}
ul{margin:0 0 30px 26px}
li{font-size:23px;line-height:1.75;color:#3A4A5C}
.box{background:#F3F6FA;border-left:8px solid ${ACCENT};padding:30px 34px;margin:0 0 32px}
.box .big{font-family:'Barlow Condensed',sans-serif;font-size:52px;color:${NAVY};font-weight:800}
.foot{position:absolute;bottom:0;left:0;right:0;background:${NAVY};padding:40px 80px;
  display:flex;align-items:center;gap:40px}
.foot .qr{background:#fff;padding:16px;border-radius:14px;line-height:0}
.foot .qr img{width:150px;height:150px;display:block}
.foot .t{color:#fff}
.foot .t b{font-family:'Barlow Condensed',sans-serif;font-size:44px;text-transform:uppercase;display:block}
.foot .t span{color:#9FB0C4;font-size:22px}
</style></head><body>
<div class="top"><div class="kick">Northgate Strength</div><h1>Become a qualified<br>Personal Trainer</h1></div>
<div class="body">
  <h2>What it is</h2>
  <p>A nationally recognised, regulated Personal Training qualification — Level 2 and Level 3 — that
     you complete around the job you already have. You study online, and you train here.</p>
  <h2>Who it's for</h2>
  <ul>
    <li>People who already love training and want it to pay</li>
    <li>Career changers — most people who start are in their thirties and forties</li>
    <li>Anyone who's been asked "do you do this for a living?"</li>
  </ul>
  <h2>What it costs</h2>
  <div class="box">
    <div class="big">£1,399 &nbsp;or&nbsp; £599 to start</div>
    <p style="margin:8px 0 0;font-size:21px;">Flexible payment plans available. Ask at reception and
       we'll go through the options properly.</p>
  </div>
  <h2>How long</h2>
  <p>Most people finish in the expected timeframe, depending how consistently they study. You don't
     need to leave your job to begin — that's the whole point of how it's built.</p>
  <h2>The first step</h2>
  <p>There isn't one, beyond a conversation. Scan the code below or grab any member of the team.</p>
</div>
<div class="foot">
  <div class="qr"><img src="${qr}"></div>
  <div class="t"><b>Scan to find out more</b><span>${URL_TEXT}</span></div>
</div>
</body></html>`;

console.log(APPLY ? "Rendering and uploading…" : "DRY RUN — rendering only\n");

await renderHtml(poster, { width: 1754, height: 2480, out: path.join(OUT, "poster-a3.jpg"), quality: 92, name: "demo-poster" });
console.log("  rendered  A3 QR poster");
await renderHtml(handout, { width: 1240, height: 1754, out: path.join(OUT, "member-handout.jpg"), quality: 92, name: "demo-handout" });
console.log("  rendered  A4 member handout");

// The agreement comes from the same generator that produces the real ones, so
// the demo shows exactly the document a partner signs.
const agreementMod = await import(
  pathToFileURL(path.join(ROOT, "app", "lib", "server", "generatePartnershipAgreementPDF.server.ts")).href
);
const { buffer: agreementPdf } = await agreementMod.generatePartnershipAgreementPDFServer({
  gymName: "Northgate Strength",
  companyNumber: "09876543",
  registeredAddress: "Northgate Retail Park, Wakefield, WF1 1AA",
  repName: "Sam Okafor",
  repPosition: "Director",
  repEmail: "demo@ptlaunchlab.co.uk",
  gymSignature: "Sam Okafor",
  gymSignatureType: "typed",
  signedAt: new Date(Date.now() - 200 * 86400000).toISOString(),
});
console.log("  generated signed partnership agreement");

if (!APPLY) {
  console.log(`\nFiles in ${path.relative(ROOT, OUT)}. Nothing uploaded — add --apply.`);
  process.exit(0);
}

const [partner] = await (
  await fetch(`${U}/rest/v1/pp_partners?slug=eq.demo&select=id`, { headers: H })
).json();
if (!partner) { console.error("No demo partner — run seed-demo-partner.mts first."); process.exit(1); }

// Clear this partner's own files so a re-run replaces rather than duplicates.
const existing = await (
  await fetch(`${U}/rest/v1/pp_resources?partner_id=eq.${partner.id}&select=id,storage_path`, { headers: H })
).json();
for (const e of existing) {
  if (e.storage_path) {
    await fetch(`${U}/storage/v1/object/${BUCKET}/${e.storage_path}`, { method: "DELETE", headers: H });
  }
}
await fetch(`${U}/rest/v1/pp_resources?partner_id=eq.${partner.id}`, { method: "DELETE", headers: H });

interface Upload { file: string | Buffer; name: string; mime: string; category: string; title: string; description: string; pack?: string }

const uploads: Upload[] = [
  { file: path.join(OUT, "poster-a3.jpg"), name: "northgate-poster-a3.jpg", mime: "image/jpeg", category: "print",
    title: "A3 academy poster", description: "Print at A3 for the front desk or the changing room wall. The QR goes straight to your academy page." },
  { file: path.join(OUT, "member-handout.jpg"), name: "northgate-member-handout.jpg", mime: "image/jpeg", category: "learner",
    title: "Member handout", description: "Hand this to anyone who asks. Covers what it is, who it's for, what it costs and the first step." },
  { file: agreementPdf, name: "northgate-partnership-agreement.pdf", mime: "application/pdf", category: "legal",
    title: "Your signed partnership agreement", description: "The agreement between us, as signed. Keep a copy for your records." },
];

for (const f of readdirSync(OUT).filter((f) => /^\d\d-.*\.jpg$/.test(f)).sort()) {
  const label = f.replace(/^\d\d-/, "").replace(/\.jpg$/, "").replace(/-/g, " ");
  uploads.push({
    file: path.join(OUT, f),
    name: `northgate-screen-${f}`,
    mime: "image/jpeg",
    category: "digital",
    title: `Gym screen — ${label}`,
    description: "1920×1080, built to loop on a screen in the gym.",
  });
}

console.log("");
for (const up of uploads) {
  const data = Buffer.isBuffer(up.file) ? up.file : readFileSync(up.file);
  const storagePath = `partners/${partner.id}/${Date.now().toString(36)}-${up.name}`;
  const r = await fetch(`${U}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: { ...H, "Content-Type": up.mime },
    body: new Uint8Array(data),
  });
  if (!r.ok) { console.log(`  FAILED ${up.title} — ${r.status}`); continue; }

  await fetch(`${U}/rest/v1/pp_resources`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_id: partner.id, category: up.category, title: up.title,
      description: up.description, storage_path: storagePath,
      mime: up.mime, file_size: data.length, pack: up.pack ?? null,
    }),
  });
  console.log(`  added  ${up.category.padEnd(9)} ${up.title}`);
}

console.log(`\n${uploads.length} resources on the demo portal.`);
