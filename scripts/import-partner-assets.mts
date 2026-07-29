/**
 * Import the Partner Assets folder into the resource drive.
 *
 *   npx tsx scripts/import-partner-assets.mts
 *   ...add --apply to upload.
 *
 * Everything lands in the private `partner-resources` bucket and is scoped to
 * the gym whose folder it came from, so a partner only ever sees their own
 * artwork and their own agreement. Files at the root are shared with everyone.
 *
 * Idempotent on (partner, title): re-running skips anything already there, so
 * adding one new poster to a folder doesn't re-upload thirty files.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");
const ROOT = path.join(process.cwd(), "Partner Assets");
const BUCKET = "partner-resources";
const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

/** Folder name on disk → pp_partners.slug. */
const FOLDER_TO_SLUG: Record<string, string> = {
  "ebor": "ebor",
  "gym n go": "gym-n-go",
  "iron wolf": "ironwolf",
  "ministry of fitness": "mof",
  "musclebound": "muscle-bound",
  "superflex": "superflex",
  "xcelerate": "xcelerate",
};

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Categorise and retitle from the filename.
 *
 * Titles drop the gym's own name — the partner is already inside their own
 * portal, so "Ebor Fitness PT Academy — Lead Handout" just reads as noise.
 */
function classify(file: string): { category: string; title: string; description: string | null } {
  const lower = file.toLowerCase();

  if (lower.includes("partnership-agreement")) {
    return {
      category: "legal",
      title: "Your signed partnership agreement",
      description: "The agreement between us, as signed. Keep a copy for your records.",
    };
  }
  if (lower.includes("handbook")) {
    return {
      category: "training",
      title: "Gym partner handbook",
      description: "How the partnership works, start to finish.",
    };
  }
  if (lower.includes("lead handout") || lower.includes("become a qualified")) {
    return {
      category: "learner",
      title: "Member handout",
      description: "Print this for anyone who asks. Covers what the course is and how it works.",
    };
  }
  if (lower.includes("poster")) {
    return {
      category: "print",
      title: lower.includes("insta") ? "Promo graphic — Instagram" : "Academy poster",
      description: lower.includes("insta")
        ? "Sized for an Instagram feed post."
        : "Print at A3 for the front desk or the changing room wall.",
    };
  }
  if (/£|promo|off/.test(lower)) {
    const label = path.basename(file, path.extname(file)).replace(/\s*\(\d+\)\s*$/, "").trim();
    return {
      category: "digital",
      title: `Promo graphic — ${label}`,
      description: "For social and your gym screens. Check the offer is still live before posting.",
    };
  }
  if (lower.endsWith(".docx")) {
    return {
      category: "training",
      title: path.basename(file, ".docx").replace(/[-_]+/g, " ").trim(),
      description: "Campaign copy written for your gym.",
    };
  }
  // Canva and ChatGPT default filenames tell a partner nothing. Give them a
  // usable title rather than shipping "Untitled design" into their portal.
  if (/^untitled|^chatgpt image|^image \d|^screenshot/i.test(file)) {
    return {
      category: "digital",
      title: "Academy graphic",
      description: "For social and your gym screens.",
    };
  }

  return {
    category: "digital",
    title: path.basename(file, path.extname(file)).replace(/[-_]+/g, " ").trim(),
    description: null,
  };
}

interface Item {
  absPath: string;
  file: string;
  slug: string | null;
  category: string;
  title: string;
  description: string | null;
  size: number;
}

function walk(dir: string, slug: string | null, out: Item[]) {
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) {
      // Nested folders inherit the gym above them (superflex/SUPERFLEX/…).
      walk(abs, slug ?? FOLDER_TO_SLUG[name.toLowerCase()] ?? null, out);
      continue;
    }
    if (name.startsWith("~$")) continue; // Word lock file
    const c = classify(name);
    out.push({ absPath: abs, file: name, slug, ...c, size: statSync(abs).size });
  }
}

