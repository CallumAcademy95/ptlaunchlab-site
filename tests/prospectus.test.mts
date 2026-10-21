// tests/prospectus.test.mts
//
// WHAT THIS PROTECTS
//
// public/prospectus.pdf is opened after every prospectus form. The March 2026
// version drifted into stale prices (£1,399 / £599 deposit), Payl8r finance,
// "17 verified reviews", REPs, a "guaranteed gym interview", Skool, the Merve
// app and earnings claims. The new one is generated from site data by
// scripts/build-learner-prospectus.mts. These tests hold it to the truth rules
// in docs/superpowers/specs/2026-10-13-ptlaunchlab-prospectus-design.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { buildProspectusHtml } from "../scripts/build-learner-prospectus.mts";
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PAYMENTS, MONTHLY_PLAN_TOTAL_PENCE, formatPence } from "../app/lib/pricing.ts";
import { reviews } from "../app/lib/reviewsData.ts";
import { GRADUATES } from "../app/lib/graduates.ts";
import { ADDRESS_ONE_LINE, PHONE_NATIONAL, CONTACT_EMAIL } from "../app/lib/contactDetails.ts";
import { COURSE_CREDENTIAL } from "../app/lib/localPages.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const html = buildProspectusHtml();

const unescape = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
// Visible text only: drop <style>, tags and entities, collapse whitespace.
const text = unescape(
  html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " "),
).replace(/\s+/g, " ");

/** The banned list. Also run against `pdftotext public/prospectus.pdf` by hand. */
const BANNED: [RegExp, string][] = [
  [/klarna/i, "Klarna"],
  [/payl8r/i, "Payl8r"],
  [/interest[- ]free/i, "interest-free"],
  [/no interest/i, "no interest"],
  [/pay in 3/i, "pay in 3"],
  [/£1,599/, "£1,599"],
  [/£1,399/, "£1,399"],
  [/£599/, "£599"],
  [/skool/i, "Skool"],
  [/community/i, "community (truth rule: never promise one)"],
  [/\bREPs\b/, "REPs"],
  [/merve/i, "Merve"],
  [/google classroom/i, "Google Classroom"],
  [/verified reviews?/i, "verified reviews"],
  [/guaranteed (gym )?interview/i, "guaranteed gym interview"],
  [/interview guaranteed/i, "interview guaranteed"],
  [/guaranteed (a )?job/i, "guaranteed job"],
  [/£3K/i, "£3K"],
  [/£5K/i, "£5K"],
  [/per month as/i, "earnings claim"],
  [/workshop/i, "workshop"],
  [/25\s*[–-]\s*35/, "25–35"],
  [/\baged\b/i, "age band"],
];

test("contains the price, payment line, platform, mentorship label, rating and credential", () => {
  for (const must of [
    COURSE_PRICE_LABEL,
    "Flexible ways to pay at checkout",
    "Praxel",
    "The Mentorship Hub",
    "5.0",
    COURSE_CREDENTIAL,
  ]) {
    assert.ok(text.includes(must), `missing: ${must}`);
  }
});

test("the monthly option is stated exactly as pricing.ts has it", () => {
  assert.ok(text.includes(`${MONTHLY_PAYMENTS} × ${MONTHLY_PRICE_LABEL}`));
  assert.ok(text.includes(formatPence(MONTHLY_PLAN_TOTAL_PENCE)));
});

test("NAP comes from contactDetails.ts", () => {
  for (const s of [ADDRESS_ONE_LINE, PHONE_NATIONAL, CONTACT_EMAIL, "ptlaunchlab.co.uk"]) {
    assert.ok(text.includes(s), `missing: ${s}`);
  }
});

test("both actions are clickable links", () => {
  assert.match(html, /<a [^>]*href="https:\/\/ptlaunchlab\.co\.uk\/enrol[^"]*"/);
  assert.match(html, /<a [^>]*href="https:\/\/ptlaunchlab\.co\.uk\/book-call[^"]*"/);
});

test("none of the banned claims appear", () => {
  const hits = BANNED.filter(([re]) => re.test(text)).map(([, label]) => label);
  assert.deepEqual(hits, []);
});

test('"in person" appears only when negated', () => {
  const bad = [...text.matchAll(/\bin[- ]person\b/gi)].filter((m) => {
    const before = text.slice(Math.max(0, m.index! - 12), m.index!).toLowerCase();
    return !/\b(no|not)\s+$/.test(before);
  });
  assert.equal(bad.length, 0, bad.map((m) => text.slice(m.index! - 30, m.index! + 30)).join(" | "));
});

test("there are four review quotes and every one is verbatim from reviewsData.ts", () => {
  const quotes = [...html.matchAll(/<blockquote class="review"[^>]*>([\s\S]*?)<\/blockquote>/g)].map((m) =>
    unescape(m[1].replace(/<[^>]+>/g, "")).trim(),
  );
  assert.equal(quotes.length, 4);
  const all = new Set(reviews.map((r) => r.quote));
  for (const q of quotes) assert.ok(all.has(q), `not verbatim from reviewsData: ${q.slice(0, 60)}`);
});

test("Gemma's story is taken verbatim from graduates.ts", () => {
  const gemma = GRADUATES.find((g) => g.id === "gemma")!;
  assert.ok(text.includes(gemma.quote));
});

test("no review count is shown next to the rating", () => {
  assert.doesNotMatch(text, /\d+\s+(google\s+)?reviews/i);
});

test("public/prospectus.html is the current generator output", () => {
  const onDisk = readFileSync(join(ROOT, "public/prospectus.html"), "utf8").replace(/\r\n/g, "\n");
  assert.equal(onDisk, html.replace(/\r\n/g, "\n"), "re-run: npx tsx scripts/build-learner-prospectus.mts --pdf");
});

test("public/prospectus.pdf exists and is under 1.5 MB", () => {
  const pdf = join(ROOT, "public/prospectus.pdf");
  assert.ok(existsSync(pdf));
  assert.ok(statSync(pdf).size < 1.5 * 1024 * 1024, `${statSync(pdf).size} bytes`);
});
