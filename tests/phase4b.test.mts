// Phase 4b, Task 1: genuinely local course pages.
// Spec: docs/superpowers/specs/2026-10-13-ptlaunchlab-phase4b-local-pages-design.md
// Owner decision (fix round): one Pontefract page and one West Yorkshire page,
// not town-swapped Wakefield/Leeds clones.
//   Testing, Unit items 1–3:
//   1. the local pages render MoneyHero, PriceBlock and the FAQ, and their JSON-LD parses;
//   2. the FAQ JSON-LD equals the visible FAQ;
//   3. none of "workshop", "visit our", Unit 3 as a learner venue, "Klarna",
//      "interest-free", "pay in 3".
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
// CRLF-safe: a Windows checkout must not change what the guards see.
const src = (p: string) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
// Strip comments so a guard ignores explanatory notes. Line comments only when
// `//` starts the line or follows whitespace, so "https://" survives.
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[ \t])\/\/.*$/gm, "$1");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}
const APP_FILES = walk(join(ROOT, "app")).map((f) => relative(ROOT, f).replace(/\\/g, "/"));

// Dynamic import so a missing module fails its own tests, not the whole file.
const load = () => import("../app/lib/localPages.ts");

const PAGES = [
  { key: "pontefract", slug: "pontefract", place: "Pontefract", from: "Pontefract", route: "app/personal-trainer-course-pontefract/page.tsx" },
  { key: "westYorkshire", slug: "west-yorkshire", place: "West Yorkshire", from: "anywhere in West Yorkshire", route: "app/personal-trainer-course-west-yorkshire/page.tsx" },
] as const;

const COMPONENT = "app/components/local/LocalCoursePage.tsx";
const BASE = "https://ptlaunchlab.co.uk";

const CENTRE_SENTENCE = "Ultimate Shred Academy in Pontefract is our own gym and NCFE-approved centre (9002788).";

