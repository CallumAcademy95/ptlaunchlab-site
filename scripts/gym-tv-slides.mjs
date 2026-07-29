/**
 * Branded TV screen slides for partner gyms.
 *
 *   node --use-system-ca scripts/gym-tv-slides.mjs            # every gym
 *   node --use-system-ca scripts/gym-tv-slides.mjs ebor       # one gym
 *
 * 1920×1080 JPEGs, ten per gym, built to loop on a screen in the gym. Rendered
 * from each gym's own palette and logo in gym-brands.json, because the whole
 * point is that it's their academy — nothing here carries our branding.
 *
 * Output: ad-assets/gym-tv/<slug>/
 *
 * Read at distance by someone mid-set: one idea per slide, very few words, and
 * type large enough to land from across a gym floor.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { renderHtml } from "./render-image.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();

/** Local logos need a file:// URL for headless Chrome; remote ones load as-is. */
function logoSrc(url) {
  if (!url) return null;
  if (/^https?:/i.test(url)) return url;
  const abs = path.join(ROOT, "public", url.replace(/^\//, ""));
  return existsSync(abs) ? "file:///" + abs.replace(/\\/g, "/") : null;
}

/**
 * Accent that actually shows up.
 *
 * Every slide sits on a near-black background. Ebor's primaryColor is #1A1A1A,
 * which would be invisible — darkAccent exists on the gym config for exactly
 * this reason, so prefer it and only fall back to primary.
 */
function accentFor(brand) {
  return brand.darkAccent || brand.primaryColor || "#FFFFFF";
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

function shell(brand, inner, { bg } = {}) {
  const accent = accentFor(brand);
  const logo = logoSrc(brand.logoUrl);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1920px;height:1080px;background:${bg || brand.heroBg || "#000"};
  font-family:Poppins,sans-serif;color:#fff;overflow:hidden;position:relative}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:120px 140px}
.kicker{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:34px;letter-spacing:.22em;
  text-transform:uppercase;color:${accent};margin-bottom:34px}
h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:130px;line-height:.96;
  text-transform:uppercase;letter-spacing:-.01em}
h1 .hl{color:${accent}}
.sub{font-size:40px;line-height:1.4;color:#D6DEE9;margin-top:44px;max-width:1180px;font-weight:400}
.logo{position:absolute;top:78px;left:140px;height:86px;width:auto;object-fit:contain}
.foot{position:absolute;bottom:74px;left:140px;right:140px;display:flex;align-items:flex-end;
  justify-content:space-between;gap:40px}
.url{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:44px;letter-spacing:.02em;color:#fff}
.url span{color:${accent}}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:${accent}}
.qr{background:#fff;padding:18px;border-radius:18px;line-height:0}
.qr img{width:186px;height:186px;display:block}
.qrlabel{font-size:24px;color:#9FB0C4;text-align:center;margin-top:14px;font-weight:500}
</style></head><body>
${logo ? `<img class="logo" src="${logo}" alt="">` : ""}
<div class="wrap">${inner}</div>
<div class="bar"></div>
</body></html>`;
}

function footer(brand, qrDataUri, { showQr = true } = {}) {
  const host = "ptlaunchlab.co.uk";
  const path_ = (brand.canonicalPath || "").replace(/^\//, "");
  return `<div class="foot">
    <div class="url">${host}/<span>${path_}</span></div>
    ${showQr && qrDataUri ? `<div><div class="qr"><img src="${qrDataUri}"></div><div class="qrlabel">Scan to find out more</div></div>` : ""}
  </div>`;
}

/** Ten slides. One idea each — a screen gets glanced at, not read. */
function slides(brand, qr) {
  const accent = accentFor(brand);
  const gym = brand.gymName;
  const price = brand.fullPrice;
  const deposit = brand.depositPrice;

  const S = (kicker, h1, sub, opts = {}) =>
    shell(brand, `<div class="kicker">${kicker}</div><h1>${h1}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}${footer(brand, qr, opts)}`, opts);

  return [
    ["01-hero", S(`${gym} Personal Training Academy`,
      `Become a<br><span class="hl">qualified</span><br>Personal Trainer.`,
      `Right here, in this gym. Around the job you already have.`)],

    ["02-already-coaching", S("You might already be doing it",
      `Some of you<br><span class="hl">already coach.</span>`,
      `You spot for people. You get asked for advice. That's the part that can't be taught.`)],

    ["03-around-your-job", S("How it works",
      `Study around<br><span class="hl">your job.</span>`,
      `Online and flexible, built for people already working full-time. You don't quit anything to start.`)],

    ["04-not-the-fittest", S("The biggest myth",
      `You don't need<br><span class="hl">to be the fittest</span><br>person in here.`,
      `Great coaches aren't remembered for how they looked. They're remembered for who they helped.`)],

    ["05-not-too-old", S("Another one",
      `You're not<br><span class="hl">too old.</span>`,
      `Most people who start are changing career in their thirties and forties. Experience counts for a lot in this job.`)],

    ["06-price", S("What it costs",
      `£${price}<br><span class="hl">or £${deposit} to start.</span>`,
      `Payment plans available. Ask at reception and we'll go through the options properly — no pressure.`)],

    ["07-ask", S("The first step",
      `Just<br><span class="hl">ask us.</span>`,
      `Any member of the team can tell you how it works. It costs nothing to have the conversation.`)],

    ["08-proof", S("Real members",
      `They started<br><span class="hl">as members.</span><br>Same as you.`,
      `The best Personal Trainers don't start qualified. They start exactly where you're standing.`)],

    ["09-monday", S("Imagine",
      `What if Monday<br><span class="hl">felt different?</span>`,
      `The best 45 minutes of your day is the bit you squeeze in. It doesn't have to be.`)],

    ["10-cta", S("Applications open",
      `Scan it.<br><span class="hl">Find out.</span>`,
      `Two minutes to see whether it's right for you.${brand.promoCode ? ` Members' code: <strong style="color:${accent}">${brand.promoCode}</strong>` : ""}`)],
  ];
}

const only = process.argv[2];
const targets = Object.entries(BRANDS).filter(([slug]) => !only || slug === only);
if (!targets.length) {
  console.error(`No gym "${only}". Options: ${Object.keys(BRANDS).join(", ")}`);
  process.exit(1);
}

for (const [slug, brand] of targets) {
  const url = `https://ptlaunchlab.co.uk${brand.canonicalPath}`;
  const qr = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 400,
    color: { dark: "#000000FF", light: "#FFFFFFFF" },
  });

  console.log(`\n${brand.gymName}  (${accentFor(brand)})`);
  for (const [name, html] of slides(brand, qr)) {
    const out = path.join(ROOT, "ad-assets", "gym-tv", slug, `${name}.jpg`);
    await renderHtml(html, { width: 1920, height: 1080, out, quality: 92, name: `tv-${slug}-${name}` });
    console.log(`   ${name}`);
  }
}

console.log("\nDone — ad-assets/gym-tv/<slug>/");
