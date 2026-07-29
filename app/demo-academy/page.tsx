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

import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "Northgate Strength",
  logoUrl: "/logos/ultimate-shred.png",
  logoAlt: "Northgate Strength",

  primaryColor: "#F5C518",
  darkAccent: "#F5C518",
  heroBg: "#0B1F38",

  heroHeadline: ["Become a Qualified", "Personal Trainer", "Inside Northgate Strength"],
  heroSubline: "Train. Qualify. Earn.",

  promoCode: "NORTHGATEPT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,

  positioningSubline: "Built inside Northgate Strength, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Northgate Strength",

  // Point at the shared links rather than inventing dead ones — nobody should
  // reach a broken Stripe page from a demo, and nobody should be able to buy
  // through it by accident either, which is why the portal account is flagged
  // as a demo and excluded from real reporting.
  stripeFullLink: "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",

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

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  // A prop, not a page we want ranking against the real gyms.
  robots: { index: false, follow: false },
};

export default function DemoAcademyPage() {
  return <GymAcademyPage config={config} />;
}
