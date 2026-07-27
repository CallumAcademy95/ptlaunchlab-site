// Builds Google Business Profile-ready images into public/gbp/ and writes a
// manifest of everything available to post.
//
//   node --use-system-ca scripts/gbp-images.mjs
//
// Source photos in public/ are 2000x2000 PNGs at 2-3MB each — wrong aspect ratio
// for GBP (which wants 4:3 and crops anything else badly) and needlessly heavy.
// This produces 1200x900 JPEGs using sharp's attention crop, which keeps the
// subject in frame rather than slicing heads off with a naive centre crop.
//
// YouTube thumbnails are NOT copied. They are already public on i.ytimg.com and
// Google fetches post images from any public URL, so storing them would only add
// weight to the repo. They are 16:9 and carry text overlays, so they suit post
// images rather than profile photos.

import sharp from "sharp";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const PUBLIC = "public";
const OUT = path.join(PUBLIC, "gbp");
const SITE = "https://ptlaunchlab.co.uk";
const W = 1200;
const H = 900;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const manifest = [];

async function convert(src, outName, caption, use) {
  const outPath = path.join(OUT, outName);
  await sharp(src)
    .resize(W, H, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);
  manifest.push({
    file: `gbp/${outName}`,
    url: `${SITE}/gbp/${outName}`,
    source: src.replace(/\\/g, "/"),
    caption,
    use,
  });
  return outPath;
}

const learners = readdirSync(PUBLIC)
  .filter((f) => /^learner-\d+\.png$/i.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

for (const f of learners) {
  const n = String(f.match(/\d+/)[0]).padStart(2, "0");
  await convert(
    path.join(PUBLIC, f),
    `learner-${n}.jpg`,
    "Graduate with NCFE Level 3 certificate",
    "post image + profile photo (People at work)",
  );
}

const team = [
  ["callum.jpg", "team-callum.jpg", "Callum Brown, PT Launch Lab"],
  ["ryan.jpg", "team-ryan.jpg", "Ryan Robinson, PT Launch Lab"],
  ["miles.jpg", "team-miles.jpg", "Miles Halstead, PT Launch Lab"],
];

for (const [src, out, caption] of team) {
  const p = path.join(PUBLIC, src);
  if (existsSync(p)) await convert(p, out, caption, "post image + profile photo (Team)");
}

for (const [src, out, caption] of [
  ["og-image.png", "brand-og.jpg", "PT Launch Lab brand image"],
  ["logo.png", "brand-logo.jpg", "PT Launch Lab logo"],
]) {
  const p = path.join(PUBLIC, src);
  if (existsSync(p)) await convert(p, out, caption, "post image (generic fallback)");
}

// ── YouTube thumbnails — referenced, not stored ──────────────────────────────
const TRANSCRIPTS = "app/podcast/transcripts";
const episodes = readdirSync(TRANSCRIPTS)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    try {
      return JSON.parse(readFileSync(path.join(TRANSCRIPTS, f), "utf8"));
    } catch {
      return null;
    }
  })
  .filter((e) => e && e.id)
  .sort((a, b) => (Number(b.ep) || 0) - (Number(a.ep) || 0));

for (const e of episodes) {
  manifest.push({
    file: null,
    url: `https://i.ytimg.com/vi/${e.id}/maxresdefault.jpg`,
    source: `youtube:${e.id}`,
    caption: `Ep ${e.ep ?? "?"} — ${e.title}`,
    use: "post image (podcast episode, 16:9 so Google will crop)",
    episodeUrl: `${SITE}/podcast/${e.slug}`,
  });
}

writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

const built = manifest.filter((m) => m.file).length;
console.log(`${built} images built into ${OUT}`);
console.log(`${manifest.length - built} YouTube thumbnails referenced`);
console.log(`manifest: ${path.join(OUT, "manifest.json")}`);
