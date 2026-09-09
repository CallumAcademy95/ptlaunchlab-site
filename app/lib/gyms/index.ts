// ─── Gym Partner Registry ─────────────────────────────────────────────────────
// Single source of truth mapping a partner's ROUTE slug to its GymConfig.
//
// The route slug is the folder name under app/ and matches `canonicalPath`
// — e.g. "ebor-fitness" -> /ebor-fitness.
//
// ⚠ The route slug is NOT the gym slug used for commission attribution.
//   Route "ebor-fitness"            -> gymSlug "ebor"
//   Route "hitio-orpington-academy" -> gymSlug "hitio-orpington"
//   Commission joins on gymSlug, set on each partner's /enrol page. Never
//   join on the route slug or the display name.
//
// `_gym-template` is deliberately absent — it holds placeholder data, not a
// real partner, and must never render an embed card.
// ─────────────────────────────────────────────────────────────────────────────

// Relative imports carry the .ts extension so tests/ can import this registry
// under Node's own type stripping (see allowImportingTsExtensions in tsconfig).
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

import { sixFitAcademy } from "./6fit-academy.ts";
import { eborFitness } from "./ebor-fitness.ts";
import { gymNGoAcademy } from "./gym-n-go-academy.ts";
import { hitioOrpingtonAcademy } from "./hitio-orpington-academy.ts";
import { ironwolfGym } from "./ironwolf-gym.ts";
import { mofGym } from "./mof-gym.ts";
import { muscleBoundAcademy } from "./muscle-bound-academy.ts";
import { superflexAcademy } from "./superflex-academy.ts";
import { xcelerateAcademy } from "./xcelerate-academy.ts";
import { demoAcademy } from "./demo-academy.ts";

export const GYMS: Record<string, GymConfig> = {
  "6fit-academy": sixFitAcademy,
  "ebor-fitness": eborFitness,
  "gym-n-go-academy": gymNGoAcademy,
  "hitio-orpington-academy": hitioOrpingtonAcademy,
  "ironwolf-gym": ironwolfGym,
  "mof-gym": mofGym,
  "muscle-bound-academy": muscleBoundAcademy,
  "superflex-academy": superflexAcademy,
  "xcelerate-academy": xcelerateAcademy,
  "demo-academy": demoAcademy,
};

/** Every partner route slug. Drives generateStaticParams for /embed/[gym]. */
export const GYM_SLUGS = Object.keys(GYMS);

/** Config for a route slug, or undefined when the slug is not a partner. */
export function getGym(slug: string): GymConfig | undefined {
  return GYMS[slug];
}
