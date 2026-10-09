// ─── Gym Partner Config ───────────────────────────────────────────────────────
// One config object per gym partner. Pass to GymAcademyPage + GymAcademyEnrol.
// ─────────────────────────────────────────────────────────────────────────────

export interface GymConfig {
  // ── Identity
  gymName: string;           // e.g. "6fit Gyms"
  logoUrl: string;           // External logo URL or /public path
  logoAlt?: string;          // Alt text (defaults to gymName)
  // Set BOTH for a wide wordmark logo — it then renders at a fixed height with
  // width auto, instead of being forced into the default 52×52 square. Square
  // marks should omit these and keep the original rounded-tile treatment.
  logoWidth?: number;        // intrinsic px width of the asset
  logoHeight?: number;       // intrinsic px height of the asset

  // ── Branding
  primaryColor: string;      // Accent for light backgrounds (buttons, check marks on white sections)
  darkAccent?: string;       // Accent for dark backgrounds (hero text, dark-section checks). Defaults to primaryColor
  sectionBg?: string;        // Full-bleed section backgrounds (defaults to primaryColor)
  heroBg?: string;           // Hero background color (defaults to "#000000")

  // ── Hero copy
  heroHeadline: string[];    // Each string = one line of the h1 (last line gets primaryColor)
  heroSubline?: string;      // e.g. "Train. Qualify. Earn."
  location?: string;         // e.g. "Bradford's best gym"

  // ── Pricing
  // Deliberately absent. Every gym sells the same two plans at the same prices
  // (app/lib/pricing.ts): £999.99 in full or 10 × £99.99 a month. No promo
  // code, member discount, "was" price or per-gym Stripe link — partner
  // attribution is gym_slug in checkout metadata from the gym's own enrol page.

  // ── Positioning section — required, gym-specific copy
  positioningSubline: string;   // under "This Is The X PT Academy" heading
  whyThisGymHeading: string;    // h2 above the stats strip
  gymIntro?: string;            // optional line under "Not a classroom. Not just videos."

  // ── Why this gym (stats strip)
  stats: { value: string; label: string }[];

  // ── Why this gym (bullet list)
  gymHighlights: string[];

  // ── SEO
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;     // e.g. "/6fit-academy"
}
