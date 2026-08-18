/**
 * Shelve the partner course guide in every partner's Resource Drive.
 *
 *   npx tsx scripts/upload-partner-course-guide.mts            # dry run, writes nothing
 *   npx tsx scripts/upload-partner-course-guide.mts --apply
 *
 * One shared row (`partner_id = null`), so all nine gyms see the same file and a
 * tenth partner gets it the day they're created. The PDF is built by
 * scripts/build-partner-course-guide.mts and committed — this script only moves
 * the built artefact, it never regenerates it.
 *
 * Idempotent: re-running replaces the object and updates the existing row rather
 * than shelving a second copy of the same guide.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}` };
const BUCKET = "partner-resources";
const STORAGE_PATH = "shared/partner-course-guide-v1.pdf";

const PDF = path.join(ROOT, "docs", "partner-guide", "partner-course-guide.pdf");
if (!existsSync(PDF)) {
  console.error(`Not found: ${PDF}\nBuild it first: npx tsx scripts/build-partner-course-guide.mts`);
  process.exit(1);
}
const data = readFileSync(PDF);

const row = {
  partner_id: null,
  category: "delivery",
  title: "Your learner's course, explained",
  description:
    "How Praxel works, what your learner does, what the course covers, and what the practicals need from your gym.",
  storage_path: STORAGE_PATH,
  mime: "application/pdf",
  file_size: data.length,
  version: "v1.0",
  sort_order: 1,
};

const existing: { id: string }[] = await (
  await fetch(
    `${U}/rest/v1/pp_resources?storage_path=eq.${encodeURIComponent(STORAGE_PATH)}&select=id`,
    { headers: H }
  )
).json();

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${(data.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`  bucket   ${BUCKET}/${STORAGE_PATH}`);
console.log(`  category ${row.category}  ·  version ${row.version}  ·  partner_id null (all partners)`);
console.log(`  title    ${row.title}`);
console.log(existing.length ? `  existing row ${existing[0].id} — will UPDATE` : "  no existing row — will INSERT");

if (!APPLY) {
  console.log("\nNothing written. Add --apply.");
  process.exit(0);
}

const up = await fetch(`${U}/storage/v1/object/${BUCKET}/${STORAGE_PATH}`, {
  method: "POST",
  headers: { ...H, "Content-Type": "application/pdf", "x-upsert": "true" },
  body: new Uint8Array(data),
});
if (!up.ok) {
  console.error(`\nUpload failed — ${up.status} ${await up.text()}`);
  process.exit(1);
}
console.log("\n  uploaded");

const res = existing.length
  ? await fetch(`${U}/rest/v1/pp_resources?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row),
    })
  : await fetch(`${U}/rest/v1/pp_resources`, {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row),
    });

if (!res.ok) {
  console.error(`  row write FAILED — ${res.status} ${await res.text()}`);
  process.exit(1);
}
const [saved] = await res.json();
console.log(`  row ${existing.length ? "updated" : "inserted"} ${saved.id}`);
