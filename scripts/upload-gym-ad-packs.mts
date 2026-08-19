// scripts/upload-gym-ad-packs.mts
/**
 * Put each gym's Meta ad pack into their resource drive.
 *
 *   npx tsx scripts/upload-gym-ad-packs.mts               # dry run
 *   npx tsx scripts/upload-gym-ad-packs.mts --apply        # upload
 *   npx tsx scripts/upload-gym-ad-packs.mts --apply --replace
 *                                                           # let a reissued
 *      graphic overwrite the resource of the same title, instead of being
 *      skipped as already present.
 *
 * Idempotent on (partner, title) — the same rule import-partner-assets.mts
 * uses, `--replace` included: without the flag a title that already exists is
 * skipped, which is what makes routine re-runs safe. With it, the file on
 * disk wins: the object is re-uploaded (`x-upsert: true`, same path either
 * way) and the existing row is PATCHed rather than a duplicate being
 * inserted, so its `id` survives — `/partners/download/[id]` links keep
 * resolving. A graphic that gets re-rendered (a copy fix, a swapped photo, a
 * new logo) does NOT reach a partner's portal on a plain re-run; only
 * `--replace` pushes it live.
 *
 * `--replace` only ever PATCHes a row that (a) is in the `digital` category —
 * the lookup is fetched with `category=eq.digital`, so a legal, training,
 * print or learner resource (a signed agreement, a handbook) can never enter
 * the map at all — and (b) whose existing `storage_path` already starts with
 * `${slug}/meta-ads/`, checked immediately before the PATCH. A title match
 * that fails that second check is a genuine collision, not a re-render of
 * something this script made: it is left untouched and printed as a loud
 * warning naming the partner, the title and the unexpected `storage_path`,
 * because that is a situation for a human to look at, not one the script
 * should resolve on its own. The `title` half of the lookup key is always
 * the literal `Meta ad — <label> (<shape>)` string built a few lines down —
 * this script has no code path that looks up an arbitrary title — but title
 * strings are just text a migration or a hand-edit could duplicate, so the
 * category filter and the storage_path check are what actually keep this
 * safe, not the title namespace happening to stay clean.
 *
 * On a failed *insert* the just-uploaded object is deleted — nothing would
 * ever reference it otherwise. A failed *replace* does NOT delete the
 * object: the storage path for a given (slug, concept, size) is always the
 * same regardless of insert vs. replace, so the pre-existing row already
 * pointed at it before this run and still does after a failed PATCH — the
 * object just carries updated bytes. Deleting it there would turn a partial
 * metadata failure into the exact "row pointing at a missing object" failure
 * this script exists to avoid.
 *
 * Residual, left deliberately unhandled: if a replace's storage PUT succeeds
 * and the PATCH then fails, the object now carries the new bytes while the
 * row still reports the old `file_size` and `mime` — until a retry succeeds,
 * the row is a few fields stale rather than wrong. There is no cleanup for
 * this that doesn't risk stranding a still-live row, so it's documented
 * rather than fixed here; a thrown error and a re-run resolve it.
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
// Without this, a title that already exists is skipped — which is what makes
// re-running safe. With it, the file on disk wins and the existing row is
// PATCHed to point at it. Needed whenever artwork is reissued rather than added.
const REPLACE = process.argv.includes("--replace");
const BUCKET = "partner-resources";
const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const { CONCEPTS, SIZES } = await import("./lib/ad-concepts.mjs");
const OUT_ROOT = path.join(process.cwd(), "ad-assets", "gym-ads");

const GYM_SLUGS = Object.keys(BRANDS).filter((s) => s !== "demo");

const partnersRes = await fetch(`${URL_BASE}/rest/v1/pp_partners?select=id,slug`, { headers: H });
const partners: { id: string; slug: string }[] = await partnersRes.json();
const bySlug = new Map(partners.map((p) => [p.slug, p.id]));

// category=eq.digital: a non-digital resource (a signed agreement, a
// handbook — legal/training/print/learner) can never even enter this map,
// let alone be matched for a PATCH below.
const existingRes = await fetch(
  `${URL_BASE}/rest/v1/pp_resources?select=id,partner_id,title,storage_path&category=eq.digital`,
  { headers: H }
);
const existing: { id: string; partner_id: string | null; title: string; storage_path: string | null }[] =
  await existingRes.json();
const already = new Map(existing.map((r) => [`${r.partner_id}::${r.title}`, r]));

let uploaded = 0;
let replaced = 0;
let skipped = 0;

for (const slug of GYM_SLUGS) {
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
      const prior = already.get(`${partnerId}::${title}`);

      if (prior && !REPLACE) {
        skipped++;
        continue;
      }

      const objectPath = `${slug}/meta-ads/${file}`;

      // A title collision that isn't one of our own resources: something in
      // `digital` matched this exact (partner, title) but its object doesn't
      // live under this gym's meta-ads/ prefix, so it wasn't created by this
      // script. Never patch it — surface it and move on.
      if (prior && REPLACE && !prior.storage_path?.startsWith(`${slug}/meta-ads/`)) {
        console.warn(
          `!! COLLISION  ${slug.padEnd(16)} "${title}" already exists (id ${prior.id}, storage_path "${prior.storage_path}") ` +
            `but that path isn't under ${slug}/meta-ads/ — left untouched, not patched. Needs a human to look at it.`
        );
        skipped++;
        continue;
      }

      const verb = prior ? (APPLY ? "REPLACE" : "would replace") : APPLY ? "UPLOAD" : "would upload";
      console.log(`${verb.padEnd(13)} ${slug.padEnd(16)} ${title}`);

      // Counted here, not after the network calls below, so a dry run's
      // summary line reports what it printed rather than a stale zero.
      if (prior) replaced++;
      else uploaded++;

      if (!APPLY) continue;

      const body = readFileSync(abs);
      const put = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
        method: "POST",
        headers: { ...H, "Content-Type": "image/png", "x-upsert": "true" },
        body,
      });
      if (!put.ok) throw new Error(`${slug} ${file}: storage ${put.status} ${await put.text()}`);

      const row = prior
        ? await fetch(`${URL_BASE}/rest/v1/pp_resources?id=eq.${prior.id}`, {
            method: "PATCH",
            headers: { ...H, "Content-Type": "application/json" },
            body: JSON.stringify({
              storage_path: objectPath,
              mime: "image/png",
              file_size: body.length,
              description: `${w}×${h}. Ad copy is in your Playbook under "Meta ads — your ad pack".`,
            }),
          })
        : await fetch(`${URL_BASE}/rest/v1/pp_resources`, {
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
      if (!row.ok) {
        // Only a fresh insert can strand an object nothing points at — a
        // replace's storage_path is unchanged whether the PATCH succeeds or
        // not, so the pre-existing row still resolves to it. See the note at
        // the top of this file.
        if (!prior) {
          await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${objectPath}`, { method: "DELETE", headers: H });
        }
        throw new Error(`${slug} ${file}: pp_resources ${row.status} ${await row.text()}`);
      }
    }
  }
}

console.log(
  `\n${APPLY ? "uploaded" : "would upload"} ${uploaded}, ${APPLY ? "replaced" : "would replace"} ${replaced}, skipped ${skipped} already present`
);
