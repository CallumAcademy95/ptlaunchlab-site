// Phase 4b, Task 1: three genuinely local course pages.
// Spec: docs/superpowers/specs/2026-10-13-ptlaunchlab-phase4b-local-pages-design.md
//   Testing, Unit items 1–3:
//   1. the local pages render MoneyHero, PriceBlock and the FAQ, and their JSON-LD parses;
//   2. the FAQ JSON-LD equals the visible FAQ;
//   3. none of "workshop", "visit our", Unit 3 as a learner venue, "Klarna",
//      "interest-free", "pay in 3".
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
// CRLF-safe: a Windows checkout must not change what the guards see.
const src = (p: string) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
// Strip comments so a guard ignores explanatory notes. Line comments only when
// `//` starts the line or follows whitespace, so "https://" survives.
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[ \t])\/\/.*$/gm, "$1");

// Dynamic import so a missing module fails its own tests, not the whole file.
const load = () => import("../app/lib/localPages.ts");

const TOWNS = [
  { key: "pontefract", town: "Pontefract", route: "app/personal-trainer-course-pontefract/page.tsx" },
  { key: "wakefield", town: "Wakefield", route: "app/personal-trainer-course-wakefield/page.tsx" },
  { key: "leeds", town: "Leeds", route: "app/personal-trainer-course-leeds/page.tsx" },
] as const;

const COMPONENT = "app/components/local/LocalCoursePage.tsx";
const BASE = "https://ptlaunchlab.co.uk";

