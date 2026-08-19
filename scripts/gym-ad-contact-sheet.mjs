/**
 * One page showing every rendered ad, for Callum to approve before upload.
 *
 *   node scripts/gym-ad-contact-sheet.mjs
 *
 * Nothing reaches pp_resources until this has been looked at. Opening 36 PNGs
 * one at a time is how a wrong logo or a clipped headline reaches nine gyms.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { CONCEPTS, SIZES } from "./lib/ad-concepts.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const OUT_ROOT = path.join(process.cwd(), "ad-assets", "gym-ads");
const REVIEW = path.join(OUT_ROOT, "_review");
mkdirSync(REVIEW, { recursive: true });

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo");
const missing = [];
let sections = "";

for (const slug of slugs) {
  const brand = BRANDS[slug];
  let cards = "";
  for (const concept of CONCEPTS) {
    for (const { w, h } of SIZES) {
      const file = `${concept.id}-${w}x${h}.png`;
      const abs = path.join(OUT_ROOT, slug, file);
      if (!existsSync(abs)) {
        missing.push(`${slug}/${file}`);
        continue;
      }
      cards += `<figure><img src="../${slug}/${file}"><figcaption>${concept.label} · ${w}×${h}</figcaption></figure>`;
    }
  }
  sections += `<section><h2>${brand.gymName}</h2><p class="meta">${brand.adTown} · accent ${brand.darkAccent || brand.primaryColor} · logo ${brand.logoHasAlpha ? "transparent" : "plated"}</p><div class="row">${cards}</div></section>`;
}

const expected = slugs.length * CONCEPTS.length * SIZES.length;
writeFileSync(
  path.join(REVIEW, "contact-sheet.html"),
  `<!doctype html><meta charset="utf-8"><title>Partner ad packs — review</title><style>
body{background:#0A0A0A;color:#fff;font:15px/1.5 system-ui,sans-serif;margin:0;padding:32px}
h1{font-size:26px;margin:0 0 4px} .count{color:#9aa;margin-bottom:32px}
section{margin-bottom:44px;border-top:1px solid #222;padding-top:22px}
h2{font-size:20px;margin:0} .meta{color:#8a94a0;font-size:13px;margin:2px 0 16px}
.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0} img{height:420px;width:auto;display:block;background:#111;border:1px solid #222}
figcaption{color:#8a94a0;font-size:12px;margin-top:6px}
.missing{background:#3a1114;border:1px solid #7d2731;padding:14px 18px;border-radius:8px;margin-bottom:24px}
</style>
<h1>Partner Meta ad packs — review</h1>
<p class="count">${expected - missing.length} of ${expected} rendered</p>
${missing.length ? `<div class="missing"><strong>Missing:</strong> ${missing.join(", ")}</div>` : ""}
${sections}`,
  "utf8",
);

console.log(`${expected - missing.length}/${expected} rendered`);
if (missing.length) console.log(`MISSING: ${missing.join(", ")}`);
console.log(path.join(REVIEW, "contact-sheet.html"));
