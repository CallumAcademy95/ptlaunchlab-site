// scripts/harvest-gym-photos.mjs
/**
 * Fill partner-photos/<slug>/ with photographs of the gym's actual premises.
 *
 *   node --use-system-ca scripts/harvest-gym-photos.mjs           # every gym
 *   node --use-system-ca scripts/harvest-gym-photos.mjs ebor      # one gym
 *
 * The ads are photo-free until this runs, and that is a safe default — the
 * point of a local ad is "this is OUR gym", and generic stock breaks exactly
 * that claim. Real photographs of their floor are the upgrade.
 *
 * Two sources: the gym's Google Business Profile (usually better lit and better
 * framed than their website) and their own site.
 *
 * Faces are deprioritised deliberately. Consent given for a photo on a website
 * gallery does not obviously extend to a paid advert, and equipment and floor
 * shots make the same point with none of that question attached. sharp has no
 * face detection and filenames tell you nothing, so scoring is a vision call.
 *
 * Nothing is deleted. Rejects land in _rejected/ with the reason, so the
 * ranking can be overruled by hand.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) throw new Error("GOOGLE_PLACES_API_KEY missing from .env.local");

const anthropic = new Anthropic();
const BRANDS_PATH = new URL("./gym-brands.json", import.meta.url);
const BRANDS = JSON.parse(readFileSync(BRANDS_PATH, "utf8"));
const ROOT = process.cwd();
const MIN_EDGE = 1200;
const KEEP = 8;

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/** Resolve and cache the gym's Google place id from its name and town. */
async function placeIdFor(slug, brand) {
  if (brand.placeId) return brand.placeId;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: `${brand.gymName} ${brand.location}` }),
  });
  const body = await res.json();
  const id = body.places?.[0]?.id;
  if (!id) {
    console.warn(`${slug}: no Google place found for "${brand.gymName} ${brand.location}"`);
    return null;
  }
  console.log(`${slug}: matched "${body.places[0].displayName?.text}"`);
  brand.placeId = id;
  return id;
}

async function placePhotos(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=photos`, {
    headers: { "X-Goog-Api-Key": PLACES_KEY },
  });
  const body = await res.json();
  return (body.photos ?? []).slice(0, 12).map(
    (p) => `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&key=${PLACES_KEY}`,
  );
}

/** Images referenced by the gym's own homepage, both <img> and CSS backgrounds. */
async function sitePhotos(siteUrl) {
  let html;
  try {
    const res = await fetch(siteUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }
  const urls = new Set();
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/url\((["']?)([^)"']+\.(?:jpe?g|png|webp))\1\)/gi)) urls.add(m[2]);
  return [...urls]
    .map((u) => (u.startsWith("http") ? u : new URL(u, siteUrl).href))
    .filter((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u))
    .slice(0, 30);
}

/** Cheap average hash, to drop the same photo arriving from both sources. */
async function aHash(buf) {
  const px = await sharp(buf).greyscale().resize(8, 8, { fit: "fill" }).raw().toBuffer();
  const mean = px.reduce((a, b) => a + b, 0) / px.length;
  return [...px].map((v) => (v > mean ? "1" : "0")).join("");
}

async function score(buf, gymName) {
  const b64 = (await sharp(buf).resize({ width: 800 }).jpeg({ quality: 70 }).toBuffer()).toString("base64");
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
          {
            type: "text",
            text:
              `This may be a photo of ${gymName}, a UK gym. It is a candidate background for a ` +
              `paid advert. Reply with ONLY JSON: {"hasIdentifiableFaces":bool,` +
              `"isGymInterior":bool,"usableAsAdBackground":1-5,"note":"<12 words"}. ` +
              `usableAsAdBackground judges whether dark overlaid text would sit on it legibly. ` +
              `Logos, screenshots, posters and stock collages score 1.`,
          },
        ],
      },
    ],
  });
  const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { hasIdentifiableFaces: true, isGymInterior: false, usableAsAdBackground: 1, note: "unparseable" };
  }
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const outDir = path.join(ROOT, "partner-photos", slug);
  const rejectDir = path.join(outDir, "_rejected");
  mkdirSync(rejectDir, { recursive: true });

  const placeId = await placeIdFor(slug, brand);
  const urls = [...(placeId ? await placePhotos(placeId) : []), ...(await sitePhotos(brand.siteUrl))];
  console.log(`${slug}: ${urls.length} candidates`);

  const seen = new Set();
  const scored = [];
  for (const url of urls) {
    let buf;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      buf = Buffer.from(await res.arrayBuffer());
    } catch {
      continue;
    }

    const meta = await sharp(buf).metadata().catch(() => null);
    if (!meta) continue;
    if (Math.min(meta.width, meta.height) < MIN_EDGE) continue;

    const hash = await aHash(buf);
    if (seen.has(hash)) continue;
    seen.add(hash);

    scored.push({ buf, meta, verdict: await score(buf, brand.gymName) });
  }

  // Face-free gym interiors first, then by usability. A face is not an outright
  // reject — a gym with nothing else usable is better served by a good photo
  // with a person in it than by no photo at all — but it never outranks one.
  scored.sort((a, b) => {
    const rank = (s) =>
      (s.verdict.hasIdentifiableFaces ? 0 : 100) +
      (s.verdict.isGymInterior ? 20 : 0) +
      s.verdict.usableAsAdBackground;
    return rank(b) - rank(a);
  });

  const reasons = [];
  for (const [i, s] of scored.entries()) {
    const keep = i < KEEP && s.verdict.usableAsAdBackground >= 3;
    const name = `${String(i + 1).padStart(2, "0")}.jpg`;
    const jpg = await sharp(s.buf).jpeg({ quality: 88 }).toBuffer();
    writeFileSync(path.join(keep ? outDir : rejectDir, name), jpg);
    reasons.push({ file: name, kept: keep, ...s.verdict, width: s.meta.width, height: s.meta.height });
  }
  writeFileSync(path.join(rejectDir, "reasons.json"), JSON.stringify(reasons, null, 2), "utf8");
  console.log(`${slug}: kept ${reasons.filter((r) => r.kept).length}, rejected ${reasons.filter((r) => !r.kept).length}`);
}

writeFileSync(BRANDS_PATH, JSON.stringify(BRANDS, null, 2) + "\n", "utf8");
console.log("place ids cached to gym-brands.json");
