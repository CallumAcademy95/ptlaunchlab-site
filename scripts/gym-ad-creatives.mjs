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
import { findBannedClaims, findBrandLeaks, assertDimensions } from "./lib/ad-guards.mjs";
import { adMarkup } from "./lib/ad-markup.mjs";
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
      const html = adMarkup(brand, text, { w, h, photo, logoUrl: localUrl(brand.logoUrl) });
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
