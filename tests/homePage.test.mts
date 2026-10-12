import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME_CTA_SOURCES, ENROL_HREF, enrolLabel, CALL_QUESTION, callSuccessMessage } from "../app/lib/homeCta.ts";

test("CTA sources are the agreed set, unique", () => {
  assert.deepEqual([...HOME_CTA_SOURCES], ["home-hero", "home-proof", "home-pain", "home-how", "home-pricing", "home-founders", "home-reviews", "home-partners", "home-final", "home-sticky"]);
  assert.equal(new Set(HOME_CTA_SOURCES).size, HOME_CTA_SOURCES.length);
});

test("enrol goes to /enrol and labels use the live price", () => {
  assert.equal(ENROL_HREF, "/enrol");
  assert.equal(enrolLabel(false), "Enrol now");
  assert.equal(enrolLabel(true), "Enrol £999.99");
});

test("call form question and success copy", () => {
  assert.deepEqual(CALL_QUESTION, { label: "Best time to call? (optional)", options: ["Morning", "Afternoon", "Evening"] });
  assert.equal(callSuccessMessage("Jane"), "Thanks Jane, we'll call you today.");
});

import { readFileSync } from "node:fs";
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("sticky bar: mobile only, observes the hero CTA, broadcasts visibility, hides while the pop-up is open", () => {
  const s = src("app/components/cta/StickyCtaBar.tsx");
  assert.match(s, /md:hidden/);
  assert.match(s, /IntersectionObserver/);
  assert.match(s, /ptll:sticky-cta/);
  assert.match(s, /ptll:call-modal/);
  assert.match(s, /safe-area-inset-bottom/);
  assert.match(s, /home-sticky/);
});

test("chat bubble listens for the sticky bar signal", () => {
  assert.match(src("app/components/Chatbot.tsx"), /ptll:sticky-cta/);
});

