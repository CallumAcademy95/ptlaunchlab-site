import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const src = (p: string) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

test("next-step route: verifies the token BEFORE any database access, and only updates by that id", () => {
  const r = src("app/api/career-planner/next-step/route.ts");
  const verify = r.indexOf("verifyNextToken(");
  const db = r.indexOf("getSupabaseAdmin(");
  assert.ok(verify > 0 && db > verify, "token checked before the database is touched");
  assert.match(r, /\.from\("leads"\)\.update\(\{ extra \}\)\.eq\("id", leadId\)/);
  assert.doesNotMatch(r, /\.insert\(/, "never creates a lead");
  assert.match(r, /status: 401/);
  assert.match(r, /capiEventFor\(/);
});

test("metaCapi allows the Contact standard event", () => {
  assert.match(src("app/lib/metaCapi.ts"), /\| "Contact"/);
});
