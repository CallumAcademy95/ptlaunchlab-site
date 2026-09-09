import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { BASE_URL } from "./helpers";

// ════════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS
//
// The partner embed only exists if a gym's own website can actually frame it.
// Every other route on the site must stay unframable.
//
// Asserting on the header STRING is not enough and is covered elsewhere
// (tests/embedHeaders.test.mts). A header can be present, spelled correctly,
// and still rejected by the browser — X-Frame-Options creeping back onto the
// route is exactly that failure: every header looks right, and the card is
// blank on every partner site. So this drives a real cross-origin iframe and
// asks the browser what happened.
//
// The harness below is served from its own origin (a different port), which
// is what makes the iframe cross-origin — the same situation as Wix.
// ════════════════════════════════════════════════════════════════════════════

const HARNESS_PORT = 3201;
const HARNESS = `http://127.0.0.1:${HARNESS_PORT}`;
const GYM = "ebor-fitness";

let server: Server;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const target = new URL(req.url ?? "/", HARNESS).searchParams.get("src") ?? "";
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      `<!doctype html><meta charset="utf-8"><title>partner site</title>
       <iframe id="f" src="${target}" width="100%" height="220" style="border:0"></iframe>`,
    );
  });
  await new Promise<void>((r) => server.listen(HARNESS_PORT, "127.0.0.1", r));
});

test.afterAll(async () => {
  await new Promise((r) => server.close(r));
});

/** Load the harness framing `src` and report what the browser did with it. */
async function frame(page: import("@playwright/test").Page, src: string) {
  const refusals: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/frame-ancestors|X-Frame-Options|Refused to (display|frame)/i.test(t)) refusals.push(t);
  });
  await page.goto(`${HARNESS}/?src=${encodeURIComponent(src)}`);
  await page.waitForTimeout(1500);

  const frameEl = page.frames().find((f) => f.url().startsWith(src.split("?")[0]));
  let bodyText = "";
  if (frameEl) {
    try {
      bodyText = (await frameEl.locator("body").innerText({ timeout: 2000 })).trim();
    } catch {
      bodyText = "";
    }
  }
  return { refusals, loaded: Boolean(frameEl && bodyText), bodyText };
}

test("a partner site CAN frame the embed card, and it renders its content", async ({ page }) => {
  const r = await frame(page, `${BASE_URL}/embed/${GYM}`);

  expect(r.refusals, `browser refused to frame the embed: ${r.refusals.join(" | ")}`).toEqual([]);
  expect(r.loaded, "the embed iframe rendered no content").toBe(true);
  // The three things the card exists to say.
  expect(r.bodyText).toContain("Ebor Fitness PT Academy");
  expect(r.bodyText).toMatch(/Qualified Personal Trainer/i);
  expect(r.bodyText).toContain("Find out more");
});

test("the same partner site CANNOT frame the full landing page", async ({ page }) => {
  const r = await frame(page, `${BASE_URL}/${GYM}`);

  expect(r.loaded, "the full landing page rendered inside a cross-origin iframe — frame-ancestors 'none' is not holding").toBe(false);
  expect(
    r.refusals.length,
    "no CSP refusal was reported for the full landing page — it may have been allowed",
  ).toBeGreaterThan(0);
});

test("the embed CTA points at the partner page and carries its attribution", async ({ page }) => {
  await page.goto(`${BASE_URL}/embed/${GYM}`);
  const href = await page.locator("a.cta").getAttribute("href");

  expect(href).toBeTruthy();
  const url = new URL(href!);
  expect(url.pathname).toBe(`/${GYM}`);
  expect(url.searchParams.get("utm_source")).toBe("partner-embed");
  expect(url.searchParams.get("utm_campaign")).toBe(GYM);
  // Must open top-level, or the partner page loads inside the 220px frame.
  expect(await page.locator("a.cta").getAttribute("target")).toBe("_blank");
  expect(await page.locator("a.cta").getAttribute("rel")).toContain("noopener");
});

test("the card ships no script and sets no cookie", async ({ page }) => {
  const res = await page.goto(`${BASE_URL}/embed/${GYM}`);
  const html = await res!.text();

  expect(html, "a <script> reached the embed card").not.toMatch(/<script/i);
  expect(res!.headers()["set-cookie"], "the embed card set a cookie").toBeUndefined();
  expect(await page.context().cookies()).toEqual([]);
});

test("an unknown gym 404s rather than rendering an empty card", async ({ page }) => {
  const res = await page.goto(`${BASE_URL}/embed/not-a-real-gym`);
  expect(res!.status()).toBe(404);
});
