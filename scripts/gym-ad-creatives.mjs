// scripts/gym-ad-creatives.mjs
/**
 * Meta ad graphics for partner gyms.
 *
 *   node --use-system-ca scripts/gym-ad-creatives.mjs           # every gym
 *   node --use-system-ca scripts/gym-ad-creatives.mjs ebor      # one gym
 *
 * Two concepts × two sizes per gym → ad-assets/gym-ads/<slug>/. The partner runs
 * these from their own Meta account with their own money, so nothing here
 * carries our branding: it is their academy, in their town, under their logo.
 *
 * PHOTO-FREE BY DEFAULT. Unlike gym-tv-slides.mjs there is NO _shared fallback.
 * Generic stock in a paid ad running in the gym's own town undercuts the exact
 * claim the ad makes. Real photographs in partner-photos/<slug>/ are used the
 * moment they exist (see harvest-gym-photos.mjs) and nothing else ever is.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { renderHtml } from "./render-image.mjs";
import { CONCEPTS, SIZES, conceptText, allConceptStrings } from "./lib/ad-concepts.mjs";
import {
  accentFor,
  contentBox,
  logoTreatmentFor,
  findBannedClaims,
  findBrandLeaks,
  assertDimensions,
} from "./lib/ad-guards.mjs";
import { tokensForGym } from "../app/lib/partner-playbook-tokens.ts";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();
const ORIGIN = "https://ptlaunchlab.co.uk";
const OUT_ROOT = path.join(ROOT, "ad-assets", "gym-ads");

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

function localUrl(publicPath) {
  const abs = path.join(ROOT, "public", publicPath.replace(/^\//, ""));
  if (!existsSync(abs)) throw new Error(`missing asset: ${abs}`);
  return "file:///" + abs.replace(/\\/g, "/");
}

/** A gym's own photographs, or none. Never _shared. */
function photoFor(slug) {
  const dir = path.join(ROOT, "partner-photos", slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.length ? "file:///" + path.join(dir, files[0]).replace(/\\/g, "/") : null;
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

function markup(brand, text, { w, h, photo }) {
  const accent = accentFor(brand);
  const bg = brand.heroBg || "#000000";
  const box = contentBox(w, h);
  const plate = logoTreatmentFor(brand) === "plate";
  const logo = localUrl(brand.logoUrl);
  const tall = h === 1920;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:${bg};font-family:Poppins,sans-serif;color:#fff;
  overflow:hidden;position:relative}
.photo{position:absolute;inset:0;background:url('${photo ?? ""}') center/cover no-repeat;
  filter:brightness(.32) saturate(.85)}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85))}
.stage{position:absolute;left:88px;right:88px;top:${box.top}px;bottom:${h - box.bottom}px;
  display:flex;flex-direction:column;justify-content:${tall ? "center" : "flex-end"}}
.logo{height:${tall ? 118 : 96}px;object-fit:contain;object-position:left center;display:block}
.logo-plate{align-self:flex-start;
  ${plate ? "background:#fff;padding:14px 20px;border-radius:14px;" : ""}}
.eyebrow{margin-top:${tall ? 40 : 30}px;font-family:Poppins;font-weight:600;letter-spacing:.16em;
  font-size:${tall ? 30 : 26}px;color:${accent}}
h1{margin-top:18px;font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.94;
  /* Tall stage is 904px wide (1080 - 88px margins each side). At 116px, Barlow
     Condensed 800's "YOU'RE ALREADY HERE" (concept A's first headline line)
     measures ~917px, so it wraps mid-thought and strands "HERE" alone on its
     own line on every gym's already-here-1080x1920.png. 108px measures ~854px
     for that same string — comfortably inside 904px with margin to spare —
     while every other headline line (already shorter) fits with room to spare
     at both sizes, so this is a size-only fix with no wording change. */
  font-size:${tall ? 108 : 92}px;letter-spacing:-.01em;text-transform:uppercase}
h1 .accent{color:${accent}}
.sub{margin-top:${tall ? 34 : 26}px;font-size:${tall ? 32 : 27}px;line-height:1.42;color:#E8EDF4;
  max-width:${tall ? 880 : 820}px}
.rule{margin-top:${tall ? 40 : 30}px;width:120px;height:7px;background:${accent};border-radius:4px}
.footer{margin-top:${tall ? 30 : 22}px;font-weight:600;font-size:${tall ? 30 : 25}px;color:#fff}
</style></head><body>
${photo ? `<div class="photo"></div><div class="scrim"></div>` : ""}
<div class="stage">
  <div class="logo-plate"><img class="logo" src="${logo}"></div>
  <div class="eyebrow">${text.eyebrow}</div>
  <h1>${text.headline.join("<br>")}<br><span class="accent">${text.accentLine}</span></h1>
  <div class="sub">${text.sub}</div>
  <div class="rule"></div>
  <div class="footer">${text.footer}</div>
</div>
</body></html>`;
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));
if (!slugs.length) throw new Error(`no such gym: ${only.join(", ")}`);

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const tokens = tokensForGym(brand, ORIGIN);
  const outDir = path.join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const photo = photoFor(slug);

  for (const concept of CONCEPTS) {
    // Gate the copy before a single pixel is painted.
    for (const line of allConceptStrings(concept, tokens)) {
      const banned = findBannedClaims(line);
      if (banned.length) throw new Error(`${slug}/${concept.id}: banned claim ${banned.join(", ")} in "${line}"`);
      const leaks = findBrandLeaks(line);
      if (leaks.length) throw new Error(`${slug}/${concept.id}: white-label leak in "${line}"`);
    }

    const text = conceptText(concept, tokens);
    for (const { w, h } of SIZES) {
      const html = markup(brand, text, { w, h, photo });
      const base = `${concept.id}-${w}x${h}`;
      writeFileSync(path.join(outDir, `${base}.html`), html, "utf8");
      const meta = await renderHtml(html, {
        width: w,
        height: h,
        out: path.join(outDir, `${base}.png`),
        name: `ad-${slug}-${base}`,
        format: "png",
      });
      assertDimensions(meta, { width: w, height: h });
      console.log(`${slug.padEnd(16)} ${base.padEnd(24)} ${photo ? "photo" : "flat"}`);
    }
  }
}

console.log(`\n${slugs.length} gyms × ${CONCEPTS.length} concepts × ${SIZES.length} sizes = ${slugs.length * CONCEPTS.length * SIZES.length} graphics`);
console.log(`Output: ${OUT_ROOT}`);
