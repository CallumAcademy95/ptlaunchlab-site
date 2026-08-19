// scripts/upload-gym-ad-packs.mts
/**
 * Put each gym's Meta ad pack into their resource drive.
 *
 *   npx tsx scripts/upload-gym-ad-packs.mts            # dry run
 *   npx tsx scripts/upload-gym-ad-packs.mts --apply    # upload
 *
 * Idempotent on (partner, title), the same rule import-partner-assets.mts uses,
 * so re-running after adding one gym does not re-upload thirty files.
 *
 * Category is `digital` deliberately. A new `ads` key would mean altering a
 * CHECK constraint on the live partner database, and a 201 from the Supabase
 * management API is not proof a DDL statement ran.
 *
 * PNGs go up individually rather than as a zip: the portal renders image
 * thumbnails, and a gym owner should see the ad before downloading it.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");
const BUCKET = "partner-resources";
const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const { CONCEPTS, SIZES } = await import("./lib/ad-concepts.mjs");
const OUT_ROOT = path.join(process.cwd(), "ad-assets", "gym-ads");

const partnersRes = await fetch(`${URL_BASE}/rest/v1/pp_partners?select=id,slug`, { headers: H });
const partners: { id: string; slug: string }[] = await partnersRes.json();
const bySlug = new Map(partners.map((p) => [p.slug, p.id]));

const existingRes = await fetch(`${URL_BASE}/rest/v1/pp_resources?select=partner_id,title`, { headers: H });
const existing: { partner_id: string | null; title: string }[] = await existingRes.json();
const already = new Set(existing.map((r) => `${r.partner_id}::${r.title}`));

let uploaded = 0;
let skipped = 0;

for (const slug of Object.keys(BRANDS).filter((s) => s !== "demo")) {
  const partnerId = bySlug.get(slug);
  if (!partnerId) {
    console.warn(`${slug}: no pp_partners row — skipped`);
    continue;
  }

  for (const concept of CONCEPTS) {
    for (const { w, h } of SIZES) {
      const file = `${concept.id}-${w}x${h}.png`;
      const abs = path.join(OUT_ROOT, slug, file);
      if (!existsSync(abs)) {
        console.warn(`${slug}: ${file} not rendered — skipped`);
        continue;
      }

      const shape = h === 1920 ? "Story / Reel" : "Feed";
      const title = `Meta ad — ${concept.label} (${shape})`;
      if (already.has(`${partnerId}::${title}`)) {
        skipped++;
        continue;
      }

      const objectPath = `${slug}/meta-ads/${file}`;
      console.log(`${APPLY ? "UPLOAD" : "would upload"}  ${slug.padEnd(16)} ${title}`);
      if (!APPLY) continue;

      const body = readFileSync(abs);
      const put = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
        method: "POST",
        headers: { ...H, "Content-Type": "image/png", "x-upsert": "true" },
        body,
      });
      if (!put.ok) throw new Error(`${slug} ${file}: storage ${put.status} ${await put.text()}`);

      const row = await fetch(`${URL_BASE}/rest/v1/pp_resources`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          partner_id: partnerId,
          category: "digital",
          title,
          description: `${w}×${h}. Ad copy is in your Playbook under "Meta ads — your ad pack".`,
          storage_path: objectPath,
          mime: "image/png",
          file_size: body.length,
          version: "1.0",
          sort_order: h === 1920 ? 21 : 20,
        }),
      });
      if (!row.ok) throw new Error(`${slug} ${file}: pp_resources ${row.status} ${await row.text()}`);
      uploaded++;
    }
  }
}

console.log(`\n${APPLY ? "uploaded" : "would upload"} ${uploaded}, skipped ${skipped} already present`);