/** Every string anywhere inside a value. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

// ── Routes ─────────────────────────────────────────────────────────────────

test("the two local routes are thin static wrappers; the Wakefield and Leeds clones are gone", () => {
  for (const p of PAGES) {
    assert.ok(existsSync(join(ROOT, p.route)), p.route);
    const s = src(p.route);
    assert.match(s, new RegExp(`<LocalCoursePage content=\\{LOCAL_PAGES\\.${p.key}\\} />`), p.route);
    assert.match(s, new RegExp(`export const metadata: Metadata = localMetadata\\(LOCAL_PAGES\\.${p.key}\\)`), p.route);
    assert.doesNotMatch(s, /dynamic|revalidate|headers\(|cookies\(|searchParams/, `${p.route} stays static`);
    assert.ok(s.split("\n").length < 25, `${p.route} is a thin wrapper`);
  }
  for (const gone of ["wakefield", "leeds"]) {
    assert.ok(!existsSync(join(ROOT, `app/personal-trainer-course-${gone}`)), `${gone} route removed`);
  }
});

// ── 1. Pages render MoneyHero, PriceBlock and the FAQ; JSON-LD parses ──────

test("LocalCoursePage renders MoneyHero, the local section, how it works, PriceBlock, FAQ and both CTAs, in order", () => {
  const c = src(COMPONENT);
  const order = ["<MoneyHero", "Local to {c.place}", "How it works from {c.place}", "<PriceBlock", "c.faqs.map", "<TwoWayCTA", "<StickyCtaBar", "<Footer"];
  let at = -1;
  for (const s of order) { const i = c.indexOf(s); assert.ok(i > at, `${s} out of order or missing`); at = i; }
  assert.match(c, /eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"/);
  assert.match(c, /source=\{`local-\$\{c\.slug\}-hero`\}/);
  assert.match(c, /<PriceBlock source=\{`local-\$\{c\.slug\}-pricing`\}/);
  assert.match(c, /<TwoWayCTA source=\{`local-\$\{c\.slug\}-final`\}/);
  assert.match(c, /<StickyCtaBar watchSelector=\{`\[data-cta-source='local-\$\{c\.slug\}-hero'\]`\} source=\{`local-\$\{c\.slug\}-sticky`\}/);
  assert.match(c, /faqPageSchema\(c\.faqs\)/);
  assert.match(c, /courseSchema\(c\)/);
  assert.match(c, /<Breadcrumbs trail=\{breadcrumbTrail\(c\)\}/);
  assert.doesNotMatch(c, /^["']use client["']/m, "server component");
  assert.doesNotMatch(c, /999\.9|99\.99/, "prices come from pricing.ts");
});

test("hero copy is the spec's, per page", async () => {
  const { LOCAL_PAGES } = await load();
  for (const p of PAGES) {
    const c = LOCAL_PAGES[p.key];
    assert.equal(c.slug, p.slug);
    assert.equal(c.place, p.place);
    assert.equal(c.hero.headline, `Personal Trainer Course in ${p.place},`);
    assert.equal(c.hero.goldTail, "online around your job.");
    assert.equal(c.hero.subline, `Qualify in 8–16 weeks with an NCFE Level 3 course you study from ${p.from}, around work.`);
    assert.match(c.hero.image.src, /^\/learner-\d+\.webp$/);
    assert.ok(existsSync(join(ROOT, "public", c.hero.image.src)), c.hero.image.src);
  }
});

test("metadata: unique keyword titles in 65 characters, unique descriptions, canonical and Open Graph", async () => {
  const { LOCAL_PAGES, localMetadata } = await load();
  const titles: string[] = [];
  const descs: string[] = [];
  for (const p of PAGES) {
    const m = localMetadata(LOCAL_PAGES[p.key]);
    const title = String(m.title);
    assert.ok(title.includes(`Personal Trainer Course ${p.place}`), title);
    assert.ok(title.length <= 65, `${title.length}: ${title}`);
    assert.ok(String(m.description).length > 50, "a real description");
    assert.ok(String(m.description).length <= 165, `${String(m.description).length}: description fits a snippet`);
    const url = `${BASE}/personal-trainer-course-${p.slug}`;
    assert.equal(m.alternates?.canonical, url);
    assert.equal(m.openGraph?.url, url);
    assert.ok(m.openGraph?.title);
    assert.ok(m.openGraph?.description);
    titles.push(title);
    descs.push(String(m.description));
  }
  assert.equal(new Set(titles).size, PAGES.length, "titles are unique");
  assert.equal(new Set(descs).size, PAGES.length, "descriptions are unique");
});

test("JSON-LD parses: Course (org provider, offers from pricing.ts, workload), FAQPage and BreadcrumbList", async () => {
  const { LOCAL_PAGES, courseSchema, breadcrumbTrail } = await load();
  const CREDENTIAL = "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)";
  assert.ok(src("app/vsl/VslPage.tsx").includes(CREDENTIAL), "VSL wording");
  assert.ok(src("app/courses/page.tsx").includes(`educationalCredentialAwarded: "${CREDENTIAL}"`), "/courses matches");
  const { faqPageSchema } = await import("../app/lib/faqSchema.ts");
  const pricing = await import("../app/lib/pricing.ts");
  for (const p of PAGES) {
    const c = LOCAL_PAGES[p.key];
    const course = JSON.parse(JSON.stringify(courseSchema(c)));
    assert.equal(course["@context"], "https://schema.org");
    assert.equal(course["@type"], "Course");
    assert.deepEqual(course.provider, { "@id": `${BASE}/#org` });
    const offers = [course.offers].flat();
    assert.ok(offers.length >= 1);
    assert.equal(offers[0].price, (pricing.COURSE_PRICE_PENCE / 100).toFixed(2));
    assert.equal(offers[0].priceCurrency, "GBP");
    for (const s of strings(course)) assert.doesNotMatch(s, /interest/i);
    assert.equal(course.educationalCredentialAwarded, CREDENTIAL);
    assert.equal(course.hasCourseInstance["@type"], "CourseInstance");
    assert.equal(course.hasCourseInstance.courseMode, "online");
    assert.match(course.hasCourseInstance.courseWorkload, /^P\d+W$/, "an ISO 8601 duration");
    const faq = JSON.parse(JSON.stringify(faqPageSchema(c.faqs)));
    assert.equal(faq["@type"], "FAQPage");
    assert.deepEqual(breadcrumbTrail(c), [
      { name: "Courses", url: `${BASE}/courses` },
      { name: `Personal Trainer Course ${p.place}`, url: `${BASE}/personal-trainer-course-${p.slug}` },
    ]);
  }
});

// ── 2. FAQ JSON-LD equals the visible FAQ ─────────────────────────────────

test("FAQ: 4–6 questions, and the FAQPage JSON-LD is built from the same array the page renders", async () => {
  const { LOCAL_PAGES } = await load();
  const { faqPageSchema } = await import("../app/lib/faqSchema.ts");
  for (const p of PAGES) {
    const faqs = LOCAL_PAGES[p.key].faqs;
    assert.ok(faqs.length >= 4 && faqs.length <= 6, `${p.key}: ${faqs.length} FAQs`);
    const schema = JSON.parse(JSON.stringify(faqPageSchema(faqs)));
    assert.deepEqual(
      schema.mainEntity.map((q: { name: string; acceptedAnswer: { text: string } }) => ({ q: q.name, a: q.acceptedAnswer.text })),
      faqs.map((f) => ({ q: f.q, a: f.a })),
    );
  }
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
    ...[COMPONENT, "app/lib/localPages.ts", "app/components/Footer.tsx", ...PAGES.map((p) => p.route)].map((f) => [f, stripComments(src(f))] as const),
  ];
  for (const [where, s] of texts) for (const b of BANNED) assert.doesNotMatch(s, b, `${where}: ${b}`);
});

test("Unit 3 is the business address only, never a place learners go", async () => {
  const { LOCAL_PAGES } = await load();
  const VENUE = /\b(train|trained|training|assess|assessed|visit|attend|study|studied|class|session|learners?|come in|drop in|in person|on site)\b/i;
  for (const p of PAGES) {
    const sentences = strings(LOCAL_PAGES[p.key]).flatMap((s) => s.split(/(?<=[.!?])\s+/));
    const withAddress = sentences.filter((s) => /Unit 3|Royals Business Park|WF8 4AH/.test(s));
    for (const s of withAddress) assert.doesNotMatch(s, VENUE, `${p.key}: "${s}"`);
    for (const s of sentences.filter((x) => /Ultimate Shred/.test(x))) {
      assert.doesNotMatch(s, /Unit 3|Royals Business Park|King St|WF8/, `${p.key}: "${s}"`);
    }
  }
});

test("the gym introduction keeps its qualifier: the interview and the job are the gym's call", async () => {
  const { LOCAL_PAGES } = await load();
  for (const p of PAGES) {
    const step = LOCAL_PAGES[p.key].how.find((h) => /gym introduction/i.test(h.title));
    assert.ok(step, `${p.key}: a gym introduction step`);
    assert.match(step.body, /Whether they interview you and whether you get the job is between you and them\./);
  }
});

test("the in-person FAQ: fully online, no in-person training; partner gyms are introductions after qualifying", async () => {
  const { LOCAL_PAGES, westYorkshirePartners } = await load();
  const partners = westYorkshirePartners().map((p) => `${p.name} (${p.town})`).join(" and ");
  const expected =
    "No. The course is fully online, with no in-person training. " +
    `Once you qualify, we can introduce you to partner gyms in West Yorkshire such as ${partners}. ` +
    "Whether they interview you and whether you get the job is between you and them.";
  for (const p of PAGES) {
    const f = LOCAL_PAGES[p.key].faqs.find((x) => x.q === "Do I need to go to a gym or attend in person?");
    assert.ok(f, `${p.key}: in-person FAQ`);
    assert.equal(f.a, expected, `${p.key}: same answer on every page`);
    assert.ok(!LOCAL_PAGES[p.key].faqs.some((x) => /Can I train at a gym/.test(x.q)), "old gym question gone");
  }
});

// ── No in-person training or assessment, anywhere (owner correction) ───────

test("no page source in app/ claims learners train or are assessed in person", () => {
  const hits: string[] = [];
  for (const f of APP_FILES) {
    const s = src(f);
    for (const b of [/train or be assessed/i, /be assessed there/i]) if (b.test(s)) hits.push(`${f}: ${b}`);
  }
  assert.deepEqual(hits, []);
});

test("Ultimate Shred is described only as our gym and NCFE-approved centre", async () => {
  const { LOCAL_PAGES } = await load();
  for (const p of PAGES) {
    const sentences = strings(LOCAL_PAGES[p.key]).flatMap((s) => s.split(/(?<=[.!?])\s+/)).filter((s) => /Ultimate Shred/.test(s));
    assert.ok(sentences.length > 0, `${p.key}: mentions the centre`);
    for (const s of sentences) assert.equal(s, CENTRE_SENTENCE, `${p.key}: "${s}"`);
  }
});

// ── Local facts and the data-driven partner list ──────────────────────────

test("Pontefract local section: based here, the centre, fully online", async () => {
  const { LOCAL_PAGES } = await load();
  assert.equal(
    LOCAL_PAGES.pontefract.local.lead,
    `We are based in Pontefract. ${CENTRE_SENTENCE} The course is fully online, with no in-person training.`,
  );
});

test("West Yorkshire local section: the owner's copy, and partner gyms as post-qualification introductions", async () => {
  const { LOCAL_PAGES } = await load();
  const l = LOCAL_PAGES.westYorkshire.local;
  assert.equal(
    l.lead,
    `We are based in Pontefract, West Yorkshire. ${CENTRE_SENTENCE} The course is fully online, with no in-person training.`,
  );
  assert.equal(l.served, "Study from Wakefield, Leeds, Bradford, Huddersfield or anywhere in West Yorkshire.");
  assert.equal(
    l.partnersIntro,
    "Once you qualify, we can introduce you to our partner gyms in West Yorkshire. Whether they interview you and whether you get the job is between you and them.",
  );
});

test("West Yorkshire partners are derived: a town allow-list matched against each gym config's location", async () => {
  const { westYorkshirePartners, WEST_YORKSHIRE_TOWNS, AMBIGUOUS_TOWNS, LOCAL_PAGES } = await load();
  const { GYMS } = await import("../app/lib/gyms/index.ts");
  assert.deepEqual(
    [...WEST_YORKSHIRE_TOWNS],
    ["Upton", "Bradford", "Huddersfield", "Wakefield", "Leeds", "Pontefract", "Castleford", "Dewsbury", "Halifax", "Keighley", "Ossett", "Normanton"],
  );
  // Upton is not unique to West Yorkshire (Wirral, Poole, ...): it counts only
  // when the location also says "West Yorkshire".
  assert.deepEqual([...AMBIGUOUS_TOWNS], ["Upton"]);
  // Independent derivation over the registry.
  const word = (t: string) => new RegExp(`\\b${t}\\b`);
  const matched = (loc: string) =>
    WEST_YORKSHIRE_TOWNS.filter((t) => word(t).test(loc) && (!(AMBIGUOUS_TOWNS as readonly string[]).includes(t) || /West Yorkshire/.test(loc)));
  const expected = Object.values(GYMS)
    .filter((g) => g.location && matched(g.location).length)
    .map((g) => ({ name: g.gymName, towns: matched(g.location!) }));
  const got = westYorkshirePartners(GYMS);
  assert.deepEqual(got.map((p) => ({ name: p.name, towns: p.towns })), expected);
  assert.ok(got.length > 0, "the data supports at least one partner");
  for (const p of got) assert.equal(p.town, p.towns.join(" & "));
  assert.deepEqual(LOCAL_PAGES.westYorkshire.local.partners, got);
  // A gym outside the allow-list is excluded; one inside is included.
  const fake = {
    a: { ...Object.values(GYMS)[0], gymName: "Out", location: "York" },
    b: { ...Object.values(GYMS)[0], gymName: "In", location: "Halifax" },
    c: { ...Object.values(GYMS)[0], gymName: "None", location: undefined },
    d: { ...Object.values(GYMS)[0], gymName: "Wirral", location: "Upton, Wirral" },
    e: { ...Object.values(GYMS)[0], gymName: "Upton WY", location: "Upton, West Yorkshire" },
  };
  assert.deepEqual(westYorkshirePartners(fake).map((p) => p.name), ["In", "Upton WY"]);
});

test("prices in the content come from pricing.ts", async () => {
  const { LOCAL_PAGES } = await load();
  const { COURSE_PRICE_LABEL } = await import("../app/lib/pricing.ts");
  assert.doesNotMatch(src("app/lib/localPages.ts"), /999\.9|99\.99/);
  for (const p of PAGES) {
    const cost = LOCAL_PAGES[p.key].faqs.find((f) => /cost/i.test(f.q));
    assert.ok(cost, `${p.key}: a cost question`);
    assert.ok(cost.a.includes(COURSE_PRICE_LABEL), cost.a);
  }
});

// ── Footer line (spec §3, as amended) ──────────────────────────────────────

test("the shared Footer links to the two local pages", () => {
  const f = src("app/components/Footer.tsx");
  assert.match(f, /PT courses near you:/);
  const near = f.slice(f.indexOf("PT courses near you:"), f.indexOf("</p>", f.indexOf("PT courses near you:")));
  const hrefs = [...near.matchAll(/href="(\/personal-trainer-course-[a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ["/personal-trainer-course-pontefract", "/personal-trainer-course-west-yorkshire"]);
  assert.match(near, />Pontefract<\/a>/);
  assert.match(near, />West Yorkshire<\/a>/);
  assert.doesNotMatch(f, /personal-trainer-course-(wakefield|leeds)/);
});

// ══ Task 2: prune the templated location routes ═════════════════════════════
//   Testing, Unit items 4–6 (as amended: two local pages, not three):
//   4. the redirect generator maps every location slug in the data to one of
//      the targets: Pontefract, West Yorkshire or /courses;
//   5. no target is itself redirected (and every target is a real page);
//   6. the sitemap has the local pages and no template URLs.

const require_ = createRequire(import.meta.url);
// Next's own matcher for custom routes (case-insensitive, as next.config redirects are).
const { getPathMatch } = require_("next/dist/shared/lib/router/utils/path-match.js") as {
  getPathMatch: (path: string, options?: { strict?: boolean; sensitive?: boolean }) => (p: string) => false | Record<string, string>;
};

const loadRedirects = () => import("../app/lib/locationRedirects.ts");
const PONTEFRACT_PAGE = "/personal-trainer-course-pontefract";
const WEST_YORKSHIRE_PAGE = "/personal-trainer-course-west-yorkshire";

type Rule = { source: string; destination: string; permanent?: boolean; statusCode?: number; has?: unknown[] };
async function configRedirects(): Promise<Rule[]> {
  const cfg = (await import("../next.config.ts")).default;
  return (await cfg.redirects!()) as Rule[];
}
/** First matching redirect for a request to ptlaunchlab.co.uk, the way Next matches custom routes. */
function resolve(rules: Rule[], path: string): Rule | null {
  for (const r of rules) {
    if (r.has) continue; // the host-scoped rules only match ultimateshredacademy.com
    if (getPathMatch(r.source, { strict: true, sensitive: false })(path)) return r;
  }
  return null;
}
/** A real (static) page in app/ for this path. */
const pageExists = (path: string) =>
  existsSync(join(ROOT, "app", path === "/" ? "" : path.slice(1), "page.tsx"));

