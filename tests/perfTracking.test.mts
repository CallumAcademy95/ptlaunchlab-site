// tests/perfTracking.test.mts
// Source guards for the home-page performance work (GA after load, Clarity
// after consent, fonts). These read app/layout.tsx as text: they pin the
// ordering and gating that a refactor could silently undo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("Consent Mode v2 default stays inline, synchronous and before every tag", () => {
  const consent = layout.indexOf("gtag('consent','default'");
  assert.ok(consent > 0, "consent default present");
  // The exact defaults, unchanged.
  assert.match(
    layout,
    /gtag\('consent','default',\{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:2000\}\);/,
  );
  // It is a plain inline <script>, not next/script (which would defer it).
  const before = layout.slice(0, consent);
  const tagStart = before.lastIndexOf("<");
  assert.match(before.slice(tagStart), /^<script dangerouslySetInnerHTML/);
  // ...and it comes before CookieYes, GA, Clarity and the Pixel.
  for (const marker of ["cdn-cookieyes.com", "gtag/js?id=G-90W2KGSL55", "clarity.ms/tag", "fbevents.js"]) {
    const at = layout.indexOf(marker);
    assert.ok(at > consent, `${marker} after the consent default`);
  }
});

test("CookieYes still loads early (afterInteractive)", () => {
  assert.match(layout, /id="cookieyes"[\s\S]{0,200}strategy="afterInteractive"/);
});

test("gtag.js is not afterInteractive: it is injected after window load + idle", () => {
  assert.doesNotMatch(layout, /<Script[^>]*gtag\/js[^>]*strategy="afterInteractive"/);
  assert.doesNotMatch(layout, /<Script[^>]*src="https:\/\/www\.googletagmanager\.com/);
  const loader = layout.slice(layout.indexOf("function loadGa"), layout.indexOf("function loadGa") + 1200);
  assert.match(loader, /gtag\/js\?id=G-90W2KGSL55/, "gtag.js only inside loadGa");
  assert.equal((layout.match(/gtag\/js\?id=/g) ?? []).length, 1, "one gtag.js loader");
  assert.match(layout, /addEventListener\('load',whenIdle/);
  assert.match(layout, /requestIdleCallback\(loadGa/);
  assert.match(layout, /setTimeout\(loadGa,2000\)/);
});

test("GA js/config are queued before any event can be pushed (gtag.js drops events queued ahead of config)", () => {
  const config = layout.indexOf("g('config','G-90W2KGSL55'");
  assert.ok(config > 0);
  assert.ok(config < layout.indexOf("function loadGa"), "config is pushed at parse time, not inside the deferred loader");
  assert.match(layout, /g\('js',new Date\(\)\);\s*g\('config','G-90W2KGSL55',\{anonymize_ip:true\}\);/);
});

test("Clarity loads only through the analytics consent gate", () => {
  assert.equal((layout.match(/clarity\.ms\/tag\//g) ?? []).length, 1, "one Clarity loader");
  const gate = layout.indexOf("window.__ptllLoadClarity=function");
  assert.ok(gate > 0);
  const inject = layout.indexOf("function inject()");
  assert.ok(inject > 0 && layout.indexOf("clarity.ms/tag/") > inject, "the loader snippet sits inside inject()");
  const block = layout.slice(layout.indexOf('id="microsoft-clarity"'), layout.indexOf("5. Meta Pixel"));
  assert.match(block, /c\.categories&&c\.categories\.analytics===true/);
  assert.match(block, /c\.accepted\.indexOf\('analytics'\)>-1/);
  assert.match(block, /cookieyes_consent_update/);
  assert.match(block, /cookieyes_banner_load/);
  assert.match(block, /getCkyConsent/);
  assert.doesNotMatch(block, /advertisement/, "Clarity is gated on analytics, not advertisement");
  // inject() is only ever called from the gate.
  assert.equal((block.match(/\binject\b/g) ?? []).length, 3, "declared once, used twice, both inside __ptllLoadClarity");
  assert.ok(block.lastIndexOf("inject") < block.indexOf("cookieyes_consent_update"), "never called outside the gate");
  assert.doesNotMatch(layout, /strategy="lazyOnload">\{`\s*\(function\(c,l,a,r,i,t,y\)/, "no ungated Clarity snippet");
});

test("Meta Pixel consent gate is unchanged", () => {
  const block = layout.slice(layout.indexOf('<Script id="meta-pixel"'), layout.indexOf("</body>"));
  assert.match(block, /strategy="afterInteractive"/);
  assert.match(block, /var noop=function\(\)\{\}; noop\.__ptllNoop=true;/);
  assert.match(block, /c\.categories&&c\.categories\.advertisement===true/);
  assert.match(block, /c\.accepted\.indexOf\('advertisement'\)>-1/);
  assert.match(block, /fbq\('init','1133525198707842'\);/);
  assert.match(block, /if\(window\.__ptllPvPending\)\{ window\.__ptllPvPending=false; fbq\('track','PageView'\); \}/);
  assert.match(block, /cookieyes_consent_update/);
  assert.match(block, /cookieyes_banner_load/);
  assert.equal((layout.match(/fbevents\.js/g) ?? []).length, 1);
});

test("next/font weights are limited to the ones that render", () => {
  const weights = (name: string) => {
    const m = layout.match(new RegExp(`${name}\\(\\{[\\s\\S]*?weight:\\s*\\[([^\\]]*)\\]`));
    assert.ok(m, `${name} call found`);
    return m[1].split(",").map((w) => w.trim().replace(/"/g, ""));
  };
  assert.deepEqual(weights("Poppins"), ["400", "500", "600", "700"]);
  assert.deepEqual(weights("Barlow_Condensed"), ["600", "700", "800"]);
  assert.equal((layout.match(/next\/font\/google/g) ?? []).length, 1);
});

