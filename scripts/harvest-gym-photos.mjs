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
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync, statSync } from "node:fs";
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
              `"isGymInterior":bool,"usableAsAdBackground":1-5,"visibleBrandText":"<any readable ` +
              `FACILITY name — shopfront signage, reception branding, a wall mural/mascot that ` +
              `identifies who runs the space — else empty. Do NOT report equipment, apparel, ` +
              `supplement or software brand names here (Nike, Reebok, Technogym, Eleiko, Barfoed, a ` +
              `weight-plate stamp, a TV/booking-app logo, etc.) — those appear in every gym regardless ` +
              `of who owns it and are not evidence of anything>",` +
              `"visibleBrandingConflictsWithTarget":bool,"note":"<12 words"}. ` +
              `isGymInterior means an actual gym floor, equipment or training space is visible in the ` +
              `frame — an outdoor scene, a social/event photo, a bare wall, or a shot dominated by a ` +
              `logo/signage board with no floor or equipment visible is isGymInterior:false. ` +
              `usableAsAdBackground judges whether dark overlaid text would sit on it legibly. ` +
              `Logos, screenshots, posters, signage boards and stock collages score 1 on ` +
              `usableAsAdBackground even when genuinely photographed on-site. ` +
              `visibleBrandingConflictsWithTarget is true ONLY when the FACILITY branding — the name ` +
              `over the door, on reception signage, on a wall mural/mascot, or on staff/reception ` +
              `uniform — identifies a DIFFERENT gym or fitness business than "${gymName}". A product, ` +
              `equipment, apparel or supplement brand logo visible on gear inside an otherwise plausible ` +
              `${gymName} shot is NOT a conflict — that is normal in any gym. This can happen even ` +
              `when the photo came from what should be the right source, so check the actual pixels, ` +
              `not just where the file came from.`,
          },
        ],
      },
    ],
  });
  const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      hasIdentifiableFaces: true,
      isGymInterior: false,
      usableAsAdBackground: 1,
      visibleBrandText: "",
      visibleBrandingConflictsWithTarget: false,
      note: "unparseable",
    };
  }
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const outDir = path.join(ROOT, "partner-photos", slug);
  const rejectDir = path.join(outDir, "_rejected");
  mkdirSync(rejectDir, { recursive: true });

  // A rerun writes 01.jpg.. fresh, but if this run keeps fewer photos than a
  // previous one did, the previous run's extra numbered files would
  // otherwise sit there untouched and undocumented by the reasons.json this
  // run is about to write — exactly the kind of stale, silently-still-live
  // wrong photo the keep-gate fix above exists to prevent. Sweep every
  // existing file directly in outDir into _rejected (never deleted, never
  // silently left in the folder photoFor() reads from) before scoring the
  // new candidates.
  for (const entry of readdirSync(outDir)) {
    const full = path.join(outDir, entry);
    if (statSync(full).isDirectory()) continue;
    renameSync(full, path.join(rejectDir, `stale-${Date.now()}-${entry}`));
  }

  const placeId = await placeIdFor(slug, brand);
  const urls = [
    ...(placeId ? await placePhotos(placeId) : []).map((url) => ({ url, source: "places" })),
    ...(await sitePhotos(brand.siteUrl)).map((url) => ({ url, source: "site" })),
  ];
  console.log(`${slug}: ${urls.length} candidates`);

  const seen = new Set();
  const scored = [];
  for (const { url, source } of urls) {
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

    scored.push({ buf, meta, source, verdict: await score(buf, brand.gymName) });
  }

  // Google's own Places photo library for a place can itself be contaminated
  // with another business's photos (confirmed in practice: a correctly
  // resolved place id whose entire photo set turned out to belong to a
  // different partner gym 20 miles away, including shots the model itself
  // read as conflict-free because a same-brand mural or mascot carried no
  // legible text). Two OR MORE independently flagged photos from the same
  // source is treated as evidence the whole batch is untrustworthy, not just
  // those photos — that pattern only showed up on genuine contamination in
  // testing. A single flagged photo is far more often the model tripping on
  // an equipment/supplement product shot despite being told not to (seen in
  // practice on a pre-workout tub and a locker-room "boxing" sign); that
  // photo is still excluded on its own via the keep gate below, but it alone
  // does not condemn the rest of the batch.
  const placesConflicts = scored.filter(
    (s) => s.source === "places" && s.verdict.visibleBrandingConflictsWithTarget,
  );
  const placesContaminated = placesConflicts.length >= 2;
  if (placesContaminated) {
    console.warn(
      `${slug}: Google Places photos disqualified — ${placesConflicts.length} showed a different gym's branding`,
    );
  } else if (placesConflicts.length === 1) {
    console.warn(`${slug}: one Places photo flagged a branding conflict (excluded on its own, source not disqualified)`);
  }

  // Face-free gym interiors first, then by usability. A face is not an outright
  // reject — a gym with nothing else usable is better served by a good photo
  // with a person in it than by no photo at all — but it never outranks one.
  // A branding conflict sinks a candidate to the bottom regardless of anything
  // else, so a wrong-gym photo never displaces a genuine one out of the top
  // KEEP slots.
  scored.sort((a, b) => {
    const rank = (s) =>
      (s.verdict.visibleBrandingConflictsWithTarget ? -1000 : 0) +
      (s.source === "places" && placesContaminated ? -500 : 0) +
      (s.verdict.hasIdentifiableFaces ? 0 : 100) +
      (s.verdict.isGymInterior ? 20 : 0) +
      s.verdict.usableAsAdBackground;
    return rank(b) - rank(a);
  });

  const reasons = [];
  for (const [i, s] of scored.entries()) {
    // Kept only if it is a genuine gym interior, usable, ranks in the top
    // KEEP, nothing in frame names a different business, and — when this
    // gym's Places photos have proven contaminated — it didn't come from
    // Places at all. The model's own per-photo verdicts are binding; a high
    // usability score never overrides them, and neither does an individual
    // "clean" verdict once its source batch is disqualified.
    const keep =
      i < KEEP &&
      s.verdict.isGymInterior &&
      s.verdict.usableAsAdBackground >= 3 &&
      !s.verdict.visibleBrandingConflictsWithTarget &&
      !(s.source === "places" && placesContaminated);
    const name = `${String(i + 1).padStart(2, "0")}.jpg`;
    const jpg = await sharp(s.buf).jpeg({ quality: 88 }).toBuffer();
    writeFileSync(path.join(keep ? outDir : rejectDir, name), jpg);
    reasons.push({
      file: name,
      kept: keep,
      source: s.source,
      ...s.verdict,
      width: s.meta.width,
      height: s.meta.height,
    });
  }
  writeFileSync(path.join(rejectDir, "reasons.json"), JSON.stringify(reasons, null, 2), "utf8");
  console.log(`${slug}: kept ${reasons.filter((r) => r.kept).length}, rejected ${reasons.filter((r) => !r.kept).length}`);
}

writeFileSync(BRANDS_PATH, JSON.stringify(BRANDS, null, 2) + "\n", "utf8");
console.log("place ids cached to gym-brands.json");
