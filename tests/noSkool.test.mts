// tests/noSkool.test.mts
//
// As of 13 Oct 2026 the course no longer includes Skool or any learner
// "community". The £500 Mentorship Hub is still included and keeps its label.
// No page, metadata, JSON-LD or chatbot prompt may promise Skool or a
// "mentorship community".
//
// app/podcast/** and public/gbp/** are excluded: podcast episode titles and
// transcripts are history and stay as recorded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "public"];
const EXCLUDED = ["app/podcast/", "public/gbp/"];
const TEXT_EXT = /\.(ts|tsx|md|txt|json|html|xml)$/i;
const BANNED = [/skool/i, /mentorship community/i];

function walk(dir: string, out: string[]): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).split(sep).join("/");
    if (EXCLUDED.some((p) => rel.startsWith(p) || `${rel}/` === p)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(name)) out.push(full);
  }
  return out;
}

test("no app/public file outside the podcast promises Skool or a mentorship community", () => {
  const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d), []));
  assert.ok(files.length > 50, `expected to scan many files, scanned ${files.length}`);
  const hits: string[] = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const re of BANNED) {
        if (re.test(line)) hits.push(`${relative(ROOT, file)}:${i + 1} ${re} ${line.trim().slice(0, 140)}`);
      }
    });
  }
  assert.deepEqual(hits, [], `Skool/community promises found:\n${hits.join("\n")}`);
});

test("the chatbot prompt does not offer a community as an included benefit", () => {
  const src = readFileSync(join(ROOT, "app/api/chat/route.ts"), "utf8");
  assert.doesNotMatch(src, /skool/i);
  assert.doesNotMatch(src, /community/i);
});
