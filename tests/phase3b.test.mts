import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const BANNED = [/klarna/i, /interest-free/i, /interest free/i, /pay in 3/i, /daily coffee/i];

test("MoneyHero: pay-in-full price row, two buttons, video or image", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  assert.match(h, /COURSE_PRICE_LABEL/);
  assert.match(h, /everything included/);
  assert.match(h, /Flexible ways to pay at checkout/);
  assert.doesNotMatch(h, /MONTHLY_PRICE_LABEL|MONTHLY_PAYMENTS|\/month/, "pay in full is the hero offer");
  assert.match(h, /<WasPrice[^>]*reserve=/);
  assert.match(h, /<TwoWayCTA[^>]*source=\{source\}/);
  assert.match(h, /<ClickToPlay/);
  assert.match(h, /priority/);
  assert.match(h, /★ 5\.0 Google · 500\+ PTs hired · Study around your job/);
  assert.equal((h.match(/<h1[\s>]/g) ?? []).length, 1, "one H1");
  assert.doesNotMatch(h, /^["']use client["']/m, "server component: image and price row are in the static HTML");
});

test("MoneyHero: props are the spec's, verbatim", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  for (const p of [
    /eyebrow: string;/,
    /headline: string;/,
    /goldTail: string;/,
    /subline: string;/,
    /source: string;/,
    /video\?: \{ kind: "mp4" \| "youtube"; src: string; poster: string; trackAs: string; metaEvent\?: string; title\?: string \};/,
    /image\?: \{ src: string; alt: string \};/,
  ]) assert.match(h, p, String(p));
});

test("MoneyHero: render order is eyebrow, H1, subline, price, buttons, trust line", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  const order = ["{eyebrow}", "<h1", "{subline}", "{COURSE_PRICE_LABEL}", "<TwoWayCTA", "★ 5.0 Google"];
  let at = -1;
  for (const s of order) { const i = h.indexOf(s); assert.ok(i > at, `${s} out of order or missing`); at = i; }
});

test("FunnelPricingBlock: one featured pay-in-full card plus the monthly link", () => {
  const f = src("app/components/FunnelPricingBlock.tsx");
  assert.equal((f.match(/data-featured/g) ?? []).length, 1, "exactly one featured card");
  assert.doesNotMatch(f, /Pay monthly/, "no second card");
  assert.match(f, /Pay in full/);
  assert.match(f, /Everything included/);
  assert.match(f, /Flexible ways to pay at checkout/);
  assert.match(f, />\s*Enrol now\s*</);
  assert.match(f, /Prefer \{MONTHLY_PAYMENTS\} monthly payments of \{MONTHLY_PRICE_LABEL\}\? See payment options →/);
  assert.ok(f.indexOf("data-featured") < f.indexOf("Prefer {MONTHLY_PAYMENTS}"), "the card comes before the monthly link");
});

