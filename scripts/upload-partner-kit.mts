/**
 * Put the partner print + screen kit into each gym's resource drive.
 *
 *   npx tsx scripts/upload-partner-kit.mts                    # dry run
 *   npx tsx scripts/upload-partner-kit.mts --apply            # upload
 *   npx tsx scripts/upload-partner-kit.mts --apply --replace  # reissue in place
 *   npx tsx scripts/upload-partner-kit.mts ebor 6fit --apply  # some gyms only
 *
 * Reads what partner-print-kit.mjs and gym-tv-slides.mjs rendered:
 *   ad-assets/partner-kit/<slug>/member-handout.pdf, academy-poster.png,
 *                                academy-poster-a3.pdf
 *   ad-assets/gym-tv/<slug>/<gym>-gym-screen-slides.mp4, ...-editable.pptx
 *   ad-assets/partner-kit/shared/gym-partner-handbook.pdf   (partner_id null)
 *
 * Titles and categories are the ones the portal has always used for these
 * items, so a gym's Resources tab reads the same as before the reissue.
 *
 * Idempotent on (partner, title), the rule import-partner-assets.mts uses:
 * without --replace an existing title is skipped. With it, the new file is
 * uploaded to a fresh path and the existing row is PATCHed, so its id (and
 * any /partners/download/[id] link) survives. Only rows in the category this
 * script owns for that title are ever matched.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const BUCKET = "partner-resources";
const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const ROOT = process.cwd();

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

interface Item {
  slug: string | null;
  abs: string;
  category: string;
  title: string;
  description: string;
}

function findOne(dir: string, suffix: string): string | null {
  if (!existsSync(dir)) return null;
  const hit = readdirSync(dir).find((f) => f.endsWith(suffix));
  return hit ? path.join(dir, hit) : null;
}

function itemsFor(slug: string): Item[] {
  const kit = path.join(ROOT, "ad-assets", "partner-kit", slug);
  const tv = path.join(ROOT, "ad-assets", "gym-tv", slug);
  const list: (Omit<Item, "abs"> & { abs: string | null })[] = [
    { slug, abs: path.join(kit, "member-handout.pdf"), category: "learner", title: "Member handout",
      description: "Print this for anyone who asks. Covers what the course is and how it works." },
    { slug, abs: path.join(kit, "academy-poster.png"), category: "print", title: "Academy poster",
      description: "Print at A3 for the front desk or the changing room wall." },
    { slug, abs: path.join(kit, "academy-poster-a3.pdf"), category: "print", title: "Academy poster — print-ready A3 PDF",
      description: "Send this to your printer, or print at A3 yourself. The page is locked to 297×420mm, so it can't come out A4 the way an image can." },
    { slug, abs: findOne(tv, "-gym-screen-slides.mp4"), category: "digital", title: "Gym screen video",
      description: "Loop this on your gym TV. Plays from a USB stick or any smart screen." },
    { slug, abs: findOne(tv, "-gym-screen-slides-editable.pptx"), category: "digital", title: "Gym screen slides (editable)",
      description: "The PowerPoint version. Change the wording and export it again yourself." },
  ];
  return list.map((i) => {
    if (!i.abs || !existsSync(i.abs)) throw new Error(`${slug}: "${i.title}" not rendered (${i.abs ?? "no file"})`);
    return i as Item;
  });
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));
const items: Item[] = slugs.flatMap(itemsFor);
if (!only.length) {
  items.push({
    slug: null,
    abs: path.join(ROOT, "ad-assets", "partner-kit", "shared", "gym-partner-handbook.pdf"),
    category: "training",
    title: "Gym partner handbook",
    description: "How the partnership works, start to finish.",
  });
  if (!existsSync(items[items.length - 1].abs)) throw new Error("handbook not rendered");
}

const partners: { id: string; slug: string; is_demo: boolean }[] = await (
  await fetch(`${URL_BASE}/rest/v1/pp_partners?select=id,slug,is_demo`, { headers: H })
).json();
const bySlug = new Map(partners.map((p) => [p.slug, p]));

const existing: { id: string; partner_id: string | null; category: string; title: string }[] = await (
  await fetch(`${URL_BASE}/rest/v1/pp_resources?select=id,partner_id,category,title`, { headers: H })
).json();
const already = new Map(existing.map((e) => [`${e.partner_id ?? "shared"}|${e.category}|${e.title}`, e]));

console.log(`${APPLY ? "UPLOADING" : "DRY RUN"} — ${items.length} file(s)${REPLACE ? " — REPLACE ON" : ""}\n`);

let added = 0, replaced = 0, skipped = 0, failed = 0;
for (const item of items) {
  const partner = item.slug ? bySlug.get(item.slug) : null;
  if (item.slug && (!partner || partner.is_demo)) {
    console.log(`  [SKIP] no live partner "${item.slug}"`);
    skipped++;
    continue;
  }
  const owner = partner?.id ?? "shared";
  const prior = already.get(`${owner}|${item.category}|${item.title}`);
  const body = readFileSync(item.abs);
  const label = `${(item.slug ?? "shared").padEnd(16)} ${item.category.padEnd(9)} ${item.title.padEnd(38)} ${(body.length / 1024).toFixed(0)}KB`;

  if (prior && !REPLACE) {
    console.log(`  [have] ${label}`);
    skipped++;
    continue;
  }
  console.log(`  ${prior ? (APPLY ? "[swap]" : "[dry~]") : APPLY ? "[add] " : "[dry] "} ${label}`);
  if (!APPLY) continue;

  const ext = path.extname(item.abs).toLowerCase();
  const base = item.slug ? `${item.slug}-${path.basename(item.abs, ext)}` : `pt-launch-lab-${path.basename(item.abs, ext)}`;
  const safe = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const storagePath = `${partner ? `partners/${partner.id}` : "shared"}/${Date.now().toString(36)}-${safe}${ext}`;

  const up = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: { ...H, "Content-Type": MIME[ext] ?? "application/octet-stream" },
    body: new Uint8Array(body),
  });
  if (!up.ok) {
    console.log(`         ! upload failed ${up.status}: ${(await up.text()).slice(0, 200)}`);
    failed++;
    continue;
  }

  const fields = { category: item.category, description: item.description, storage_path: storagePath, mime: MIME[ext] ?? null, file_size: body.length };
  const row = prior
    ? await fetch(`${URL_BASE}/rest/v1/pp_resources?id=eq.${prior.id}`, {
        method: "PATCH",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
    : await fetch(`${URL_BASE}/rest/v1/pp_resources`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: partner?.id ?? null, title: item.title, sort_order: 0, ...fields }),
      });
  if (!row.ok) {
    // Never leave an object that no row points at.
    await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${storagePath}`, { method: "DELETE", headers: H });
    console.log(`         ! row ${prior ? "patch" : "insert"} failed ${row.status}: ${(await row.text()).slice(0, 200)}`);
    failed++;
    continue;
  }
  if (prior) replaced++;
  else added++;
}

console.log(`\nadded ${added}, replaced ${replaced}, skipped ${skipped}, failed ${failed}`);
if (!APPLY) console.log("Nothing uploaded. Re-run with --apply.");
if (failed) process.exit(1);
