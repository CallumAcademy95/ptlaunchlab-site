// ─────────────────────────────────────────────────────────────────────────────
// GYM PARTNER LANDING PAGE TEMPLATE
//
// HOW TO ADD A NEW GYM:
// 1. Duplicate this folder: app/_gym-template → app/[gym-slug]
//    e.g. app/ultimate-shred-academy
// 2. Fill in the config object below with the gym's details
// 3. Duplicate app/_gym-template/enrol/page.tsx → app/[gym-slug]/enrol/page.tsx
//    and fill in the PartnerConfig (gymSlug + display name — no prices or codes)
// 4. Deploy — that's it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  // ── Identity
  gymName: "GYM NAME HERE",
  logoUrl: "https://example.com/logo.png",   // gym logo URL

  // ── Branding
  primaryColor: "#000000",                   // gym primary brand colour (hex) — used for buttons, checks, accents
  heroBg: "#000000",                         // hero background — MUST contrast with primaryColor
                                             // ⚠️ if primaryColor is dark, set heroBg to "#111111" (black)
                                             // ⚠️ if primaryColor is light/bright, heroBg can match the brand colour
                                             // e.g. 6fit: primaryColor #ed0000 (red) on heroBg #000000 (black) ✓
                                             // e.g. Ebor: primaryColor #3a4a3c (green) on heroBg #111111 (black) ✓

  // ── Hero copy
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside [GYM NAME]",                     // last line gets primaryColor
  ],
  heroSubline: "Train. Qualify. Earn.",

  // ── Positioning section — write gym-specific copy (no generic claims)
  positioningSubline: "Built inside [GYM NAME], by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside [GYM NAME]",

  // ── Why this gym (4 stat boxes)
  stats: [
    { value: "#1",  label: "Award or accolade" },
    { value: "5★",  label: "Member rated" },
    { value: "Pro", label: "Equipment brands" },
    { value: "X+",  label: "Members" },
  ],

  // ── Why this gym (bullet list)
  gymHighlights: [
    "Award or accolade 1",
    "Award or accolade 2",
    "Premium equipment: Brand A, Brand B",
    "A real coaching environment",
  ],

  // ── SEO
  metaTitle: "GYM NAME PT Academy | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify, and earn at GYM NAME. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/gym-slug-here",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function GymAcademyLandingPage() {
  return <GymAcademyPage config={config} />;
}