const items: Item[] = [];
for (const name of readdirSync(ROOT)) {
  const abs = path.join(ROOT, name);
  if (statSync(abs).isDirectory()) walk(abs, FOLDER_TO_SLUG[name.toLowerCase()] ?? null, items);
  else if (!name.startsWith("~$")) items.push({ absPath: abs, file: name, slug: null, ...classify(name), size: statSync(abs).size });
}

// The handbook sits in several gym folders and at the root. Keep the shared
// copy only — a partner seeing it twice looks like a mistake.
const seenHandbook = new Set<string>();
const filtered = items.filter((i) => {
  if (i.title !== "Gym partner handbook") return true;
  if (i.slug === null) return true;
  if (seenHandbook.has("shared")) return false;
  return false;
});
const hasSharedHandbook = filtered.some((i) => i.title === "Gym partner handbook" && i.slug === null);
if (!hasSharedHandbook) console.warn("!  no root-level handbook found — per-gym copies were dropped");

const partners: { id: string; slug: string; gym_name: string }[] = await (
  await fetch(`${URL_BASE}/rest/v1/pp_partners?select=id,slug,gym_name`, { headers: H })
).json();
const bySlug = new Map(partners.map((p) => [p.slug, p]));

const existing: { partner_id: string | null; title: string }[] = await (
  await fetch(`${URL_BASE}/rest/v1/pp_resources?select=partner_id,title`, { headers: H })
).json();
const already = new Set(existing.map((e) => `${e.partner_id ?? "shared"}|${e.title}`));

console.log(`${APPLY ? "UPLOADING" : "DRY RUN"} — ${filtered.length} file(s)\n`);

let done = 0, skipped = 0, failed = 0;
for (const item of filtered.sort((a, b) => (a.slug ?? "").localeCompare(b.slug ?? "") || a.category.localeCompare(b.category))) {
  const partner = item.slug ? bySlug.get(item.slug) : null;
  if (item.slug && !partner) {
    console.log(`  [SKIP] no partner "${item.slug}" — ${item.file}`);
    skipped++;
    continue;
  }

  const key = `${partner?.id ?? "shared"}|${item.title}`;
  if (already.has(key)) {
    console.log(`  [have] ${(partner?.slug ?? "shared").padEnd(13)} ${item.category.padEnd(9)} ${item.title}`);
    skipped++;
    continue;
  }

  console.log(`  ${APPLY ? "[add] " : "[dry] "} ${(partner?.slug ?? "shared").padEnd(13)} ${item.category.padEnd(9)} ${item.title.slice(0, 44).padEnd(46)} ${(item.size / 1024).toFixed(0)}KB`);
  if (!APPLY) continue;

  const ext = path.extname(item.file).toLowerCase();
  const safe = path.basename(item.file, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const storagePath = `${partner ? `partners/${partner.id}` : "shared"}/${Date.now().toString(36)}-${safe}${ext}`;

  const up = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: { ...H, "Content-Type": MIME[ext] ?? "application/octet-stream" },
    body: new Uint8Array(readFileSync(item.absPath)),
  });
  if (!up.ok) {
    console.log(`         ! upload failed ${up.status}: ${(await up.text()).slice(0, 120)}`);
    failed++;
    continue;
  }

  const ins = await fetch(`${URL_BASE}/rest/v1/pp_resources`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_id: partner?.id ?? null,
      category: item.category,
      title: item.title,
      description: item.description,
      storage_path: storagePath,
      mime: MIME[ext] ?? null,
      file_size: item.size,
    }),
  });
  if (!ins.ok) {
    // Don't leave an object nothing lists — it would never be found again.
    await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${storagePath}`, { method: "DELETE", headers: H });
    console.log(`         ! insert failed ${ins.status}: ${(await ins.text()).slice(0, 120)}`);
    failed++;
    continue;
  }
  done++;
}

console.log(`\nadded ${done}, already there ${skipped}, failed ${failed}`);
if (!APPLY) console.log("Nothing uploaded. Re-run with --apply.");
