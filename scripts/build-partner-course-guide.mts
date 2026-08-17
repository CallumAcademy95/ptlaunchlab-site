/**
 * Renders the partner course guide to PDF.
 *
 *   npx tsx scripts/build-partner-course-guide.mts
 *
 * The missing-asset check is the point of doing this in code: a broken <img>
 * renders as blank white in a PDF, and blank white in a document sent to nine
 * gyms is indistinguishable from a design decision.
 */
import { chromium } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DIR = path.join(process.cwd(), "docs", "partner-guide");
const HTML = path.join(DIR, "course-guide.html");
const PDF = path.join(DIR, "partner-course-guide.pdf");

const html = readFileSync(HTML, "utf8");
const missing = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((src) => !src.startsWith("data:") && !existsSync(path.join(DIR, src)));
if (missing.length) {
  console.error("Missing assets:\n  " + missing.join("\n  "));
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle" });
await page.pdf({ path: PDF, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`✓ ${PDF}`);
