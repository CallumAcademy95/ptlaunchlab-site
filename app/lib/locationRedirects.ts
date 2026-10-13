// Permanent redirects for the pruned templated location routes (Phase 4b).
// Spec: docs/superpowers/specs/2026-10-13-ptlaunchlab-phase4b-local-pages-design.md §2
//
// The 31 `app/<template>/[location]` routes were near-duplicate doorway pages
// and are gone. Every old URL now goes, in ONE permanent (308) hop, to the
// nearest real page:
//   - the Pontefract area                      → /personal-trainer-course-pontefract
//   - the rest of West Yorkshire               → /personal-trainer-course-west-yorkshire
//   - everywhere else (incl. North/South/East
//     Yorkshire and unknown slugs)             → /courses
//   - a bare /<template> with no page of its own → /courses
//
// Region membership comes from the `region` field in ukLocations; the
// Pontefract area is an explicit list (the data has no district field).
// next.config.ts spreads locationRedirects() into its redirects; the middleware
// uses targetForLocation() for old capitalised one-segment URLs (/Paisley).
// tests/phase4b.test.mts guards all of this.
//
// A plain .ts module (relative imports carry .ts) so the tests can import it.

import { ukLocations } from "./ukLocations.ts";

export const PONTEFRACT_PAGE = "/personal-trainer-course-pontefract";
export const WEST_YORKSHIRE_PAGE = "/personal-trainer-course-west-yorkshire";
export const COURSES_PAGE = "/courses";

export type LocationTarget = typeof PONTEFRACT_PAGE | typeof WEST_YORKSHIRE_PAGE | typeof COURSES_PAGE;

/** Every route base that had a `[location]` segment. */
export const TEMPLATES = [
  "accredited-personal-trainer-course",
  "become-a-personal-trainer-online",
  "become-a-qualified-personal-trainer",
  "best-online-personal-trainer-course",
  "best-personal-trainer-course-uk",
  "career-change-personal-trainer",
  "fast-track-personal-trainer-course",
  "flexible-personal-trainer-course",
  "gym-floor-personal-trainer",
  "how-to-become-a-personal-trainer",
  "hybrid-personal-trainer",
  "level-2-3-personal-training",
  "level-3-gym-instructing-and-personal-training-diploma",
  "level-3-personal-trainer-course",
  "ncfe-level-3-pt-qualification",
  "ofqual-regulated-personal-trainer-course",
  "online-coaching-course",
  "online-personal-training-course",
  "online-pt-qualification-uk",
  "personal-trainer-certification",
  "personal-trainer-course-with-business-support",
  "personal-trainer-courses-online-uk",
  "personal-trainer-diploma",
  "personal-trainer-qualification-recognised-by-uk-gyms",
  "personal-training-course-with-business-support",
  "personal-training-course-with-mentorship",
  "pt-course",
  "pt-course-payment-plan",
  "pt-courses-with-business-training",
  "quit-9-5-become-a-personal-trainer",
  "start-your-own-personal-training-business",
];

/** Templates that also have a real page at the bare path; those bare paths stay live. */
export const TEMPLATES_WITH_OWN_PAGE = [
  "best-personal-trainer-course-uk",
  "personal-trainer-course-with-business-support",
];

/**
 * Old-site first segments (previously forwarded by the middleware) and the
 * template each one became. They now resolve straight to the final page.
 */
export const SLUG_ALIASES: Record<string, string> = {
  "personal-trainer-courses":                     "level-3-personal-trainer-course",
  "personal-training-courses":                    "level-3-personal-trainer-course",
  "personal-trainer-course":                      "personal-trainer-course-with-business-support",
  "flexible-personal-trainer-course-uk":          "flexible-personal-trainer-course",
  "best-online-personal-trainer-course-uk":       "best-online-personal-trainer-course",
  "pt-course-payment-plan-uk":                    "pt-course-payment-plan",
  "pt-courses":                                   "pt-course",
  "online-personal-trainer":                      "online-personal-training-course",
  "ncfe-level-3-personal-training-course":        "ncfe-level-3-pt-qualification",
  "become-a-qualified-personal-trainer-uk":       "become-a-qualified-personal-trainer",
  "how-to-become-an-online-personal-trainer":     "how-to-become-a-personal-trainer",
  "how-to-become-a-personal-trainer-uk-online":   "how-to-become-a-personal-trainer",
  "change-career-to-fitness-uk":                  "career-change-personal-trainer",
  "online-pt-qualification":                      "online-pt-qualification-uk",
  "personal-trainer-courses-for-career-change":   "career-change-personal-trainer",
  "start-your-own-personal-training-business-uk": "start-your-own-personal-training-business",
  "pt-courses-that-include-business-training":    "pt-courses-with-business-training",
  "personal-training-course-business-support":    "personal-training-course-with-business-support",
};

/**
 * Wakefield-district towns east of Wakefield, nearest Pontefract. Explicit
 * because ukLocations has a county (`region`) but no district.
 */
export const PONTEFRACT_AREA = ["pontefract", "castleford", "knottingley", "featherstone", "normanton", "hemsworth"] as const;

const WEST_YORKSHIRE_SLUGS = ukLocations
  .filter((l) => l.region === "West Yorkshire" && !(PONTEFRACT_AREA as readonly string[]).includes(l.slug))
  .map((l) => l.slug);

/** The page an old /<template>/<slug> URL now belongs to. Unknown slugs → /courses. */
export function targetForLocation(slug: string): LocationTarget {
  const s = slug.toLowerCase();
  if ((PONTEFRACT_AREA as readonly string[]).includes(s)) return PONTEFRACT_PAGE;
  if (WEST_YORKSHIRE_SLUGS.includes(s)) return WEST_YORKSHIRE_PAGE;
  return COURSES_PAGE;
}

export type Redirect = { source: string; destination: string; permanent: true };

const alt = (xs: readonly string[]) => xs.join("|");

/**
 * next.config redirects. Order matters (first match wins): the two named
 * groups first, then the per-template catch-all, then bare paths. Regex
 * groups keep this to a handful of rules rather than one per town.
 */
export function locationRedirects(): Redirect[] {
  const bases = alt([...TEMPLATES, ...Object.keys(SLUG_ALIASES)]);
  const rules: Redirect[] = [
    { source: `/:base(${bases})/:location(${alt(PONTEFRACT_AREA)})`, destination: PONTEFRACT_PAGE, permanent: true },
    { source: `/:base(${bases})/:location(${alt(WEST_YORKSHIRE_SLUGS)})`, destination: WEST_YORKSHIRE_PAGE, permanent: true },
    { source: `/:base(${bases})/:location`, destination: COURSES_PAGE, permanent: true },
    {
      source: `/:base(${alt(TEMPLATES.filter((t) => !TEMPLATES_WITH_OWN_PAGE.includes(t)))})`,
      destination: COURSES_PAGE,
      permanent: true,
    },
    // The Task 1 Wakefield and Leeds pages, merged into West Yorkshire.
    { source: "/personal-trainer-course-wakefield", destination: WEST_YORKSHIRE_PAGE, permanent: true },
    { source: "/personal-trainer-course-leeds", destination: WEST_YORKSHIRE_PAGE, permanent: true },
  ];
  // Bare old-site aliases: straight to the template's own page, or /courses.
  for (const [alias, to] of Object.entries(SLUG_ALIASES)) {
    rules.push({
      source: `/${alias}`,
      destination: TEMPLATES_WITH_OWN_PAGE.includes(to) ? `/${to}` : COURSES_PAGE,
      permanent: true,
    });
  }
  return rules;
}
