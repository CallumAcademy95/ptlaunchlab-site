import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const ironwolfGym: GymConfig = {
  // ── Identity
  gymName: "Iron Wolf Gym",
  gymSlug: "ironwolf",       // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  logoUrl: "/logos/iron-wolf-gym-white.png",
  logoAlt: "Iron Wolf Gym Goole",

  // ── Branding — Iron Wolf brand: Black, White, Vivid Orange #f15927
  primaryColor: "#f15927",
  sectionBg: "#0A0A0A",
  heroBg: "#000000",

  // ── Hero copy
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At Iron Wolf Gym,\nGoole",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Goole",

  // ── Positioning
  positioningSubline: "Built inside Goole's strength-first gym, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Iron Wolf Gym",
  gymIntro: "Forged in strength. Driven by grit. Learn in a real gym, with real lifters, in a proper training environment.",

  // ── Why this gym (4 stat boxes)
  stats: [
    { value: "New",      label: "Bigger Goole facility (2025)" },
    { value: "Strength", label: "Athlete's paradise" },
    { value: "5★",       label: "Member rated" },
    { value: "All",      label: "Levels — beginners to athletes" },
  ],

  // ── Why this gym (bullet list)
  gymHighlights: [
    "Brand-new bigger facility in Goole — built for serious strength training",
    "A strength athlete's paradise — proper equipment, proper standards",
    "Community-first — grit, loyalty, and no-nonsense training",
    "All levels welcome, from total beginners to competing athletes",
    "Authentic gym vibe — not a class factory, not a chain",
    "Train and learn in the kind of gym you should be coaching in",
  ],

  // ── SEO
  metaTitle: "Iron Wolf PT Academy | Become a Qualified Personal Trainer at Iron Wolf Gym, Goole",
  metaDescription:
    "Train, qualify, and earn at Iron Wolf Gym in Goole. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included. Introduction guarantee on qualifying.",
  canonicalPath: "/ironwolf-gym",
};