test("hero copy is exact and the hero has no geo lookup", () => {
  const h = src("app/components/home/HomeHero.tsx");
  assert.match(h, /Become a qualified Personal Trainer, around your job\./);
  assert.match(h, /NCFE LEVEL 2 &amp; 3 · OFQUAL · CIMSPA|NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA/);
  assert.match(h, /Online NCFE Level 3\. Qualify in 8–16 weeks\. Built by gym owners who(&apos;|')ve hired 500\+ PTs\./);
  assert.match(h, /COURSE_PRICE_LABEL/);
  assert.match(h, /MONTHLY_PRICE_LABEL/);
  assert.match(h, /source="home-hero"/);
  assert.match(h, /priority/);
  assert.doesNotMatch(h, /geoDetect|headers\(\)|HeroSlideshow/);
});

test("price block reads pricing.ts, not hard-coded numbers", () => {
  const p = src("app/components/home/PriceBlock.tsx");
  assert.match(p, /COURSE_PRICE_LABEL/);
  assert.match(p, /MONTHLY_PRICE_LABEL/);
  assert.match(p, /MONTHLY_PLAN_TOTAL_PENCE/);
  assert.doesNotMatch(p, /999\.9|99\.99/);
  assert.match(p, /home-pricing/);
});

test("proof strip reuses existing review and partner data", () => {
  const p = src("app/components/home/ProofStrip.tsx");
  assert.match(p, /from "@\/app\/lib\/reviewsData"/);
  assert.match(p, /from "@\/app\/lib\/gymPartnersData"/);
  assert.doesNotMatch(p, /^["']use client["']/m, "ProofStrip stays a server component");
  assert.match(p, /\/podcast/);
  assert.match(p, /603\/4388\/6/);
  assert.match(p, /home-proof/);
});

test("review and partner data live in plain modules the old components reuse", () => {
  for (const f of ["app/lib/reviewsData.ts", "app/lib/gymPartnersData.ts"]) assert.doesNotMatch(src(f), /^["']use client["']/m);
  assert.match(src("app/components/Reviews.tsx"), /from "@\/app\/lib\/reviewsData"/);
  assert.match(src("app/components/GymPartners.tsx"), /from "@\/app\/lib\/gymPartnersData"/);
  assert.match(src("app/lib/gymPartnersData.ts"), /lightTile: (true|false)/);
});

test("home components render exactly one H1", () => {
  const all = ["HomeHero", "ProofStrip", "PriceBlock"].map((n) => src(`app/components/home/${n}.tsx`)).join("\n");
  assert.equal((all.match(/<h1[\s>]/g) ?? []).length, 1);
});

test("home page: static, new order, CTA in every section, sticky bar, title", () => {
  const p = src("app/page.tsx");
  assert.doesNotMatch(p, /geoDetect|headers\(|cookies\(/);
  assert.match(p, /Online NCFE Level 3 Personal Trainer Course \| PT Launch Lab/);
  const order = ["HomeHero", "ProofStrip", "PainPoints", "HowItWorks", "PriceBlock", "FounderStory", "Reviews", "GymPartners", "Podcast", "FAQ", "FinalCTA"];
  let at = -1;
  for (const c of order) { const i = p.indexOf(`<${c}`); assert.ok(i > at, `${c} out of order or missing`); at = i; }
  for (const gone of ["<Hero ", "<Hero/>", "<HomepageVsl", "<Reframe", "<Accreditation", "<ConversionSection", "<StickyMobileCTA"]) assert.ok(!p.includes(gone), `${gone} still on the page`);
  assert.match(p, /<CallModalProvider/);
  assert.match(p, /<StickyCtaBar/);
  assert.match(p, /faqSchema/);
  assert.match(p, /videoSchema/);
});

test("every home CTA source is used exactly where planned", () => {
  const all = ["app/page.tsx", "app/components/home/HomeHero.tsx", "app/components/home/ProofStrip.tsx", "app/components/home/PriceBlock.tsx", "app/components/cta/StickyCtaBar.tsx"].map(src).join("\n");
  for (const s of ["home-hero", "home-proof", "home-pain", "home-how", "home-pricing", "home-founders", "home-reviews", "home-partners", "home-final", "home-sticky"]) assert.match(all, new RegExp(s), s);
});

test("home page anchors the proof strip links point at", () => {
  const p = src("app/page.tsx");
  assert.match(p, /id="reviews"/);
  assert.match(p, /id="partners"/);
});

test("shared sections take optional props only (other pages unchanged)", () => {
  assert.match(src("app/components/PainPoints.tsx"), /limit\?: number/);
  assert.match(src("app/components/HowItWorks.tsx"), /compact\?: boolean/);
  assert.match(src("app/components/FounderStory.tsx"), /video\?: boolean/);
  assert.match(src("app/components/FinalCTA.tsx"), /source\?: string/);
});

test("videos are click-to-play: poster image first, no player until clicked", () => {
  const c = src("app/components/ClickToPlay.tsx");
  assert.match(c, /from "next\/image"/);
  assert.match(c, /useState\(false\)/);
  // The <video>/<iframe> exist only in the `playing` branch; the idle branch is the poster button.
  const playingAt = c.indexOf("{playing ? (");
  const idleAt = c.search(/\)\s*:\s*\(\s*<button/);
  assert.ok(playingAt > -1 && idleAt > playingAt, "player branch first, poster button in the else branch");
  const player = c.slice(playingAt, idleAt);
  assert.match(player, /<video/);
  assert.match(player, /<iframe/);
  assert.doesNotMatch(c.slice(0, playingAt) + c.slice(idleAt), /<video|<iframe/, "no player outside the playing branch");
  for (const f of ["app/components/FounderStory.tsx", "app/components/VideoTestimonial.tsx"]) {
    const s = src(f);
    assert.match(s, /import ClickToPlay/, f);
    assert.doesNotMatch(s, /<iframe|<video/, `${f} embeds a player on load`);
  }
  assert.match(src("app/components/FounderStory.tsx"), /\/video\/homepage-vsl-poster\.jpg/);
  assert.match(src("app/components/FounderStory.tsx"), /\/video\/homepage-vsl-1080\.mp4/);
});

test("nav offers the two ways to buy: call pop-up and enrol", () => {
  const n = src("app/components/Nav.tsx");
  assert.match(n, /useOptionalCallModal/);
  assert.match(n, /Book a free call/);
  assert.match(n, /Enrol now/);
  assert.match(n, /source: "nav"/);
  assert.doesNotMatch(n, /Discover Your Pathway|Start Today/);
});

test("home VSL keeps the Meta VSLPlay event with the old payload", () => {
  const f = src("app/components/FounderStory.tsx");
  assert.match(f, /metaEvent="VSLPlay"/);
  assert.match(f, /trackAs="homepage_vsl"/);
  const c = src("app/components/ClickToPlay.tsx");
  assert.match(c, /window\.fbq\?\.\("trackCustom", metaEvent, \{ content_name: trackAs \}\)/);
  assert.match(c, /window\.gtag\?\.\("event", "video_play"/);
});

test("call pop-up restores focus even when its opener has unmounted", () => {
  const m = src("app/components/cta/CallModal.tsx");
  assert.match(m, /isConnected/);
  assert.match(m, /Toggle menu/);
});
