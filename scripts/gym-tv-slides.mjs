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
 *   NN-name.jpg                                  the ten slides
 *   <gym>-gym-screen-slides.mp4                  looping screen video (ffmpeg)
 *   <gym>-gym-screen-slides-editable.pptx        same slides, text editable
 *
 * Add --no-video / --no-pptx to skip either.
 *
 * PRICE: pay in full leads. £999.99 is the headline on the price slide; the
 * monthly plan sits underneath, smaller. No codes, no intakes, no deadlines:
 * enrolment is rolling. The QR and the URL go to the gym's own enrol page.
 *
 * PHOTOS: drop real photographs of the gym into partner-photos/<slug>/ and they
 * are used as slide backgrounds automatically, darkened so the type stays
 * legible. Without them the slides fall back to solid brand colour, which looks
 * fine — but a photo of their actual gym is the whole point of "right here, in
 * this gym", and stock or AI imagery undermines exactly that claim.
 *
 * Read at distance by someone mid-set: one idea per slide, very few words, and
 * type large enough to land from across a gym floor.
 */

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import PptxGenJS from "pptxgenjs";
import path from "node:path";
import QRCode from "qrcode";
import { renderHtml } from "./render-image.mjs";
// Prices come from the one source the site uses — never from gym-brands.json,
// which no longer carries any (October 2026: same price everywhere, no codes).
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PAYMENTS } from "../app/lib/pricing.ts";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();

/** Local logos need a file:// URL for headless Chrome; remote ones load as-is. */
function logoSrc(url) {
  if (!url) return null;
  if (/^https?:/i.test(url)) return url;
  const abs = path.join(ROOT, "public", url.replace(/^\//, ""));
  return existsSync(abs) ? "file:///" + abs.replace(/\\/g, "/") : null;
}

function photosIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => "file:///" + path.join(dir, f).replace(/\\/g, "/"));
}

/**
 * Photographs for this gym.
 *
 * A gym's own photographs always win. `_shared` is the generic fallback — it
 * reads as atmosphere rather than as a claim about their premises, and the
 * moment real photos land in partner-photos/<slug>/ they take over completely.
 */
function photosFor(slug) {
  const own = photosIn(path.join(ROOT, "partner-photos", slug));
  if (own.length) return { photos: own, own: true };
  return { photos: photosIn(path.join(ROOT, "partner-photos", "_shared")), own: false };
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

function shell(brand, inner, { bg, photo, noLogo } = {}) {
  const accent = accentFor(brand);
  const logo = logoSrc(brand.logoUrl);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1920px;height:1080px;background:${bg || brand.heroBg || "#000"};
  font-family:Poppins,sans-serif;color:#fff;overflow:hidden;position:relative}
/* Photo occupies the right of the frame, type the left. Source images are
   square, so full-bleed would crop heads and feet off; a panel uses them whole
   and keeps the type on clean background rather than fighting a scrim. */
.photo{position:absolute;top:0;right:0;bottom:0;width:46%;height:100%;object-fit:cover}
.scrim{position:absolute;top:0;right:0;bottom:0;width:52%;
  background:linear-gradient(90deg, ${bg || brand.heroBg || "#000"} 0%, rgba(0,0,0,.55) 34%, rgba(0,0,0,0) 100%)}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:120px 140px}
.haswide h1{font-size:112px}
.haswide .sub{max-width:840px;font-size:36px}
.kicker{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:34px;letter-spacing:.22em;
  text-transform:uppercase;color:${accent};margin-bottom:34px}
h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:130px;line-height:.96;
  text-transform:uppercase;letter-spacing:-.01em}
