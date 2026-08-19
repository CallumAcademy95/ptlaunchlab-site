// scripts/lib/ad-concepts.mjs
/**
 * The two ad concepts, as data.
 *
 * Kept apart from the renderer so the copy can be gated by `npm run test:unit`
 * without launching Chrome — the claim gate and the white-label rule matter
 * most before 36 files exist, not after.
 *
 * Every string is education language. Nothing here offers work, an introduction
 * or an interview: the v3.0 agreement makes the gym "solely as a distribution
 * and referral partner", and job-offer framing risks Meta's Employment Special
 * Ad Category, whose 15km minimum radius would destroy the local targeting.
 */
import { applyPlaybookTokens } from "../../app/lib/partner-playbook-tokens.ts";

export const SIZES = [
  { w: 1080, h: 1080 },
  { w: 1080, h: 1920 },
];

export const CONCEPTS = [
  {
    id: "already-here",
    label: "You're already here",
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["YOU'RE ALREADY HERE", "FIVE DAYS A WEEK."],
    accentLine: "QUALIFY WHILE YOU TRAIN.",
    sub: "A nationally recognised Level 3 Personal Training qualification, studied at {{gymName}}.",
    footer: "Next intake open",
  },
  {
    id: "local",
    label: "Without leaving town",
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["QUALIFY AS A", "PERSONAL TRAINER"],
    accentLine: "WITHOUT LEAVING {{town}}.",
    sub: "A nationally recognised Level 3 qualification, delivered at {{gymName}}.",
    footer: "Next intake open",
  },
];

/** Every field of a concept with the gym's own details substituted in. */
export function conceptText(concept, tokens) {
  const t = (s) => applyPlaybookTokens(s, tokens);
  return {
    eyebrow: t(concept.eyebrow).toUpperCase(),
    headline: concept.headline.map(t),
    accentLine: t(concept.accentLine).toUpperCase(),
    sub: t(concept.sub),
    footer: t(concept.footer),
  };
}

/** Flat list of every user-visible string, for the gates to scan. */
export function allConceptStrings(concept, tokens) {
  const text = conceptText(concept, tokens);
  return [text.eyebrow, ...text.headline, text.accentLine, text.sub, text.footer];
}