test("the [location] templates are gone; the module lists all 31 of them", async () => {
  const { TEMPLATES } = await loadRedirects();
  assert.equal(TEMPLATES.length, 31);
  assert.equal(new Set(TEMPLATES).size, 31);
  const left = walk(join(ROOT, "app")).filter((f) => /[\\/]\[location\][\\/]/.test(f));
  assert.deepEqual(left, [], "no [location] route remains");
  for (const t of TEMPLATES) assert.ok(!existsSync(join(ROOT, "app", t, "[location]")), t);
  // Only two templates ever had a root page; they stay.
  for (const t of ["best-personal-trainer-course-uk", "personal-trainer-course-with-business-support"]) {
    assert.ok(TEMPLATES.includes(t), t);
    assert.ok(pageExists(`/${t}`), t);
  }
});

test("4. every location slug in the data maps to Pontefract, West Yorkshire or /courses, by region", async () => {
  const { targetForLocation, PONTEFRACT_AREA } = await loadRedirects();
  const { ukLocations } = await import("../app/lib/ukLocations.ts");
  const targets = new Set([PONTEFRACT_PAGE, WEST_YORKSHIRE_PAGE, "/courses"]);
  for (const l of ukLocations) {
    const t = targetForLocation(l.slug);
    assert.ok(targets.has(t), `${l.slug} → ${t}`);
    if (l.region !== "West Yorkshire") assert.equal(t, "/courses", `${l.slug} (${l.region}) is outside West Yorkshire`);
    else assert.notEqual(t, "/courses", `${l.slug} is in West Yorkshire`);
  }
  // The Pontefract area is an explicit list; every entry is a West Yorkshire town in the data.
  assert.deepEqual([...PONTEFRACT_AREA], ["pontefract", "castleford", "knottingley", "featherstone", "normanton", "hemsworth"]);
  for (const s of PONTEFRACT_AREA) {
    assert.equal(ukLocations.find((l) => l.slug === s)?.region, "West Yorkshire", s);
    assert.equal(targetForLocation(s), PONTEFRACT_PAGE, s);
  }
  for (const s of ["wakefield", "leeds", "bradford", "huddersfield", "halifax", "dewsbury", "ossett", "keighley", "west-yorkshire"]) {
    assert.equal(targetForLocation(s), WEST_YORKSHIRE_PAGE, s);
  }
  for (const s of ["york", "harrogate", "selby", "sheffield", "doncaster", "hull", "yorkshire", "manchester", "london", "no-such-town"]) {
    assert.equal(targetForLocation(s), "/courses", s);
  }
});