h1 .hl{color:${accent}}
h1.price{font-size:230px;line-height:.9;color:${accent}}
.alt{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:64px;line-height:1.05;
  text-transform:uppercase;color:#fff;margin-top:22px}
.sub{font-size:40px;line-height:1.4;color:#D6DEE9;margin-top:44px;max-width:1180px;font-weight:400}
.logo{position:absolute;top:78px;left:140px;height:86px;width:auto;object-fit:contain}
.foot{position:absolute;bottom:74px;left:140px;right:140px;display:flex;align-items:flex-end;
  justify-content:space-between;gap:40px;z-index:2}
.url{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:44px;letter-spacing:.02em;color:#fff}
.url span{color:${accent}}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:${accent}}
.qr{background:#fff;padding:18px;border-radius:18px;line-height:0}
.qr img{width:186px;height:186px;display:block}
.qrlabel{font-size:24px;color:#9FB0C4;text-align:center;margin-top:14px;font-weight:500}
</style></head><body class="${photo ? "haswide" : ""}">
${photo ? `<img class="photo" src="${photo}" alt=""><div class="scrim"></div>` : ""}
${logo && !noLogo ? `<img class="logo" src="${logo}" alt="">` : ""}
<div class="wrap">${inner}</div>
<div class="bar"></div>
</body></html>`;
}

function footer(brand, qrDataUri, { showQr = true } = {}) {
  const host = "ptlaunchlab.co.uk";
  const path_ = `${(brand.canonicalPath || "").replace(/^\//, "")}/enrol`;
  return `<div class="foot">
    <div class="url">${host}/<span>${path_}</span></div>
    ${showQr && qrDataUri ? `<div><div class="qr"><img src="${qrDataUri}"></div><div class="qrlabel">Scan to enrol</div></div>` : ""}
  </div>`;
}


/**
 * Ten slides, as data, so the JPEG/MP4 and the editable PPTX are painted from
 * the same words. One idea each — a screen gets glanced at, not read.
 *
 * h1 is a list of [text, accent] lines. A slide with `price` set draws the
 * pay-in-full figure as the headline and the monthly plan as a smaller line
 * underneath: £999.99 must never sit below, or be smaller than, £99.99.
 */
function slideData(brand) {
  const gym = brand.gymName;
  return [
    { name: "01-hero", kicker: `${gym} Personal Training Academy`,
      h1: [["Become a", false], ["qualified", true], ["Personal Trainer.", false]],
      sub: "Two qualifications, one course. Studied online, around the job you already have." },
    { name: "02-already-coaching", kicker: "You might already be doing it",
      h1: [["Some of you", false], ["already coach.", true]],
      sub: "You spot for people. You get asked for advice. That's the part that can't be taught." },
    { name: "03-around-your-job", kicker: "How it works",
      h1: [["Study around", false], ["your job.", true]],
      sub: "Online and flexible, built for people already working full-time. You don't quit anything to start." },
    { name: "04-not-the-fittest", kicker: "The biggest myth",
      h1: [["You don't need", false], ["to be the fittest", true], ["person in here.", false]],
      sub: "Great coaches aren't remembered for how they looked. They're remembered for who they helped." },
    { name: "05-not-too-old", kicker: "Another one",
      h1: [["You're not", false], ["too old.", true]],
      sub: "Plenty of people change career into personal training in their thirties and forties. Life experience counts for a lot in this job." },
    { name: "06-price", kicker: "What it costs", price: true,
      h1: [[COURSE_PRICE_LABEL, true]],
      alt: `or ${MONTHLY_PRICE_LABEL} a month for ${MONTHLY_PAYMENTS} months`,
      sub: "No interest on the monthly plan. Ask at reception and we'll go through it properly — no pressure." },
    { name: "07-ask", kicker: "The first step",
      h1: [["Just", false], ["ask us.", true]],
      sub: "Any member of the team can tell you how it works. It costs nothing to have the conversation." },
    { name: "08-proof", kicker: "Where every PT starts",
      h1: [["Every PT", false], ["started somewhere.", true], ["Same as you.", false]],
      sub: "The best Personal Trainers don't start qualified. They start exactly where you're standing." },
    { name: "09-monday", kicker: "Imagine",
      h1: [["What if Monday", false], ["felt different?", true]],
      sub: "The best 45 minutes of your day is the bit you squeeze in. It doesn't have to be." },
    { name: "10-cta", kicker: "Enrol any time",
      h1: [["Scan it.", false], ["Find out.", true]],
      sub: "Two minutes to see whether it's right for you. Start whenever you're ready." },
  ];
}

/** What the screen must never say. Checked before anything is rendered. */
function slideProblems(text) {
  const rules = [
    [/PT\s+Launch\s+Lab|powered by/i, "brand leak"],
    [/\bcodes?\b|discount|£\d+\s*off|was £/i, "code or discount"],
    [/\bintakes?\b|applications open|deadline|closing date|ends (soon|on)/i, "intake or deadline"],
    [/guarantee/i, "guarantee"],
    [/\bmerve\b/i, "retired platform"],
  ];
  return rules.filter(([re]) => re.test(text)).map(([, l]) => l);
}

function slideHtml(brand, s, qr, photo) {
  const h1 = s.h1.map(([t, hl]) => (hl && !s.price ? `<span class="hl">${t}</span>` : t)).join("<br>");
  const inner =
    `<div class="kicker">${s.kicker}</div>` +
    `<h1${s.price ? ' class="price"' : ""}>${h1}</h1>` +
    (s.alt ? `<div class="alt">${s.alt}</div>` : "") +
    (s.sub ? `<div class="sub">${s.sub}</div>` : "") +
    footer(brand, qr);
  return shell(brand, inner, { photo });
}

function fileSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** 8s a slide, 0.6s crossfade, H.264 — plays from a USB stick on any TV. */
function buildVideo(jpgs, out) {
  const HOLD = 8, FADE = 0.6;
  const args = ["-y"];
  for (const j of jpgs) args.push("-loop", "1", "-t", String(HOLD), "-framerate", "30", "-i", j);
  let chain = "";
  let prev = "[0:v]";
  for (let i = 1; i < jpgs.length; i++) {
    const label = i === jpgs.length - 1 ? "[vout]" : `[x${i}]`;
    const offset = (i * (HOLD - FADE)).toFixed(2);
    chain += `${prev}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset}${label};`;
    prev = label;
  }
  chain = chain.replace(/;$/, "");
  args.push("-filter_complex", chain, "-map", "[vout]", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", out);
  execFileSync("ffmpeg", args, { stdio: "pipe" });
}

/**
 * The editable deck. Background (colour, photo panel, scrim, accent bar) is a
 * flat image per slide; logo, every word and the QR are real PowerPoint
 * objects a gym can move or retype. Impact / Arial because they ship with
 * every copy of Windows and macOS — Barlow Condensed would silently fall back.
 */
async function buildPptx(brand, slides, plates, qrPng, out) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in = 1920 × 1080 at 144px/in
  const PX = (n) => n / 144;
  const accent = accentFor(brand).replace("#", "");
  const logoAbs = path.join(ROOT, "public", brand.logoUrl.replace(/^\//, ""));
  const meta = await sharp(logoAbs).metadata();
  const logoH = 86, logoW = Math.min(520, (meta.width / meta.height) * logoH);

  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { path: plates[i] };
    slide.addImage({ path: logoAbs, x: PX(140), y: PX(78), w: PX(logoW), h: PX(logoH) });

    const textW = plates.hasPhoto ? 860 : 1640;
    const runs = [{ text: s.kicker.toUpperCase(), options: { fontFace: "Arial", bold: true, fontSize: 17, color: accent, charSpacing: 4, breakLine: true, paraSpaceAfter: 10 } }];
    s.h1.forEach(([t, hl], k) => {
      runs.push({ text: t.toUpperCase(), options: { fontFace: "Impact", fontSize: s.price ? 110 : plates.hasPhoto ? 54 : 62,
        color: hl ? accent : "FFFFFF", breakLine: k < s.h1.length - 1 || !!s.alt || !!s.sub } });
    });
    if (s.alt) runs.push({ text: s.alt.toUpperCase(), options: { fontFace: "Impact", fontSize: 32, color: "FFFFFF", breakLine: true, paraSpaceBefore: 8 } });
    if (s.sub) runs.push({ text: s.sub, options: { fontFace: "Arial", fontSize: 19, color: "D6DEE9", paraSpaceBefore: 16 } });
    slide.addText(runs, { x: PX(140), y: PX(190), w: PX(textW), h: PX(640), valign: "middle", margin: 0, fit: "shrink" });

    const path_ = `${(brand.canonicalPath || "").replace(/^\//, "")}/enrol`;
    slide.addText([{ text: "ptlaunchlab.co.uk/", options: { color: "FFFFFF" } }, { text: path_, options: { color: accent } }],
      { x: PX(140), y: PX(1080 - 74 - 60), w: PX(1300), h: PX(60), fontFace: "Arial", bold: true, fontSize: 21, margin: 0, valign: "bottom" });
    slide.addShape(pptx.ShapeType.roundRect, { x: PX(1920 - 140 - 222), y: PX(1080 - 74 - 222 - 40), w: PX(222), h: PX(222), fill: { color: "FFFFFF" }, line: { color: "FFFFFF" }, rectRadius: 0.12 });
    slide.addImage({ data: qrPng, x: PX(1920 - 140 - 222 + 18), y: PX(1080 - 74 - 222 - 40 + 18), w: PX(186), h: PX(186) });
    slide.addText("Scan to enrol", { x: PX(1920 - 140 - 262), y: PX(1080 - 74 - 34), w: PX(302), h: PX(34), align: "center", fontFace: "Arial", fontSize: 12, color: "9FB0C4", margin: 0 });
  });
  await pptx.writeFile({ fileName: out });
}

const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const targets = Object.entries(BRANDS).filter(([slug]) => slug !== "demo" && (!only || slug === only));
if (!targets.length) {
  console.error(`No gym "${only}". Options: ${Object.keys(BRANDS).join(", ")}`);
  process.exit(1);
}

for (const [slug, brand] of targets) {
  const url = `https://ptlaunchlab.co.uk${brand.canonicalPath}/enrol`;
  const qrOpts = { errorCorrectionLevel: "H", margin: 1, width: 400, color: { dark: "#000000FF", light: "#FFFFFFFF" } };
  const qr = await QRCode.toDataURL(url, qrOpts);

  const { photos, own } = photosFor(slug);
  console.log(
    `\n${brand.gymName}  (${accentFor(brand)})  -> ${url}  ` +
      (photos.length ? `${photos.length} photo(s) — ${own ? "their own" : "shared"}` : "no photos — solid colour")
  );

  const slides = slideData(brand);
  for (const s of slides) {
    const text = [s.kicker, ...s.h1.map(([t]) => t), s.alt ?? "", s.sub ?? ""].join(" ");
    const bad = slideProblems(text);
    if (bad.length) throw new Error(`${slug} ${s.name}: ${bad.join(", ")} in "${text}"`);
  }

  const dir = path.join(ROOT, "ad-assets", "gym-tv", slug);
  mkdirSync(dir, { recursive: true });
  const jpgs = [];
  const plates = [];
  plates.hasPhoto = photos.length > 0;
  for (const [i, s] of slides.entries()) {
    const photo = photos.length ? photos[i % photos.length] : null;
    const out = path.join(dir, `${s.name}.jpg`);
    await renderHtml(slideHtml(brand, s, qr, photo), { width: 1920, height: 1080, out, quality: 92, name: `tv-${slug}-${s.name}` });
    jpgs.push(out);
    if (!flags.includes("--no-pptx")) {
      const plate = path.join(dir, "_plates", `${s.name}.jpg`);
      await renderHtml(shell(brand, "", { photo, noLogo: true }), { width: 1920, height: 1080, out: plate, quality: 90, name: `tvp-${slug}-${s.name}` });
      plates.push(plate);
    }
    console.log(`   ${s.name}`);
  }

  const base = `${fileSlug(brand.gymName)}-gym-screen-slides`;
  if (!flags.includes("--no-video")) {
    buildVideo(jpgs, path.join(dir, `${base}.mp4`));
    console.log(`   ${base}.mp4`);
  }
  if (!flags.includes("--no-pptx")) {
    const qrPng = await QRCode.toDataURL(url, { ...qrOpts, width: 600 });
    await buildPptx(brand, slides, plates, qrPng, path.join(dir, `${base}-editable.pptx`));
    console.log(`   ${base}-editable.pptx`);
  }
}

console.log("\nDone — ad-assets/gym-tv/<slug>/");
