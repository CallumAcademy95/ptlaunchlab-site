// ─────────────────────────────────────────────────────────────────────────────
// DEMO ACADEMY PAGE
//
// Not a real gym. This exists so the demo partner portal has a working academy
// link and a QR code that actually scans, for walkthrough videos shown to
// prospective partners.
//
// Northgate Strength is invented. If a real gym ever takes that name, rename
// this — a prospect who Googles it should find nothing, not somebody else.
//
// Deliberately noindex: it is a sales prop, and it would compete with the real
// gym pages for the same search terms.
// ─────────────────────────────────────────────────────────────────────────────

import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const demoAcademy: GymConfig = {
  gymName: "Northgate Strength",
  gymSlug: "demo",       // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  logoUrl: "/logos/ultimate-shred.png",
  logoAlt: "Northgate Strength",

  primaryColor: "#F5C518",
  darkAccent: "#F5C518",
  heroBg: "#0B1F38",

  heroHeadline: ["Become a Qualified", "Personal Trainer", "Inside Northgate Strength"],
  heroSubline: "Train. Qualify. Earn.",

  positioningSubline: "Built inside Northgate Strength, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Northgate Strength",

  stats: [
    { value: "1,200", label: "Members" },
    { value: "4.9★", label: "Member rated" },
    { value: "18", label: "Coaches on the floor" },
    { value: "24/7", label: "Access" },
  ],

  gymHighlights: [
    "Independent gym, open since 2014",
    "Dedicated strength and conditioning floor",
    "Premium equipment: Eleiko, Rogue, Watson",
    "A real coaching environment, not a warehouse",
  ],

  metaTitle: "Northgate Strength PT Academy | Demo",
  metaDescription:
    "Demonstration academy page used for partner walkthroughs. Northgate Strength is not a real gym.",
  canonicalPath: "/demo-academy",
};