test("FunnelPricingBlock: value stack, RRPs, You pay and risk reversal stay", () => {
  const f = src("app/components/FunnelPricingBlock.tsx");
  assert.match(f, /You pay/);
  assert.match(f, /const VALUE_STACK/);
  for (const rrp of ['"£499"', '"£1,099"', '"Priceless"', '"£199"']) assert.ok(f.includes(rrp), rrp);
  // The Hub has never been sold on its own, so it carries no price (CAP Code value claims).
  assert.match(f, /Mentorship Hub",\s+sub: "[^"]*", rrp: "Included"/);
  for (const g of ["Tutor in 24 hours", "7-day cancellation", "Free resubmissions", "Pass support guarantee"]) assert.ok(f.includes(g), g);
  assert.match(f, /showValueStack/);
  assert.match(f, /variant/);
});

test("FunnelPricingBlock: old events still fire, cta_click added", () => {
  const f = src("app/components/FunnelPricingBlock.tsx");
  assert.match(f, /promo_checkout_clicked/);
  assert.match(f, /plan, has_promo: false/);
  assert.match(f, /ctaClickEvents\(/);
  assert.match(f, /\("pif"\)/);
  assert.match(f, /\("monthly"\)/);
  assert.match(f, /href=\{ENROL_HREF\}/);
});

test("Phase 3b components carry no credit wording", () => {
  for (const p of ["app/components/money/MoneyHero.tsx", "app/components/FunnelPricingBlock.tsx"]) {
    const s = src(p);
    for (const b of BANNED) assert.doesNotMatch(s, b, `${p}: ${b}`);
  }
});

test("prices come from pricing.ts, not literals", () => {
  for (const p of ["app/components/money/MoneyHero.tsx", "app/components/FunnelPricingBlock.tsx"]) {
    assert.doesNotMatch(src(p), /999\.9|99\.99/, p);
  }
});

// ─── Task 2: the /vsl ad landing pages share one template ────────────────────

const VSL_PAGES = [
  { key: "starter", path: "app/vsl/become-a-personal-trainer-uk/page.tsx", h1: "Become a qualified Personal Trainer, around your job." },
  { key: "switcher", path: "app/vsl/career-change-to-personal-trainer/page.tsx", h1: "Change career to Personal Trainer, around your current job." },
  { key: "returner", path: "app/vsl/retrain-as-a-personal-trainer/page.tsx", h1: "Retrain as a Personal Trainer, from home." },
] as const;

test("/vsl pages: each renders VslPage with its content and keeps its own metadata", () => {
  for (const p of VSL_PAGES) {
    const s = src(p.path);
    assert.match(s, new RegExp(`<VslPage content=\{VSL_CONTENT\.${p.key}\} />`), p.path);
    assert.match(s, /export const metadata: Metadata = \{/, p.path);
    assert.match(s, /alternates: \{ canonical: PAGE_URL \}/, p.path);
    assert.ok(s.split("\n").length < 80, `${p.path} is a thin wrapper`);
  }
});

test("/vsl content: starter, switcher, returner with the spec H1, quiz URL and YouTube id", async () => {
  const { VSL_CONTENT } = await import("../app/vsl/content.ts");
  for (const p of VSL_PAGES) {
    const c = VSL_CONTENT[p.key];
    assert.ok(c, p.key);
    assert.equal(`${c.hero.headline} ${c.hero.goldTail}`, p.h1, p.key);
    assert.equal(c.quizHref, `/quiz?avatar=${p.key}`, p.key);
    assert.match(c.youtubeId, /^[\w-]{11}$/, p.key);
    assert.equal(c.avatar, p.key);
    assert.ok(!/\.\s+\S/.test(c.hero.subline.trim()), `${p.key}: subline is one sentence`);
  }
});

test("VslPage: MoneyHero with the video, a quiz band to content.quizHref, no separate video section", () => {
  const v = src("app/vsl/VslPage.tsx");
  assert.match(v, /<MoneyHero[\s\S]*?video=\{\{/);
  assert.match(v, /kind: "youtube"/);
  assert.match(v, /i\.ytimg\.com\/vi\/\$\{c\.youtubeId\}\/hqdefault\.jpg/);
  assert.match(v, /trackAs: `vsl_\$\{c\.avatar\}`/);
  assert.match(v, /metaEvent: "VSLPlay"/);
  assert.match(v, /source=\{`vsl-\$\{c\.avatar\}-hero`\}/);
  assert.match(v, /eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"/);
  assert.match(v, /href=\{c\.quizHref\}/);
  assert.match(v, /Not sure yet\? Take the 60-second PT career quiz →/);
  assert.doesNotMatch(v, /<iframe/, "the video only lives in the hero");
  assert.doesNotMatch(v, /Watch first/);
  // Quiz band comes right after "This is for you if…"
  const forYou = v.indexOf("This is for you");
  const band = v.indexOf("Not sure yet?");
  const empathy = v.indexOf("c.empathy");
  assert.ok(forYou > 0 && band > forYou && empathy > band, "quiz band sits between For-you-if and the empathy section");
});

test("VslPage: keeps the shared sections, the order, and the pricing/final CTA sources", () => {
  const v = src("app/vsl/VslPage.tsx");
  const order = ["<MoneyHero", "This is for you", "Not sure yet?", "c.empathy", "<HeroLeadForm", "c.founders", "c.pathway", "c.comparison", "c.future", "c.objections", "c.steps", "c.learnerStripLabel", "<FunnelPricingBlock", "<ProofStrip", "<Reviews", "<Accreditation", "c.faqHeading", "<TwoWayCTA", "<StickyMobileCTA"];
  let at = -1;
  for (const s of order) { const i = v.indexOf(s); assert.ok(i > at, `${s} out of order or missing`); at = i; }
  assert.match(v, /<FunnelPricingBlock variant="dark" source=\{`vsl-\$\{c\.avatar\}-pricing`\} \/>/);
  assert.match(v, /<TwoWayCTA source="vsl-final"/);
  assert.match(v, /application\/ld\+json/);
  assert.match(v, /FAQPage/);
});

test("/vsl: pricing intro leads with the full price, everything included", async () => {
  const { VSL_CONTENT } = await import("../app/vsl/content.ts");
  for (const p of VSL_PAGES) {
    assert.match(VSL_CONTENT[p.key].pricingIntro, /^£999\.99, everything included/, p.key);
  }
});

test("/vsl files carry no credit or affordability selling lines", () => {
  const files = ["app/vsl/VslPage.tsx", "app/vsl/content.ts", ...VSL_PAGES.map((p) => p.path)];
  for (const f of files) {
    const s = src(f);
    for (const b of [...BANNED, /one PT session a week/i, /school year/i, /food shop/i]) assert.doesNotMatch(s, b, `${f}: ${b}`);
  }
});

test("/vsl: 'no interest' only inside FAQ answers", async () => {
  const { VSL_CONTENT } = await import("../app/vsl/content.ts");
  for (const p of VSL_PAGES) {
    const { faqs, ...rest } = VSL_CONTENT[p.key];
    assert.doesNotMatch(JSON.stringify(rest), /no interest/i, p.key);
    void faqs;
  }
  assert.doesNotMatch(src("app/vsl/VslPage.tsx"), /no interest/i);
});

// ─── Task 3: /courses, /funnel, /career-blueprint ────────────────────────────

const EYEBROW = 'eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"';
const OLD_CTAS = [/Discover Your Pathway/, /Start Application/];
/** The props of the page's one <MoneyHero …/> element. */
const heroOf = (s: string) => {
  const at = s.indexOf("<MoneyHero");
  assert.ok(at > -1, "uses <MoneyHero");
  assert.equal(s.indexOf("<MoneyHero", at + 1), -1, "one MoneyHero");
  return s.slice(at, s.indexOf("/>", at));
};

test("/courses: MoneyHero with the spec copy and image, sticky bar watching it", () => {
  const c = src("app/courses/page.tsx");
  const h = heroOf(c);
  assert.ok(h.includes(EYEBROW), "eyebrow");
  assert.ok(h.includes('headline="The online Level 2 & 3 Personal Trainer Course,"'), "headline");
  assert.ok(h.includes('goldTail="around your job."'), "goldTail");
  assert.ok(h.includes('subline="Qualify in 8–16 weeks, with business training and a guaranteed gym introduction."'), "subline");
  assert.ok(h.includes('source="courses-hero"'), "source");
  assert.ok(h.includes('src: "/learner-2.webp"'), "image");
  assert.match(c, /<StickyCtaBar watchSelector="\[data-cta-source='courses-hero'\]"/);
  assert.match(c, /<TwoWayCTA source="courses-final"/);
  assert.match(c, /<ProspectusButton \/>/);
  assert.doesNotMatch(c, /<h1/, "the only H1 is MoneyHero's");
  assert.doesNotMatch(c, /<main className="pt-\[72px\]"/, "MoneyHero brings its own nav offset");
});

test("/courses: JSON-LD kept", () => {
  const c = src("app/courses/page.tsx");
  assert.match(c, /JSON\.stringify\(faqPageSchema\(faqs\)\)/);
  assert.match(c, /JSON\.stringify\(courseSchema\)/);
  assert.match(c, /"@type": "Course"/);
});

test("/funnel: server page puts MoneyHero and PriceBlock into the client page; noindex stays", () => {
  const p = src("app/funnel/page.tsx");
  assert.doesNotMatch(p, /^["']use client["']/m, "MoneyHero renders on the server");
  const h = heroOf(p);
  assert.ok(h.includes(EYEBROW), "eyebrow");
  assert.ok(h.includes('headline="Become a qualified Personal Trainer,"'), "headline");
  assert.ok(h.includes('goldTail="around your job."'), "goldTail");
  assert.ok(h.includes('source="funnel-hero"'), "source");
  assert.ok(h.includes('src: "/learner-3.webp"'), "image");
  assert.match(p, /<PriceBlock source="funnel-pricing" bg="base"/);
  assert.match(src("app/funnel/layout.tsx"), /robots:\s*\{\s*index:\s*false/);
});

test("/funnel client: top bar is Enrol now + CallLink, prospectus modal kept, no slideshow or two cards", () => {
  const f = src("app/funnel/FunnelClient.tsx");
  assert.match(f, /^["']use client["']/m);
  const bar = f.slice(f.indexOf("STICKY TOP BAR"), f.indexOf("{hero}"));
  assert.match(bar, />\s*Enrol now\s*</);
  assert.match(bar, /<CallLink[\s\S]*?>\s*Book a free call\s*<\/CallLink>/);
  assert.ok(f.indexOf("{hero}") > -1 && f.indexOf("{pricing}") > f.indexOf("{hero}"), "hero and pricing slots");
  assert.match(f, /PROSPECTUS MODAL/);
  assert.match(f, /<LeadForm[\s\S]*?intent="prospectus"[\s\S]*?source="funnel_prospectus_modal"/);
  assert.doesNotMatch(f, /HeroSlideshow/);
  assert.doesNotMatch(f, /I&apos;m ready\. Let&apos;s go\.|I have a few questions first\./, "the two conversion cards are gone");
  assert.equal((f.match(/<h1[\s>]/g) ?? []).length, 0, "the only H1 is MoneyHero's");
});

test("/career-blueprint: MoneyHero, pricing source, investment leads with the full price, shared final pair", () => {
  const b = src("app/career-blueprint/page.tsx");
  const h = heroOf(b);
  assert.ok(h.includes(EYEBROW), "eyebrow");
  assert.ok(h.includes('headline="Become a qualified Personal Trainer,"'), "headline");
  assert.ok(h.includes('goldTail="around your job."'), "goldTail");
  assert.ok(h.includes('source="blueprint-hero"'), "source");
  assert.ok(h.includes('src: "/learner-4.webp"'), "image");
  assert.match(b, /<FunnelPricingBlock source="blueprint-pricing" \/>/);
  const inv = b.slice(b.indexOf("The investment"), b.indexOf("<Reviews"));
  assert.match(inv, /\{COURSE_PRICE_LABEL\}, <span[^>]*>everything included/);
  assert.match(inv, /Or \{MONTHLY_PAYMENTS\} monthly payments of \{MONTHLY_PRICE_LABEL\}, the first taken today \(\{formatPence\(MONTHLY_PLAN_TOTAL_PENCE\)\} in total\)\./);
  assert.ok(inv.indexOf("COURSE_PRICE_LABEL") < inv.indexOf("MONTHLY_PRICE_LABEL"), "full price before monthly");
  assert.doesNotMatch(inv, /a month|one PT session a week|cheapest bet/, "no monthly-first selling");
  assert.match(inv, /£20–50k\+/);
  assert.match(b, /<TwoWayCTA source="blueprint-final"/);
  assert.doesNotMatch(b, /<h1/, "the only H1 is MoneyHero's");
});

test("Task 3 pages carry no credit wording or old CTA labels", () => {
  for (const p of ["app/courses/page.tsx", "app/funnel/page.tsx", "app/funnel/FunnelClient.tsx", "app/career-blueprint/page.tsx"]) {
    const s = src(p);
    for (const b of [...BANNED, ...OLD_CTAS]) assert.doesNotMatch(s, b, `${p}: ${b}`);
  }
});

// ─── Final review fixes ──────────────────────────────────────────────────────

test("/career-blueprint FAQ: leads with the full price, no PT-session affordability line", () => {
  const b = src("app/career-blueprint/page.tsx");
  assert.doesNotMatch(b, /session a week/i);
  const faq = b.slice(b.indexOf('q: "What are the payment options?"'));
  const answer = faq.slice(0, faq.indexOf("},"));
  assert.ok(answer.indexOf("COURSE_PRICE_LABEL") > -1, "full price in the answer");
  assert.ok(answer.indexOf("COURSE_PRICE_LABEL") < answer.indexOf("MONTHLY_PRICE_LABEL"), "full price before monthly");
});

test("ClickToPlay supports priority for the poster; MoneyHero's video passes it", () => {
  const c = src("app/components/ClickToPlay.tsx");
  assert.match(c, /priority\?: boolean/);
  assert.match(c, /<Image[^>]*priority=\{priority\}/);
  const h = src("app/components/money/MoneyHero.tsx");
  const player = h.slice(h.indexOf("<ClickToPlay"), h.indexOf("/>", h.indexOf("<ClickToPlay")));
  assert.match(player, /\n\s*priority\r?\n/);
});

test("MoneyHero: optional video.title names the player; /vsl passes the founders' title", () => {
  const h = src("app/components/money/MoneyHero.tsx");
  assert.match(h, /title\?: string/);
  assert.match(h, /title=\{video\.title \?\? title\}/);
  assert.match(src("app/vsl/VslPage.tsx"), /title: "Watch: why PT Launch Lab, from the founders"/);
});

test("/vsl content: step titles don't sell monthly as the affordable option", async () => {
  const { VSL_CONTENT } = await import("../app/vsl/content.ts");
  for (const p of VSL_PAGES) {
    for (const s of VSL_CONTENT[p.key].steps.items) assert.doesNotMatch(s.title, /salary|household/i, `${p.key}: ${s.title}`);
  }
  const s = src("app/vsl/content.ts");
  assert.doesNotMatch(s, /including the way it's priced/);
  assert.doesNotMatch(s, /The next paragraph is for you/);
});

test("VslPage: the quiz band is a section with an sr-only heading", () => {
  const v = src("app/vsl/VslPage.tsx");
  const band = v.slice(v.indexOf("QUIZ BAND"), v.indexOf("EMPATHY"));
  assert.match(band, /<section[\s>]/);
  assert.match(band, /<h2 className="sr-only">Not sure yet\?<\/h2>/);
});

test("/vsl sticky bar watches that page's hero buttons, still hidden from lg", () => {
  const v = src("app/vsl/VslPage.tsx");
  assert.match(v, /<StickyMobileCTA watchSelector=\{`\[data-cta-source='vsl-\$\{c\.avatar\}-hero'\]`\} \/>/);
  const m = src("app/components/StickyMobileCTA.tsx");
  assert.match(m, /watchSelector=\{watchSelector\}/);
  assert.match(m, /hideFrom="lg"/);
});

test("touched pages: no credit wording or monthly-first selling lines", () => {
  const files = [
    "app/career-blueprint/page.tsx", "app/components/ClickToPlay.tsx", "app/vsl/content.ts", "app/vsl/VslPage.tsx",
    "app/components/StickyMobileCTA.tsx", "app/components/money/MoneyHero.tsx", "app/funnel/FunnelClient.tsx",
    "app/courses/page.tsx", "app/lib/careerPlannerV2.ts", "app/funnel/layout.tsx",
  ];
  const lines = [/Payment plans available/, /Spread the cost while you study/, /Flexible payment plans/, /cost isn't the barrier/, /covered in under six weeks/, /or spread it monthly\./, /Both options are below/];
  for (const f of files) {
    const s = src(f);
    for (const b of [...BANNED, ...lines]) assert.doesNotMatch(s, b, `${f}: ${b}`);
  }
});

test("/courses: monthly card carries no 'no interest'; objection answer leads with the full price", () => {
  const c = src("app/courses/page.tsx");
  const card = c.slice(c.indexOf('title: "10 Monthly Payments"'), c.indexOf("badge: null"));
  assert.doesNotMatch(card, /no interest/i);
  const obj = c.slice(c.indexOf("is still a lot of money"), c.indexOf("What if it's not the right fit"));
  assert.ok(obj.indexOf("COURSE_PRICE_LABEL") < obj.indexOf("MONTHLY_PRICE_LABEL"), "full price first");
});
