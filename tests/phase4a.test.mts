// Phase 4a: site-wide SEO fixes.
// Spec: docs/superpowers/specs/2026-10-13-ptlaunchlab-phase4a-seo-sitewide-design.md
//   1. No review count anywhere (visible badges or JSON-LD); reviews links go
//      to the Google Business Profile, not a Google search.
//   2. GOOGLE_PROFILE_URL is in the Organization/LocalBusiness sameAs.
//   3. Name, address and phone in every footer.
//   4. No "Yorkshire workshops" claims.
//   5. Keyword titles on the six listed pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
// Namespace / dynamic imports so a missing export or module fails its own test
// rather than the whole file.
import * as contact from "../app/lib/contactDetails.ts";
import * as pricing from "../app/lib/pricing.ts";

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

const NAP_ADDRESS = "Unit 3, Royals Business Park, King St, Pontefract WF8 4AH";
const PROFILE = "https://share.google/HnzgdMk7ijjYp8S0k";

// ── 1. Review counts ──────────────────────────────────────────────────────

const BANNED: [RegExp, string][] = [
  [/reviewCount/, "reviewCount"],
  [/AggregateRating/i, "AggregateRating"],
  [/\b17 Reviews\b/i, "17 Reviews"],
  [/\b19 Verified\b/i, "19 Verified"],
  [/\b\d+\s+(?:verified\s+)?(?:google\s+)?reviews\b/i, "<n> (Verified) (Google) Reviews"],
  [/Yorkshire Workshops/i, "Yorkshire Workshops"],
  [/workshops?\s+(?:in|across|around)\s+Yorkshire/i, "workshops in Yorkshire"],
  [/google\.com\/search\?q=pt\+launch\+lab[^"'\s]*reviews/i, "Google search reviews link"],
];

test("no review count, AggregateRating, workshop claim or reviews search link anywhere in app/", () => {
  const hits: string[] = [];
  for (const f of APP_FILES) {
    const body = stripComments(src(f));
    for (const [re, label] of BANNED) if (re.test(body)) hits.push(`${f}: ${label}`);
  }
  assert.deepEqual(hits, []);
});

test("GOOGLE_PROFILE_URL is the one exported profile link", () => {
  assert.equal((contact as Record<string, unknown>).GOOGLE_PROFILE_URL, PROFILE);
  // Only contactDetails.ts spells the URL out; everything else imports it.
  const spelled = APP_FILES.filter((f) => f !== "app/lib/contactDetails.ts" && src(f).includes("share.google/"));
  assert.deepEqual(spelled, []);
});

test("reviews links point at the Google profile", () => {
  for (const f of ["app/components/Reviews.tsx", "app/funnel/FunnelClient.tsx"]) {
    const s = src(f);
    assert.match(s, /GOOGLE_PROFILE_URL/, `${f} imports GOOGLE_PROFILE_URL`);
    assert.match(s, /href=\{GOOGLE_PROFILE_URL\}/, `${f} links to the profile`);
  }
});

test("rating badges read as a Google rating with no number of reviews", () => {
  for (const f of ["app/components/Reviews.tsx", "app/funnel/FunnelClient.tsx", "app/whatsapp/page.tsx"]) {
    assert.match(src(f), /Google rating/, `${f} says "Google rating"`);
  }
});

// ── 2. sameAs and JSON-LD ─────────────────────────────────────────────────

const roundTrip = (o: unknown) => JSON.parse(JSON.stringify(o));

// A page's JSON-LD object literal sits in a .tsx file, which Node cannot
// import. Evaluate the literal with the real pricing constants it references,
// then round-trip it through JSON so a non-JSON value fails the parse.
function pageLiteral(file: string, name: string) {
  const p = src(file);
  const marker = `const ${name} = `;
  const start = p.indexOf(marker);
  assert.ok(start > -1, `${file}: ${name} found`);
  const end = p.indexOf("\n};\n", start);
  const literal = p.slice(start + marker.length, end + 2);
  const names = Object.keys(pricing);
  const obj = new Function(...names, `return (${literal});`)(...names.map((n) => (pricing as Record<string, unknown>)[n]));
  return roundTrip(obj);
}

test("site JSON-LD parses, carries the profile in sameAs and the exact address", async () => {
  const { siteSchema } = await import("../app/lib/siteSchema.ts");
  const graph = roundTrip(siteSchema)["@graph"] as Record<string, unknown>[];
  const org = graph.find((n) => n["@type"] === "EducationalOrganization")!;
  const local = graph.find((n) => n["@type"] === "LocalBusiness")!;
  assert.ok(org && local);
  assert.ok((org.sameAs as string[]).includes(PROFILE), "Organization sameAs has the profile");
  assert.ok((org.sameAs as string[]).includes("https://www.youtube.com/@ptlaunchlab"));
  assert.ok((local.sameAs as string[]).includes(PROFILE), "LocalBusiness sameAs has the profile");
  for (const n of [org, local]) {
    const a = n.address as Record<string, string>;
    assert.equal(a.streetAddress, "Unit 3, Royals Business Park, King St");
    assert.equal(a.addressLocality, "Pontefract");
    assert.equal(a.postalCode, "WF8 4AH");
    assert.doesNotMatch(JSON.stringify(n), /aggregateRating|reviewCount/i);
  }
  assert.match(src("app/layout.tsx"), /JSON\.stringify\(siteSchema\)/, "layout renders siteSchema");
});

test("/courses Course JSON-LD parses, has no rating or Review objects, prices unchanged", () => {
  const c = pageLiteral("app/courses/page.tsx", "courseSchema");
  assert.equal(c["@type"], "Course");
  assert.equal(c.aggregateRating, undefined);
  assert.equal(c.review, undefined);
  assert.equal(c.offers[0].price, (pricing.COURSE_PRICE_PENCE / 100).toFixed(2));
  assert.equal(c.offers[1].price, (pricing.MONTHLY_PLAN_TOTAL_PENCE / 100).toFixed(2));
  assert.match(src("app/courses/page.tsx"), /JSON\.stringify\(courseSchema\)/);
});

test("home page FAQPage JSON-LD is a valid JSON object", () => {
  // The home page's own JSON-LD; the site graph on every page is checked above.
  const parsed = pageLiteral("app/page.tsx", "faqSchema");
  assert.equal(parsed["@type"], "FAQPage");
  assert.ok(parsed.mainEntity.length > 0);
});

test("/about JSON-LD carries the full address, phone and the profile, and no rating", () => {
  const s = src("app/about/page.tsx");
  assert.match(s, /streetAddress: "Unit 3, Royals Business Park, King St"/);
  assert.match(s, /postalCode: "WF8 4AH"/);
  assert.match(s, /telephone: PHONE_SCHEMA/);
  assert.match(s, /GOOGLE_PROFILE_URL/);
});

// ── 3. NAP in every footer ────────────────────────────────────────────────

test("ADDRESS_ONE_LINE and PHONE_NATIONAL match the Google Business Profile", () => {
  assert.equal(contact.ADDRESS_ONE_LINE, NAP_ADDRESS);
  assert.equal(contact.PHONE_NATIONAL, "01977 285014");
});

test("NapLine renders name, address and a tel: phone link", () => {
  const s = src("app/components/NapLine.tsx");
  assert.match(s, /PT Launch Lab · \{ADDRESS_ONE_LINE\} · /);
  assert.match(s, /href=\{`tel:\$\{PHONE_TEL\}`\}/);
  assert.match(s, /\{PHONE_NATIONAL\}/);
});

test("every footer renders the NAP line", () => {
  for (const f of ["app/components/Footer.tsx", "app/components/GymAcademyPage.tsx", "app/funnel/FunnelClient.tsx", "app/components/cold/ColdLanding.tsx"]) {
    const s = src(f);
    assert.match(s, /^import NapLine from /m, `${f} imports NapLine`);
    assert.match(s, /<NapLine\b/, `${f} footer renders <NapLine>`);
  }
});

// ── 5. Titles ─────────────────────────────────────────────────────────────

const TITLE_PAGES = [
  "app/page.tsx",
  "app/courses/page.tsx",
  "app/best-personal-trainer-course-uk/page.tsx",
  "app/online-personal-trainer-course-uk/page.tsx",
  "app/how-to-become-a-personal-trainer-uk/page.tsx",
  "app/personal-trainer-course-near-me/page.tsx",
];

const titleOf = (f: string) => {
  const m = src(f).match(/export const metadata[^=]*=\s*\{\s*\n\s*title:\s*"([^"]+)"/);
  assert.ok(m, `${f}: top-level metadata title found`);
  return m[1];
};

test("listed pages' titles carry the keyword and fit in 65 characters", () => {
  const titles = TITLE_PAGES.map(titleOf);
  for (const [i, t] of titles.entries()) {
    assert.match(t, /Personal Trainer Course/i, `${TITLE_PAGES[i]}: "${t}"`);
    assert.match(t, /Level 3|NCFE/, `${TITLE_PAGES[i]}: "${t}"`);
    assert.ok(t.length <= 65, `${TITLE_PAGES[i]}: ${t.length} chars "${t}"`);
  }
  assert.equal(new Set(titles).size, titles.length, "titles are unique");
});

// ── Fix round: uniform badges, address in emails, one org ────────────────

test("rating badges use the uniform wording, never 'Google reviews'", () => {
  const hits: string[] = [];
  for (const f of APP_FILES) {
    const body = stripComments(src(f));
    if (/5\.0★ Google Reviews|Verified Google reviews|based on Google reviews|Google review rating/i.test(body)) hits.push(f);
  }
  assert.deepEqual(hits, []);
  assert.match(src("app/components/cold/ColdLanding.tsx"), /"5\.0★ Google rating"/);
  assert.match(src("app/book-call/BookCallPage.tsx"), /5\.0★ Google rating/);
  assert.match(src("app/courses/page.tsx"), /\{ value: "5\.0★", label: "Google rating" \}/);
  assert.match(src("app/graduates/page.tsx"), /· Google rating/);
});

test("partner email footers print ADDRESS_ONE_LINE, not a hardcoded address", () => {
  const files = [
    "app/admin/(shell)/partners/actions.ts",
    "app/api/gym-partnership/sign/route.ts",
    "app/api/mentor-partnership/sign/route.ts",
    "app/lib/partner-password-reset.ts",
  ];
  for (const f of files) {
    const s = src(f);
    assert.match(s, /PT Launch Lab · \$\{ADDRESS_ONE_LINE\}/, `${f} uses ADDRESS_ONE_LINE`);
    assert.doesNotMatch(s, /Royals Business Park|Pontefract WF8/, `${f} has no hardcoded address`);
  }
  // Legal agreement text is deliberately left as written.
  const legal = new Set(["app/lib/partnershipAgreement.ts", "app/lib/mentorPartnerAgreement.ts", "app/lib/contactDetails.ts", "app/lib/siteSchema.ts", "app/about/page.tsx", "app/contact/page.tsx"]);
  const stray = APP_FILES.filter((f) => !legal.has(f) && /Royals Business Park, Pontefract/.test(src(f)));
  assert.deepEqual(stray, []);
});

test("/about JSON-LD is the same org (#org) with the shared geo", async () => {
  const s = src("app/about/page.tsx");
  assert.match(s, /"@type": "EducationalOrganization",\n\s*(?:\/\/.*\n\s*)*"@id": "https:\/\/ptlaunchlab\.co\.uk\/#org"/);
  assert.match(s, /geo: GEO,/);
  assert.match(s, /import \{ GEO \} from "@\/app\/lib\/siteSchema"/);
  assert.doesNotMatch(s, /latitude:|longitude:/);
  const { GEO, siteSchema } = await import("../app/lib/siteSchema.ts");
  const local = (siteSchema["@graph"] as Record<string, unknown>[]).find((n) => n["@type"] === "LocalBusiness")!;
  assert.deepEqual(local.geo, GEO);
});

test("how-to title reads naturally", () => {
  assert.equal(titleOf("app/how-to-become-a-personal-trainer-uk/page.tsx"), "How to Become a PT in the UK | NCFE Personal Trainer Course");
});
