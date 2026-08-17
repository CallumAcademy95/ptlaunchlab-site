/**
 * Screenshots the learner's view of Praxel for the partner course guide.
 *
 *   PRAXEL_DEMO_EMAIL=... PRAXEL_DEMO_PASSWORD=... npx tsx scripts/capture-praxel-screens.mts
 *
 * Credentials come from the environment, never the repo: this signs into the
 * live platform. The account is the labelled demo learner created by
 * albaco-lms/scripts/create-test-learner.mjs --tenant=ptll and seeded by
 * seed-partner-guide-progress.mjs, and it is deleted once the guide is built.
 *
 * Routes are the real ones, confirmed in a browser: the unit list lives at
 * /learn/c/<courseId> — /learn alone redirects to the induction — and a unit at
 * /learn/<unitId>.
 *
 * The demo learner must clear BOTH gates before running this, or /learn/*
 * silently redirects and every shot after that lands on the wrong screen:
 *   1. The six-module welcome induction — seeded by
 *      albaco-lms/scripts/seed-partner-guide-progress.mjs.
 *   2. The course-level "Getting started"/ILP page. There is no seed script
 *      for this one — it currently has to be completed by hand in a browser
 *      before capturing.
 *
 * The two close-ups scroll their subject into view and shoot the viewport
 * rather than an element. Element screenshots need an ancestor selector that
 * happens to be the visual card, and when that guess is wrong it fails
 * silently — a cropped, meaningless PNG that only shows up in the printed PDF.
 */
import { chromium } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";

const HOST = process.env.PRAXEL_HOST ?? "https://ptll.praxel.co.uk";
const EMAIL = process.env.PRAXEL_DEMO_EMAIL;
const PASSWORD = process.env.PRAXEL_DEMO_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set PRAXEL_DEMO_EMAIL and PRAXEL_DEMO_PASSWORD");

/** PTLL course and the two units the guide points at. */
const COURSE = "b1dd9ac1-fe65-4982-946c-3ad374948f91";
const UNIT_IN_PROGRESS = "aa14b7de-3b35-4996-a749-f8c47439c4e4"; // Unit 3 — part-written
const UNIT_WITH_FEEDBACK = "06e60c1f-bc76-4047-b817-f4981b76ab7d"; // Unit 2 — passed, carries feedback

const OUT = path.join(process.cwd(), "docs", "partner-guide", "assets");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// Desktop width at 2x. A screenshot that looks fine on screen prints as mush at
// 150dpi, and this document is mostly screenshots.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await page.goto(`${HOST}/login`);
await page.getByRole("textbox", { name: /email/i }).fill(EMAIL);
await page.getByRole("textbox", { name: /password/i }).fill(PASSWORD);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForURL(/\/(dashboard|learn|welcome|induction)/, { timeout: 30_000 });

/** Dismiss the notifications prompt — it is a banner about the app, not the course. */
async function dismissBanners() {
  const close = page.getByRole("button", { name: /dismiss|close/i }).first();
  if (await close.isVisible().catch(() => false)) await close.click().catch(() => {});
}

/**
 * Praxel redirects /learn/* to the induction (or the course's "Getting
 * started"/ILP page) whenever the demo learner hasn't cleared that gate.
 * Confirm we actually landed on the requested path before shooting —
 * otherwise a redirect produces a screenshot of the wrong screen with no
 * error, and nobody notices until it's in the printed PDF.
 */
function assertLandedOn(name: string, requestedPath: string) {
  const landed = new URL(page.url());
  const expected = new URL(`${HOST}${requestedPath}`);
  if (landed.pathname !== expected.pathname) {
    throw new Error(
      `${name}: expected to land on ${expected.pathname} but landed on ${landed.pathname} ` +
      `instead. This usually means the demo learner hasn't cleared both gates — the ` +
      `six-module welcome induction and the course-level "Getting started"/ILP page. ` +
      `Clear both, then re-run.`,
    );
  }
}

async function shot(name: string, url: string, opts: { fullPage?: boolean } = {}) {
  await page.goto(`${HOST}${url}`);
  await page.waitForLoadState("networkidle");
  assertLandedOn(name, url);
  await dismissBanners();
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: opts.fullPage ?? false });
  console.log(`✓ ${name}.png`);
}

/** Scroll `locator` into view, then shoot the viewport around it. */
async function closeUp(name: string, url: string, locator: (p: typeof page) => ReturnType<typeof page.locator>) {
  await page.goto(`${HOST}${url}`);
  await page.waitForLoadState("networkidle");
  assertLandedOn(name, url);
  await dismissBanners();
  const target = locator(page).first();
  await target.waitFor({ state: "visible", timeout: 15_000 });
  await target.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`✓ ${name}.png`);
}

await shot("dashboard", "/dashboard");
await shot("unit-list", `/learn/c/${COURSE}`, { fullPage: true });
await shot("unit-page", `/learn/${UNIT_IN_PROGRESS}`);
await shot("library", "/library");
await closeUp("workbook-task", `/learn/${UNIT_IN_PROGRESS}`, (p) => p.locator("textarea"));
await closeUp("feedback", `/learn/${UNIT_WITH_FEEDBACK}`, (p) => p.getByText(/feedback/i));

await browser.close();
console.log(`\nAll screenshots written to ${OUT}`);
