// ─── Gym Partner Config ───────────────────────────────────────────────────────
// One config object per gym partner. Pass to GymAcademyPage + GymAcademyEnrol.
// ─────────────────────────────────────────────────────────────────────────────

export interface GymConfig {
  // ── Identity
  gymName: string;           // e.g. "6fit Gyms"
  logoUrl: string;           // External logo URL or /public path
  logoAlt?: string;          // Alt text (defaults to gymName)

  // ── Branding
  primaryColor: string;      // e.g. "#ed0000"
  heroBg?: string;           // Hero background color (defaults to "#000000")

  // ── Hero copy
  heroHeadline: string[];    // Each string = one line of the h1 (last line gets primaryColor)
  heroSubline?: string;      // e.g. "Train. Qualify. Earn."
  location?: string;         // e.g. "Bradford's best gym"

  // ── Discount
  promoCode: string;         // e.g. "6FITPTDISCOUNT"
  discountAmount: number;    // e.g. 200
  fullPrice: number;         // Discounted full price e.g. 1399
  depositPrice: number;      // Discounted deposit e.g. 599

  // ── Stripe
  stripeFullLink: string;
  stripeDepositLink: string;

  // ── Positioning section — required, gym-specific copy
  positioningSubline: string;   // under "This Is The X PT Academy" heading
  whyThisGymHeading: string;    // h2 above the stats strip

  // ── Why this gym (stats strip)
  stats: { value: string; label: string }[];

  // ── Why this gym (bullet list)
  gymHighlights: string[];

  // ── SEO
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;     // e.g. "/6fit-academy"
}