test("4. next.config redirects every /<template>/<town> to its target in one permanent hop", async () => {
  const { TEMPLATES, targetForLocation } = await loadRedirects();
  const { ukLocations } = await import("../app/lib/ukLocations.ts");
  const rules = await configRedirects();
  for (const t of TEMPLATES) {
    for (const l of [...ukLocations, { slug: "no-such-town" }]) {
      const r = resolve(rules, `/${t}/${l.slug}`);
      assert.ok(r, `/${t}/${l.slug} is redirected`);
      assert.equal(r.destination, targetForLocation(l.slug), `/${t}/${l.slug}`);
      assert.equal(r.permanent, true, `/${t}/${l.slug} is permanent (308)`);
    }
  }
  // The old chain: /level-3-personal-trainer-course/pontefract used to go via /wakefield.
  assert.equal(resolve(rules, "/level-3-personal-trainer-course/pontefract")?.destination, PONTEFRACT_PAGE);
  assert.equal(resolve(rules, "/level-3-personal-trainer-course/leeds")?.destination, WEST_YORKSHIRE_PAGE);
  assert.equal(resolve(rules, "/Level-3-Personal-Trainer-Course/Leeds")?.destination, WEST_YORKSHIRE_PAGE, "case-insensitive");
});

test("4. bare template paths go to /courses unless the template has its own page", async () => {
  const { TEMPLATES } = await loadRedirects();
  const rules = await configRedirects();
  for (const t of TEMPLATES) {
    const r = resolve(rules, `/${t}`);
    if (pageExists(`/${t}`)) assert.equal(r, null, `/${t} is a real page`);
    else {
      assert.equal(r?.destination, "/courses", `/${t}`);
      assert.equal(r?.permanent, true);
    }
  }
});

