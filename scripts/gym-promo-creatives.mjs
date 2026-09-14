// scripts/gym-promo-creatives.mjs
/**
 * Monthly promo graphics for partner gyms.
 *
 *   node --use-system-ca scripts/gym-promo-creatives.mjs             # every gym, every month
 *   node --use-system-ca scripts/gym-promo-creatives.mjs ebor        # one gym
 *   node --use-system-ca scripts/gym-promo-creatives.mjs --month=nov # one month
 *
 * PHOTO-FREE BY DEFAULT, for the same reason as gym-ad-creatives.mjs: generic
 * stock in the gym's own town undercuts the exact claim the graphic makes.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { renderHtml } from "./render-image.mjs";
import { SIZES } from "./lib/ad-concepts.mjs";
import { MONTHS, monthText, allMonthStrings, tokensForMonth } from "./lib/promo-calendar.mjs";
import { adMarkup } from "./lib/ad-markup.mjs";
import { findBannedClaims, findBrandLeaks, assertDimensions } from "./lib/ad-guards.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();
const ORIGIN = "https://ptlaunchlab.co.uk";
const OUT_ROOT = path.join(ROOT, "ad-assets", "gym-promos");

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const monthArg = args.find((a) => a.startsWith("--month="))?.split("=")[1];
const months = monthArg ? MONTHS.filter((m) => m.key === monthArg) : MONTHS;
if (!months.length) throw new Error(`no such month: ${monthArg}`);

function localUrl(publicPath) {
  const abs = path.join(ROOT, "public", publicPath.replace(/^\//, ""));
  if (!existsSync(abs)) throw new Error(`missing asset: ${abs}`);
  return "file:///" + abs.replace(/\\/g, "/");
}

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
  const outDir = path.join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const photo = photoFor(slug);

  for (const month of months) {
    const tokens = tokensForMonth(brand, ORIGIN, slug, month.key);

    // Gate the copy before a single pixel is painted.
    for (const line of allMonthStrings(month, tokens)) {
      const banned = findBannedClaims(line);
      if (banned.length) throw new Error(`${slug}/${month.key}: banned claim ${banned.join(", ")} in "${line}"`);
      if (findBrandLeaks(line).length) throw new Error(`${slug}/${month.key}: white-label leak in "${line}"`);
      if (line.includes("{{")) throw new Error(`${slug}/${month.key}: unresolved token in "${line}"`);
    }

    const text = monthText(month, tokens);
    for (const { w, h } of SIZES) {
      const html = adMarkup(brand, text, { w, h, photo, logoUrl: localUrl(brand.logoUrl) });
      const base = `${month.key}-${w}x${h}`;
      writeFileSync(path.join(outDir, `${base}.html`), html, "utf8");
      const meta = await renderHtml(html, {
        width: w,
        height: h,
        out: path.join(outDir, `${base}.png`),
        name: `promo-${slug}-${base}`,
        format: "png",
      });
      assertDimensions(meta, { width: w, height: h });
      console.log(`${slug.padEnd(16)} ${base.padEnd(20)} ${photo ? "photo" : "flat"}`);
    }
  }
}

console.log(`\n${slugs.length} gyms × ${months.length} months × ${SIZES.length} sizes = ${slugs.length * months.length * SIZES.length} graphics`);
console.log(`Output: ${OUT_ROOT}`);
