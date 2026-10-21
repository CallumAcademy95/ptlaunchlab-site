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

test("BookingFlow exposes onBooked and calls it after a successful booking", () => {
  const b = src("app/book/BookingFlow.tsx");
  assert.match(b, /onBooked\?: \(r: \{ label: string \}\) => void/);
  assert.match(b, /setDone\(\{ label: r\.label, phone: r\.phone, manageUrl: r\.manageUrl \}\); onBooked\?\.\(\{ label: r\.label \}\);/);
});

test("result page renders NextStep in place of the old plan buttons, and keeps nextToken", () => {
  const c = src("app/career-planner/CareerPlanner.tsx");
  assert.match(c, /<NextStep /);
  assert.doesNotMatch(c, /plan\.buttons\.map/);
  assert.match(c, /setNextToken\(j\.nextToken \?\? null\)/);
});

test("NextStep wiring: commitment card gated by band, inline booking, WhatsApp link, enrol link, records each step", () => {
  const n = src("app/career-planner/NextStep.tsx");
  assert.match(n, /showCommitmentCard\(plan\.band\)/);
  assert.match(n, /<BookingFlow[^>]*callType="consultation"[^>]*onBooked=/);
  assert.match(n, /whatsappHref\(WHATSAPP_LINK, /);
  assert.match(n, /href="\/enrol"/);
  assert.match(n, /\/api\/career-planner\/next-step/);
  assert.match(n, /keepalive: true/);
  assert.match(n, /CALL_TYPES\.consultation\.minutes/);
});

test("NextStep copy rules: prices from pricing.ts, no £500, no 'free', no urgency, no earnings", () => {
  const n = src("app/career-planner/NextStep.tsx");
  assert.match(n, /COURSE_PRICE_LABEL/);
  assert.match(n, /MONTHLY_PLAN_LABEL/);
  assert.doesNotMatch(n, /£\d/, "no literal prices");
  assert.doesNotMatch(n, /\bfree\b/i);
  assert.doesNotMatch(n, /limited|hurry|ends (soon|today)|only \d+ (places|spots)/i);
  assert.doesNotMatch(n, /£\d+k|earn(ing)?s? up to|\d+% of/i);
  assert.doesNotMatch(n, /15-minute|15 minute/i, "call length comes from CALL_TYPES");
});