/** Every string anywhere inside a value. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

// ── 1. Pages render MoneyHero, PriceBlock and the FAQ; JSON-LD parses ──────

test("each route is a thin static wrapper around LocalCoursePage", () => {
  for (const t of TOWNS) {
    assert.ok(existsSync(join(ROOT, t.route)), t.route);
    const s = src(t.route);
    assert.match(s, new RegExp(`<LocalCoursePage content=\\{LOCAL_PAGES\\.${t.key}\\} />`), t.route);
    assert.match(s, new RegExp(`export const metadata: Metadata = localMetadata\\(LOCAL_PAGES\\.${t.key}\\)`), t.route);
    assert.doesNotMatch(s, /dynamic|revalidate|headers\(|cookies\(|searchParams/, `${t.route} stays static`);
    assert.ok(s.split("\n").length < 25, `${t.route} is a thin wrapper`);
  }
});

test("LocalCoursePage renders MoneyHero, the local section, how it works, PriceBlock, FAQ and both CTAs, in order", () => {
  const c = src(COMPONENT);
  const order = ["<MoneyHero", "Local to {c.town}", "How it works from {c.town}", "<PriceBlock", "c.faqs.map", "<TwoWayCTA", "<StickyCtaBar", "<Footer"];
  let at = -1;
  for (const s of order) { const i = c.indexOf(s); assert.ok(i > at, `${s} out of order or missing`); at = i; }
  assert.match(c, /eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"/);
  assert.match(c, /source=\{`local-\$\{c\.key\}-hero`\}/);
  assert.match(c, /<PriceBlock source=\{`local-\$\{c\.key\}-pricing`\}/);
  assert.match(c, /<TwoWayCTA source=\{`local-\$\{c\.key\}-final`\}/);
  assert.match(c, /<StickyCtaBar watchSelector=\{`\[data-cta-source='local-\$\{c\.key\}-hero'\]`\} source=\{`local-\$\{c\.key\}-sticky`\}/);
  assert.match(c, /faqPageSchema\(c\.faqs\)/);
  assert.match(c, /courseSchema\(c\)/);
  assert.match(c, /<Breadcrumbs trail=\{breadcrumbTrail\(c\)\}/);
  assert.doesNotMatch(c, /^["']use client["']/m, "server component");
  assert.doesNotMatch(c, /999\.9|99\.99/, "prices come from pricing.ts");
});

test("hero copy is the spec's, per town", async () => {
  const { LOCAL_PAGES } = await load();
  for (const t of TOWNS) {
    const p = LOCAL_PAGES[t.key];
    assert.equal(p.key, t.key);
    assert.equal(p.town, t.town);
    assert.equal(p.hero.headline, `Personal Trainer Course in ${t.town},`);
    assert.equal(p.hero.goldTail, "online around your job.");
    assert.equal(p.hero.subline, `Qualify in 8–16 weeks with an NCFE Level 3 course you study from ${t.town}, around work.`);
    assert.match(p.hero.image.src, /^\/learner-\d+\.webp$/);
    assert.ok(existsSync(join(ROOT, "public", p.hero.image.src)), p.hero.image.src);
  }
});

test("metadata: unique keyword titles in 65 characters, unique descriptions, canonical and Open Graph", async () => {
  const { LOCAL_PAGES, localMetadata } = await load();
  const titles: string[] = [];
  const descs: string[] = [];
  for (const t of TOWNS) {
    const m = localMetadata(LOCAL_PAGES[t.key]);
    const title = String(m.title);
    assert.ok(title.includes(`Personal Trainer Course ${t.town}`), title);
    assert.ok(title.length <= 65, `${title.length}: ${title}`);
    assert.ok(String(m.description).length > 50, "a real description");
    assert.ok(String(m.description).length <= 165, `${String(m.description).length}: description fits a snippet`);
    const url = `${BASE}/personal-trainer-course-${t.key}`;
    assert.equal(m.alternates?.canonical, url);
    assert.equal(m.openGraph?.url, url);
    assert.ok(m.openGraph?.title);
    assert.ok(m.openGraph?.description);
    titles.push(title);
    descs.push(String(m.description));
  }
  assert.equal(new Set(titles).size, 3, "titles are unique");
  assert.equal(new Set(descs).size, 3, "descriptions are unique");
});

test("JSON-LD parses: Course (org provider, offers from pricing.ts), FAQPage and BreadcrumbList", async () => {
  const { LOCAL_PAGES, courseSchema, breadcrumbTrail } = await load();
  const { faqPageSchema } = await import("../app/lib/faqSchema.ts");
  const pricing = await import("../app/lib/pricing.ts");
  for (const t of TOWNS) {
    const p = LOCAL_PAGES[t.key];
    const course = JSON.parse(JSON.stringify(courseSchema(p)));
    assert.equal(course["@context"], "https://schema.org");
    assert.equal(course["@type"], "Course");
    assert.deepEqual(course.provider, { "@id": `${BASE}/#org` });
    const offers = [course.offers].flat();
    assert.ok(offers.length >= 1);
    assert.equal(offers[0].price, (pricing.COURSE_PRICE_PENCE / 100).toFixed(2));
    assert.equal(offers[0].priceCurrency, "GBP");
    for (const s of strings(course)) assert.doesNotMatch(s, /interest/i);
    const faq = JSON.parse(JSON.stringify(faqPageSchema(p.faqs)));
    assert.equal(faq["@type"], "FAQPage");
    const trail = breadcrumbTrail(p);
    assert.deepEqual(trail, [
      { name: "Courses", url: `${BASE}/courses` },
      { name: `Personal Trainer Course ${t.town}`, url: `${BASE}/personal-trainer-course-${t.key}` },
    ]);
  }
});

// ── 2. FAQ JSON-LD equals the visible FAQ ─────────────────────────────────

test("FAQ: 4–6 questions, and the FAQPage JSON-LD is built from the same array the page renders", async () => {
  const { LOCAL_PAGES } = await load();
  const { faqPageSchema } = await import("../app/lib/faqSchema.ts");
  for (const t of TOWNS) {
    const faqs = LOCAL_PAGES[t.key].faqs;
    assert.ok(faqs.length >= 4 && faqs.length <= 6, `${t.key}: ${faqs.length} FAQs`);
    const schema = JSON.parse(JSON.stringify(faqPageSchema(faqs)));
    assert.deepEqual(
      schema.mainEntity.map((q: { name: string; acceptedAnswer: { text: string } }) => ({ q: q.name, a: q.acceptedAnswer.text })),
      faqs.map((f) => ({ q: f.q, a: f.a })),
    );
  }
  // The visible FAQ prints exactly f.q and f.a, nothing added.
  const c = src(COMPONENT);
  assert.match(c, /c\.faqs\.map\(\(f\) =>/);
  assert.match(c, /\{f\.q\}/);
  assert.match(c, /\{f\.a\}/);
});

// ── 3. No invented venues, workshops or credit wording ─────────────────────

const BANNED = [/workshop/i, /visit our/i, /klarna/i, /interest[- ]free/i, /pay in 3/i];

test("no banned wording in the content, the component, the routes or the footer", async () => {
  const { LOCAL_PAGES } = await load();
  const texts = [
    ...strings(LOCAL_PAGES).map((s) => ["localPages", s] as const),
    ...[COMPONENT, "app/lib/localPages.ts", "app/components/Footer.tsx", ...TOWNS.map((t) => t.route)].map((f) => [f, stripComments(src(f))] as const),
  ];
  for (const [where, s] of texts) for (const b of BANNED) assert.doesNotMatch(s, b, `${where}: ${b}`);
});

test("Unit 3 is the business address only, never a place learners go", async () => {
  const { LOCAL_PAGES } = await load();
  const VENUE = /\b(train|trained|training|assess|assessed|visit|attend|study|studied|class|session|learners?|come in|drop in|in person|on site)\b/i;
  for (const t of TOWNS) {
    const sentences = strings(LOCAL_PAGES[t.key]).flatMap((s) => s.split(/(?<=[.!?])\s+/));
    const withAddress = sentences.filter((s) => /Unit 3|Royals Business Park|WF8 4AH/.test(s));
    for (const s of withAddress) assert.doesNotMatch(s, VENUE, `${t.key}: "${s}"`);
    // No street address is given for Ultimate Shred: the repo has none.
    for (const s of sentences.filter((x) => /Ultimate Shred/.test(x))) {
      assert.doesNotMatch(s, /Unit 3|Royals Business Park|King St|WF8/, `${t.key}: "${s}"`);
    }
  }
});

test("local facts are the spec's, and the partner gyms come from the gym configs", async () => {
  const { LOCAL_PAGES, WEST_YORKSHIRE_PARTNERS } = await load();
  const { GYMS } = await import("../app/lib/gyms/index.ts");
  const p = LOCAL_PAGES.pontefract;
  assert.ok(
    p.local.lead.includes("We are based in Pontefract. Ultimate Shred Academy, our own gym and NCFE-approved centre (9002788), is here, and local learners can train or be assessed there."),
    p.local.lead,
  );
  assert.ok(WEST_YORKSHIRE_PARTNERS.length > 0, "the data supports at least one West Yorkshire partner");
  for (const slug of WEST_YORKSHIRE_PARTNERS) {
    const g = GYMS[slug];
    assert.ok(g, `${slug} is in the registry`);
    assert.ok(g.location, `${slug} has a location in its config`);
  }
  for (const key of ["wakefield", "leeds"] as const) {
    const l = LOCAL_PAGES[key];
    assert.equal(l.local.lead, `Pontefract-based, close to ${l.town}.`);
    assert.deepEqual(
      l.local.partners,
      WEST_YORKSHIRE_PARTNERS.map((slug) => ({ name: GYMS[slug].gymName, town: GYMS[slug].location })),
    );
  }
});

test("prices in the content come from pricing.ts", async () => {
  const { LOCAL_PAGES } = await load();
  const { COURSE_PRICE_LABEL } = await import("../app/lib/pricing.ts");
  assert.doesNotMatch(src("app/lib/localPages.ts"), /999\.9|99\.99/);
  for (const t of TOWNS) {
    const cost = LOCAL_PAGES[t.key].faqs.find((f) => /cost/i.test(f.q));
    assert.ok(cost, `${t.key}: a cost question`);
    assert.ok(cost.a.includes(COURSE_PRICE_LABEL), cost.a);
  }
});

// ── Footer line (spec §3) ──────────────────────────────────────────────────

test("the shared Footer links to the three local pages", () => {
  const f = src("app/components/Footer.tsx");
  assert.match(f, /PT courses near you:/);
  const near = f.slice(f.indexOf("PT courses near you:"));
  const hrefs = [...near.matchAll(/href="(\/personal-trainer-course-[a-z]+)"/g)].map((m) => m[1]).slice(0, 3);
  assert.deepEqual(hrefs, ["/personal-trainer-course-pontefract", "/personal-trainer-course-wakefield", "/personal-trainer-course-leeds"]);
  for (const t of ["Pontefract", "Wakefield", "Leeds"]) assert.match(near, new RegExp(`>${t}</a>`));
});
