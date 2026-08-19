// scripts/fetch-gym-logos.mjs
/**
 * Pull every partner logo local.
 *
 *   node --use-system-ca scripts/fetch-gym-logos.mjs
 *
 * Five logos were remote URLs fetched by headless Chrome at render time —
 * fragile, unknown resolution, and they break silently when a gym redesigns
 * their site. This downloads each once into public/gym-logos/<slug>.png and
 * records whether it carries an alpha channel.
 *
 * Ebor's source is a JPEG on Wix. JPEG has no alpha, so on a dark ad it renders
 * as a white rectangle. Rather than guess at background removal, we record
 * logoHasAlpha:false and the renderer gives that gym a deliberate white plate
 * behind the logo, so a solid-background logo reads as intentional.
 *
 * `--use-system-ca` is required: plain Node fetch fails TLS on this machine.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BRANDS_PATH = new URL("./gym-brands.json", import.meta.url);
const brands = JSON.parse(readFileSync(BRANDS_PATH, "utf8"));
const OUT_DIR = path.join(process.cwd(), "public", "gym-logos");
mkdirSync(OUT_DIR, { recursive: true });

for (const [slug, brand] of Object.entries(brands)) {
  if (slug === "demo") continue;

  const src = brand.logoUrl;
  const out = path.join(OUT_DIR, `${slug}.png`);

  let buf;
  if (/^https?:/i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${slug}: logo fetch failed ${res.status} ${src}`);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = readFileSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  }

  // Normalise to PNG at a size that survives a 1080px canvas without upscaling.
  const png = await sharp(buf).resize({ width: 600, withoutEnlargement: true }).png().toBuffer();
  writeFileSync(out, png);

  const meta = await sharp(png).metadata();
  brand.logoUrl = `/gym-logos/${slug}.png`;
  brand.logoHasAlpha = Boolean(meta.hasAlpha);
  console.log(`${slug.padEnd(16)} ${meta.width}x${meta.height} alpha=${brand.logoHasAlpha}`);
}

writeFileSync(BRANDS_PATH, JSON.stringify(brands, null, 2) + "\n", "utf8");
console.log("gym-brands.json updated");
