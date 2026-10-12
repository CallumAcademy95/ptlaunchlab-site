import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME_CTA_SOURCES, ENROL_HREF, enrolLabel, CALL_QUESTION, callSuccessMessage, CALL_HREF, LEGACY_EVENTS, ctaClickEvents, shouldOpenCallModal } from "../app/lib/homeCta.ts";
import { TYPICAL_COST_LABEL } from "../app/lib/pricing.ts";
import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
  assert.match(s, /isOpen/, "reads the pop-up state from context, so it un-hides in the same commit the dialog closes");
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
  assert.doesNotMatch(h, /MONTHLY_PRICE_LABEL|MONTHLY_PAYMENTS|\/month/, "pay in full is the hero offer; monthly lives behind the click");
  assert.match(h, /everything included/);
  assert.match(h, /Flexible ways to pay at checkout/);
  assert.match(h, /source="home-hero"/);
  assert.match(h, /priority/);
  assert.doesNotMatch(h, /geoDetect|headers\(\)|HeroSlideshow/);
});

test("price block reads pricing.ts, not hard-coded numbers", () => {
  const p = src("app/components/home/PriceBlock.tsx");
  assert.match(p, /COURSE_PRICE_LABEL/);
  assert.match(p, /MONTHLY_PRICE_LABEL/);
  assert.match(p, /MONTHLY_PAYMENTS/);
  assert.doesNotMatch(p, /999\.9|99\.99/);
  assert.match(p, /home-pricing/);
});

test("price block: one featured pay-in-full card, monthly as a secondary link", () => {
  const p = src("app/components/home/PriceBlock.tsx");
  assert.equal((p.match(/<h3[\s>]/g) ?? []).length, 1, "one card");
  assert.match(p, /Pay in full/);
  assert.match(p, /Everything included:/);
  assert.doesNotMatch(p, /Both options include/);
  assert.match(p, /Flexible ways to pay at checkout/);
  assert.match(p, /Prefer \{MONTHLY_PAYMENTS\} monthly payments of \{MONTHLY_PRICE_LABEL\}\? See payment options →/);
  // The monthly link still fires the legacy deposit event, alongside cta_click.
  const at = p.indexOf("Prefer {MONTHLY_PAYMENTS}");
  const monthly = p.slice(at - 400, at);
  assert.match(monthly, /href=\{ENROL_HREF\}/);
  assert.match(monthly, /track\("enrol", LEGACY_EVENTS\.pricingMonthly\)/);
});

test("pricing copy never names a credit product or credit terms", () => {
  for (const f of ["app/components/home/HomeHero.tsx", "app/components/home/PriceBlock.tsx", "app/courses/page.tsx"]) {
    assert.doesNotMatch(src(f), /klarna|interest-free|interest free|pay in 3/i, f);
  }
});

test("/courses: pay in full is the first, featured plan; JSON-LD prices unchanged", () => {
  const c = src("app/courses/page.tsx");
  assert.match(c, /One price\. (<span[^>]*>)?Everything included\./);
  assert.match(c, /Flexible ways to pay at checkout/);
  assert.doesNotMatch(c, /2\.74 a day|never think about it again|Pick the payment that suits you/);
  const plans = c.slice(c.indexOf("const pricing = ["), c.indexOf("const compare"));
  const pifAt = plans.indexOf('"Pay In Full"');
  const moAt = plans.indexOf('"10 Monthly Payments"');
  assert.ok(pifAt > -1 && pifAt < moAt, "pay in full first");
  assert.match(plans.slice(pifAt, moAt), /recommended: true/);
  assert.match(plans.slice(pifAt, moAt), /badge: "Recommended"/);
  assert.match(plans.slice(moAt), /recommended: false/);
  assert.match(plans.slice(moAt), /badge: null/);
  const ld = c.slice(c.indexOf("offers: ["), c.indexOf("hasCourseInstance"));
  assert.ok(ld.indexOf("COURSE_PRICE_PENCE") > -1 && ld.indexOf("COURSE_PRICE_PENCE") < ld.indexOf("MONTHLY_PLAN_TOTAL_PENCE"), "999.99 offer first");
});