test("4. the deleted Wakefield and Leeds local pages go to West Yorkshire", async () => {
  const rules = await configRedirects();
  for (const p of ["/personal-trainer-course-wakefield", "/personal-trainer-course-leeds"]) {
    const r = resolve(rules, p);
    assert.equal(r?.destination, WEST_YORKSHIRE_PAGE, p);
    assert.equal(r?.permanent, true, p);
  }
});

test("4. old-site slug aliases resolve straight to the final page, not via a template", async () => {
  const { SLUG_ALIASES, TEMPLATES, targetForLocation } = await loadRedirects();
  const rules = await configRedirects();
  assert.equal(Object.keys(SLUG_ALIASES).length, 18, "all 18 aliases the middleware used to forward");
  for (const [alias, to] of Object.entries(SLUG_ALIASES)) {
    assert.ok(TEMPLATES.includes(to), `${alias} → ${to} is a template`);
    for (const s of ["pontefract", "leeds", "york", "london"]) {
      assert.equal(resolve(rules, `/${alias}/${s}`)?.destination, targetForLocation(s), `/${alias}/${s}`);
    }
    assert.equal(resolve(rules, `/${alias}`)?.destination, pageExists(`/${to}`) ? `/${to}` : "/courses", `/${alias}`);
  }
});

