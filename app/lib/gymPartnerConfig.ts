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

  // ── Discount
  showDiscount?: boolean;    // defaults to true — set false to hide all discount UI
  promoCode?: string;        // e.g. "6FITPTDISCOUNT"
  discountAmount?: number;   // e.g. 200
  fullPrice: number;         // Full price (discounted if showDiscount true, else standard)
  depositPrice: number;      // Deposit price

  // ── Stripe
  stripeFullLink: string;
  stripeDepositLink: string;

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