test("proof band reuses existing review and partner data", () => {
  const p = src("app/components/home/ProofStrip.tsx");
  assert.match(p, /from "@\/app\/lib\/reviewsData"/);
  assert.match(p, /from "@\/app\/lib\/gymPartnersData"/);
  assert.doesNotMatch(p, /^["']use client["']/m, "ProofStrip stays a server component");
  assert.match(p, /"\/podcast"/);
  assert.match(p, /603\/4388\/6/);
  assert.match(p, /home-proof/);
});

test("proof band: stats, one visually hidden H2, review rotator, anchors, no old cards", () => {
  const p = src("app/components/home/ProofStrip.tsx");
  for (const s of ["5.0★", "Google rating", "500+", "PTs hired by our team", "NCFE L3", "CIMSPA", "Podcast"]) assert.ok(p.includes(s), s);
  assert.equal((p.match(/<h2[\s>]/g) ?? []).length, 1);
  assert.match(p, /<h2 [^>]*className="sr-only"[^>]*>Why PT Launch Lab<\/h2>/);
  assert.match(p, /<ReviewRotator/);
  assert.doesNotMatch(p, /EXCERPT_MAX|…/, "short reviews are shown in full, not truncated");
  assert.match(p, /hidden md:inline"> 603\/4388\/6/, "compact NCFE label on mobile");
  assert.match(p, /href="#reviews"[^>]*>\s*Read all reviews →/);
  assert.doesNotMatch(p, /ncfe\.png/, "the white NCFE logo block is gone");
  assert.doesNotMatch(p, /overflow-x-auto/, "no scrollbar");
  assert.doesNotMatch(p, /bg-card/, "no boxed cards");
});

test("proof band marquee: one logo style, duplicate set hidden, lazy, static under reduced motion", () => {
  const p = src("app/components/home/ProofStrip.tsx");
  assert.match(p, /Gyms in our partner network/i);
  assert.match(p, /brightness\(0\)_invert\(1\)|brightness\(0\) invert\(1\)/);
  assert.doesNotMatch(p, /lightTile/, "no per-logo tile styles");
  assert.match(p, /motion-reduce:/, "the marquee has a reduced-motion rule");
  assert.match(p, /animation-play-state:paused/);
  assert.match(p, /aria-hidden/);
  assert.match(p, /loading="lazy"/);
  assert.match(p, /alt=\{/);
  // Every partner has a mono (white, trimmed) logo on disk.
  const d = src("app/lib/gymPartnersData.ts");
  const monos = [...d.matchAll(/mono: "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(monos.length, (d.match(/^\s*\{ name:/gm) ?? []).length);
  for (const m of monos) assert.ok(existsSync(new URL(`../public${m}`, import.meta.url)), m);
});

test("review rotator: small client component, accessible, honours reduced motion", () => {
  const r = src("app/components/home/ReviewRotator.tsx");
  assert.match(r, /^["']use client["']/m);
  // Silent while auto-rotating; announces only when paused or under reduced motion.
  assert.ok(r.includes('aria-live={paused || reduced ? "polite" : "off"}'), "aria-live off while auto-rotating");
  assert.ok(r.includes("inert={n !== i}"), "hidden quotes are inert");
  assert.match(r, /aria-label=/);
  assert.match(r, /prefers-reduced-motion/);
  assert.match(r, /6000/);
  assert.match(r, /onMouseEnter/);
  assert.match(r, /onFocus/);
  assert.match(r, /★★★★★/);
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
  assert.doesNotMatch(p, /<CallModalProvider/); // provider lives in app/layout.tsx
  assert.match(src("app/layout.tsx"), /<CallModalProvider/);
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

test("videos are click-to-play: poster first, no video bytes or iframe until clicked", () => {
  const c = src("app/components/ClickToPlay.tsx");
  assert.match(c, /from "next\/image"/);
  assert.match(c, /useState\(false\)/);
  // mp4: a mounted <video> (static HTML for the VideoObject) with no src until the click.
  const video = c.match(/<video\s[^>]*?\/>/)?.[0] ?? "";
  assert.ok(video, "a <video> element is rendered for the file source");
  assert.match(video, /preload="none"/);
  assert.match(video, /poster=\{poster\}/);
  assert.match(video, /playsInline/);
  assert.doesNotMatch(video, /\bsrc=/, "no src before the click");
  assert.doesNotMatch(video, /autoPlay/);
  // iOS: play() is called synchronously inside the click handler; tracking waits for it to resolve.
  assert.match(c, /\.src = /);
  assert.match(c, /\.play\(\)/);
  assert.match(c, /\.then\(/);
  assert.match(c, /\.catch\(/);
  // YouTube: the iframe exists only once playing.
  const iframeAt = c.indexOf("<iframe");
  assert.ok(iframeAt > -1);
  assert.match(c.slice(Math.max(0, iframeAt - 120), iframeAt), /playing/, "iframe is gated on playing");
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
  assert.match(n, /<CallLink/);
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

// ---- final review fixes ----

test("call links fall back to /book-call; plain left clicks open the pop-up, modified clicks don't", () => {
  assert.equal(CALL_HREF, "/book-call");
  const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
  assert.equal(shouldOpenCallModal(plain), true);
  for (const k of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) assert.equal(shouldOpenCallModal({ ...plain, [k]: true }), false, k);
  assert.equal(shouldOpenCallModal({ ...plain, button: 1 }), false);
  assert.equal(shouldOpenCallModal({ ...plain, defaultPrevented: true }), false);
});

test("legacy GA events keep their old names and params (cfd1cd9 FinalCTA + ConversionSection)", () => {
  assert.deepEqual(LEGACY_EVENTS.finalCall, { name: "book_call_click", params: { location: "final_cta" } });
  assert.deepEqual(LEGACY_EVENTS.finalEnrol, { name: "enrol_click", params: { location: "final_cta" } });
  assert.deepEqual(LEGACY_EVENTS.pricingFull, { name: "enrol_click", params: { method: "full" } });
  assert.deepEqual(LEGACY_EVENTS.pricingMonthly, { name: "enrol_click", params: { method: "deposit" } });
  assert.deepEqual(LEGACY_EVENTS.pricingCall, { name: "book_call_click", params: { location: "conversion_section" } });
});

test("a CTA click sends cta_click plus its legacy event, if any", () => {
  assert.deepEqual(ctaClickEvents("home-hero", "call"), [["cta_click", { source: "home-hero", action: "call" }]]);
  assert.deepEqual(ctaClickEvents("home-final", "enrol", LEGACY_EVENTS.finalEnrol), [
    ["cta_click", { source: "home-final", action: "enrol" }],
    ["enrol_click", { location: "final_cta" }],
  ]);
});

test("every Book-a-call control is an <a href=/book-call> via CallLink", () => {
  const link = src("app/components/cta/CallLink.tsx");
  assert.match(link, /href=\{CALL_HREF\}/);
  assert.match(link, /preventDefault\(\)/);
  assert.match(link, /shouldOpenCallModal/);
  for (const f of ["app/components/cta/TwoWayCTA.tsx", "app/components/Nav.tsx", "app/components/cta/StickyCtaBar.tsx", "app/components/home/PriceBlock.tsx"]) {
    const s = src(f);
    assert.match(s, /<CallLink/, f);
    assert.doesNotMatch(s, /<button[^>]*>\s*(Book a free call|Book a call|Not sure\?)/, `${f} still renders a call <button>`);
  }
});

test("home FinalCTA and PriceBlock send the legacy events", () => {
  const f = src("app/components/FinalCTA.tsx");
  assert.match(f, /LEGACY_EVENTS\.finalCall/);
  assert.match(f, /LEGACY_EVENTS\.finalEnrol/);
  assert.match(f, /source=\{source \?\? "final"\}/, "landing pages get the same buttons and legacy events");
  const p = src("app/components/home/PriceBlock.tsx");
  for (const k of ["pricingFull", "pricingMonthly", "pricingCall"]) assert.match(p, new RegExp(`LEGACY_EVENTS\\.${k}`), k);
});

test("chat bubble hides below md while the home hero is in view", () => {
  const c = src("app/components/Chatbot.tsx");
  assert.match(c, /heroInView[^"`]*\?[^:]*max-md:hidden/);
});

test("sticky bar stays mounted; hidden state is inert and aria-hidden", () => {
  const s = src("app/components/cta/StickyCtaBar.tsx");
  assert.doesNotMatch(s, /if \(!visible\) return null/);
  assert.match(s, /inert=\{!visible\}/);
  assert.match(s, /aria-hidden=\{!visible\}/);
  assert.match(s, /translate-y-full/);
  assert.match(s, /pointer-events-none/);
});

test("call-modal context is a tiny module; LeadForm loads only via next/dynamic", () => {
  const ctx = src("app/components/cta/callModalContext.ts");
  assert.match(ctx, /export function useOptionalCallModal/);
  assert.match(ctx, /export function useCallModal/);
  assert.doesNotMatch(ctx, /from ["'][^"']*(LeadForm|submitLead|CallModal)["']/);
  assert.deepEqual([...ctx.matchAll(/^import .* from "([^"]+)"/gm)].map((m) => m[1]), ["react"]);
  const m = src("app/components/cta/CallModal.tsx");
  assert.match(m, /from "next\/dynamic"/);
  assert.doesNotMatch(m, /^import LeadForm/m);
  // Nothing but the root layout imports CallModal.tsx itself.
  const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\\/g, "/");
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = `${d}/${n}`; return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : []; });
  const importers = walk(`${root}app`).filter((p) => /from ["'][^"']*\/CallModal["']/.test(readFileSync(p, "utf8")));
  assert.deepEqual(importers.map((p) => p.slice(root.length)), ["app/layout.tsx"]);
});

test("pop-up Esc is ignored while a <select> has focus", () => {
  assert.match(src("app/components/cta/CallModal.tsx"), /tagName === "SELECT"/);
});

test("layout no longer hand-preloads the hero photo", () => {
  assert.doesNotMatch(src("app/layout.tsx"), /href="\/learner-1\.webp"/);
});

test("home page has a podcast next-step link", () => {
  const p = src("app/page.tsx");
  assert.match(p, /href="\/podcast"[^>]*>\s*Listen to the podcast →/);
  assert.ok(p.indexOf("Listen to the podcast") > p.indexOf("<Podcast"));
});

test("typical market cost label lives in pricing.ts", () => {
  assert.equal(TYPICAL_COST_LABEL, "£1,200–£2,800");
  for (const f of ["app/components/GymAcademyPage.tsx", "app/components/home/PriceBlock.tsx"]) {
    const s = src(f);
    assert.match(s, /TYPICAL_COST_LABEL/, f);
    assert.doesNotMatch(s, /£1,200–£2,800/, f);
  }
});

test("was-price space is reserved before mount (no hero button shift)", () => {
  const w = src("app/components/WasPrice.tsx");
  assert.match(w, /reserve/);
  assert.match(w, /invisible/);
  assert.match(src("app/components/home/HomeHero.tsx"), /<WasPrice[^>]*reserve=/);
  assert.match(src("app/components/home/PriceBlock.tsx"), /<WasPrice[^>]*reserve=/);
});

test("retired VSL components are gone", () => {
  for (const f of ["app/components/HomepageVsl.tsx", "app/components/VslPlayer.tsx"]) assert.ok(!existsSync(new URL(`../${f}`, import.meta.url)), f);
});