test("5. every redirect target is a real page and is not itself redirected", async () => {
  const rules = await configRedirects();
  const ours = rules.filter((r) => !r.has);
  assert.ok(ours.length > 0);
  for (const r of ours) {
    assert.ok(pageExists(r.destination), `${r.destination} is a page in app/`);
    assert.equal(resolve(rules, r.destination), null, `${r.source} → ${r.destination} chains`);
    assert.equal(r.permanent, true, `${r.source} is permanent`);
  }
});

test("5. the middleware no longer forwards template URLs (no hub, base-only or alias hop)", async () => {
  const m = stripComments(src("middleware.ts"));
  for (const gone of ["LOCATION_ROUTE_BASES", "BASE_ONLY_REDIRECTS", "SLUG_REDIRECTS", "getHubForLocation", "hubSlugs", "level-3-personal-trainer-course"]) {
    assert.ok(!m.includes(gone), `middleware still has ${gone}`);
  }
  // Old capitalised one-segment URLs (/Paisley) go straight to the final page.
  assert.match(m, /targetForLocation\(/);
  const u = src("app/lib/ukLocations.ts");
  assert.ok(!/hubSlugs|CITY_TO_HUB|getHubForLocation|hubLocations/.test(u), "hub-and-spoke helpers removed");
  const { ukLocations } = await import("../app/lib/ukLocations.ts");
  assert.ok(ukLocations.length > 400, "the location data itself is kept");
});

test("6. the sitemap lists both local pages and no template or redirected URL", async () => {
  const { TEMPLATES } = await loadRedirects();
  const sitemap = (await import("../app/sitemap.ts")).default;
  const rules = await configRedirects();
  const urls = sitemap().map((e) => e.url);
  for (const p of [PONTEFRACT_PAGE, WEST_YORKSHIRE_PAGE]) assert.ok(urls.includes(`${BASE}${p}`), p);
  for (const u of urls) {
    const path = u.slice(BASE.length) || "/";
    const [first, ...rest] = path.slice(1).split("/");
    assert.ok(!(TEMPLATES.includes(first) && rest.length), `${u} is a template URL`);
    assert.equal(resolve(rules, path), null, `${u} is redirected`);
  }
  assert.equal(new Set(urls).size, urls.length, "no duplicates");
});

test("6. llms.txt links no pruned template or redirected URL", async () => {
  const rules = await configRedirects();
  const paths = [...src("public/llms.txt").matchAll(/https:\/\/ptlaunchlab\.co\.uk(\/[^)\s`]*)/g)].map((m) => m[1]);
  assert.ok(paths.length > 5);
  for (const p of paths) if (!p.includes("<")) assert.equal(resolve(rules, p), null, `llms.txt: ${p} is redirected`);
});

// ── Small fixes carried into Task 2 ────────────────────────────────────────

test("Pontefract has its own FAQ: based in Pontefract, with the NAP, the centre and fully online", async () => {
  const { LOCAL_PAGES } = await load();
  const { ADDRESS_ONE_LINE, PHONE_NATIONAL } = await import("../app/lib/contactDetails.ts");
  const f = LOCAL_PAGES.pontefract.faqs.find((x) => x.q === "Is PT Launch Lab based in Pontefract?");
  assert.ok(f, "Pontefract FAQ present");
  assert.equal(f.a, `Yes. PT Launch Lab is based at ${ADDRESS_ONE_LINE} (${PHONE_NATIONAL}). ${CENTRE_SENTENCE} The course itself is fully online.`);
  assert.equal(
    f.a,
    "Yes. PT Launch Lab is based at Unit 3, Royals Business Park, King St, Pontefract WF8 4AH (01977 285014). Ultimate Shred Academy in Pontefract is our own gym and NCFE-approved centre (9002788). The course itself is fully online.",
  );
  assert.ok(!LOCAL_PAGES.westYorkshire.faqs.some((x) => x.q === f.q), "Pontefract only");
  // One NAP answer per page: Pontefract drops the shared one; its own comes first.
  assert.equal(LOCAL_PAGES.pontefract.faqs[0].q, f.q);
  assert.ok(!LOCAL_PAGES.pontefract.faqs.some((x) => x.q === "Where is PT Launch Lab based?"), "no duplicate NAP FAQ on Pontefract");
  assert.ok(LOCAL_PAGES.westYorkshire.faqs.some((x) => x.q === "Where is PT Launch Lab based?"), "West Yorkshire keeps the shared one");
  assert.equal(LOCAL_PAGES.pontefract.faqs.length, 5);
  assert.equal(LOCAL_PAGES.westYorkshire.faqs.length, 5);
  assert.ok(src("app/lib/localPages.ts").includes("${ADDRESS_ONE_LINE} (${PHONE_NATIONAL})"), "built from contactDetails");
});

test("every courseWorkload in app/ is a valid ISO 8601 duration", () => {
  const found: string[] = [];
  for (const f of APP_FILES) {
    for (const m of src(f).matchAll(/courseWorkload:\s*["'`]([^"'`]*)["'`]/g)) {
      found.push(`${f}: ${m[1]}`);
      assert.match(m[1], /^P\d+[DWMY]$/, `${f}: courseWorkload "${m[1]}"`);
    }
  }
  assert.ok(found.length >= 4, found.join("\n"));
});
