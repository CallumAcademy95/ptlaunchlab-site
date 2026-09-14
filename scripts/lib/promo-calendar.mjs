// scripts/lib/promo-calendar.mjs
/**
 * The monthly promo calendar, as data.
 *
 * Same split, and the same reason, as ad-concepts.mjs: the copy for 9 gyms is
 * gated by `npm run test:unit` before Chrome ever launches.
 *
 * October reveals something the course already includes. November is the only
 * money month of the two, and the only point in the year the price starts with
 * a 9 -- which is what stops January, April and September cannibalising it.
 *
 * Discounts land on pay-in-full only. Stripe takes ONE promotion code, so a
 * month code REPLACES the standing £200 rather than stacking with it: £600 off
 * the £1,599 list is £999, not £1,399 - £600.
 */
import { conceptText, allConceptStrings } from "./ad-concepts.mjs";
import { tokensForGym } from "../../app/lib/partner-playbook-tokens.ts";

export const MONTHS = [
  {
    key: "oct",
    label: "Success Story Month",
    belief: "B2",
    offerType: "reveal",
    discountPence: null,
    codeSuffix: null,
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["TWO QUALIFICATIONS.", "ONE COURSE."],
    accentLine: "LEVEL 2 AND LEVEL 3.",
    sub: "The NCFE Level 2 Certificate in Gym Instructing and the Level 3 Certificate in Personal Training, studied at {{gymName}}.",
    footer: "Next intake open",
  },
  {
    key: "nov",
    label: "Black Friday",
    belief: "all",
    offerType: "money",
    discountPence: 60_000,
    codeSuffix: "BF600",
    // Every money month's codes must expire and be capped -- SUMMER500PTLL is
    // the precedent for what "archive it later" means in practice, i.e.
    // nothing, indefinitely. mint-month-codes.mts reads this and refuses to
    // mint a money month that has none, rather than defaulting to "forever".
    // ISO 8601 UTC so a human reads it directly; the minter converts to the
    // Unix seconds Stripe's API wants.
    expiresAt: "2026-12-01T00:00:00Z",
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["BLACK FRIDAY", "£999 PAID IN FULL"],
    accentLine: "NORMALLY £1,399.",
    sub: "Level 2 and Level 3 Personal Training at {{gymName}}. Pay-in-full price, Black Friday only.",
    footer: "Code {{monthCode}}",
  },
];

/**
 * Which of a gym's prefixes its month codes are minted under.
 *
 * Iron Wolf and Muscle Bound each carry TWO prefixes: their standing codes are
 * IWGPTDISCOUNT and MBGPTDISCOUNT, but their launch codes were IRONWOLF500 and
 * MUSCLEBOUND500. Month codes follow the launch convention. A code minted under
 * a prefix the validator does not hold for that gym is refused on the site --
 * which is exactly what happened to HITIO500 and HITIO300.
 */
/** @type {Record<string, string>} */
export const MONTH_CODE_PREFIX = {
  "6fit": "6FIT",
  ebor: "EBOR",
  "gym-n-go": "GYMNGO",
  "hitio-orpington": "HITIO",
  ironwolf: "IRONWOLF",
  mof: "MOF",
  "muscle-bound": "MUSCLEBOUND",
  superflex: "SUPERFLEX",
  xcelerate: "XCELERATE",
};

/** The gym's code for a month, or null if that month is not a money month. */
export function monthCodeFor(slug, monthKey) {
  const month = MONTHS.find((m) => m.key === monthKey);
  if (!month?.codeSuffix) return null;
  const prefix = MONTH_CODE_PREFIX[slug];
  if (!prefix) throw new Error(`no month-code prefix for gym: ${slug}`);
  return `${prefix}${month.codeSuffix}`;
}

/** Gym tokens plus the month's own code. */
export function tokensForMonth(brand, origin, slug, monthKey) {
  return { ...tokensForGym(brand, origin), monthCode: monthCodeFor(slug, monthKey) };
}

/**
 * The {{token}} name a money month's own code is addressed by in the
 * PARTNER PORTAL (as opposed to the graphics renderer, which scopes to one
 * month at a time via tokensForMonth and can safely reuse the generic
 * {{monthCode}} name above). Derived from codeSuffix rather than hand-picked
 * per month -- "BF600" -> "bfCode" -- so a future money month gets a token
 * name the moment it is added to MONTHS, with nothing extra to remember.
 */
export function codeTokenName(month) {
  const letters = month.codeSuffix.replace(/[^A-Za-z]/g, "").toLowerCase();
  return `${letters}Code`;
}

/**
 * Tokens for the partner portal.
 *
 * The portal (app/partners/(portal)/playbook/page.tsx) renders every playbook
 * entry -- every month -- on one page for one partner, unlike the graphics
 * renderer which handles one month at a time. A single generic {{monthCode}}
 * would be ambiguous across entries and actively dangerous: October's
 * reveal-month entry has no code of its own, so it would silently inherit
 * whichever money month's code happened to be computed. Instead every MONEY
 * month gets its own uniquely-named token (see codeTokenName), built straight
 * off MONTHS so a future money month is included automatically -- the one
 * thing left to remember is using that token in the month's own markdown,
 * and tests/brandLeaks.test.mts's unresolved-token check (run through this
 * same function) catches the day that is forgotten.
 *
 * `demo` carries no entry in MONTH_CODE_PREFIX (nothing mints it a real
 * Stripe code), so its money-month tokens resolve to null rather than
 * throwing -- applyPlaybookTokens leaves the placeholder visible for the
 * preview tenant exactly as it already does for {{promoCode}}, rather than
 * 500ing the portal for whoever is looking at the demo account.
 */
export function tokensForPortal(brand, origin, slug) {
  const tokens = { ...tokensForGym(brand, origin) };
  for (const month of MONTHS) {
    if (month.offerType !== "money") continue;
    tokens[codeTokenName(month)] = MONTH_CODE_PREFIX[slug] ? monthCodeFor(slug, month.key) : null;
  }
  return tokens;
}

export const monthText = conceptText;
export const allMonthStrings = allConceptStrings;
