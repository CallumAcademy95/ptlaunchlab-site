import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

// Palette taken from Xcelerate's own brand mark — an X running from deep navy
// through purple into crimson — rather than from their site CSS, which is
// mostly Wix editor chrome shared with every other Wix site.
const config: GymConfig = {
  gymName: "Xcelerate Gyms",
  logoUrl: "/gym-logos/xcelerate.png",
  logoAlt: "Xcelerate Gyms",
  logoWidth: 866,
  logoHeight: 182,
  primaryColor: "#D81A3F",  // crimson from the mark — white button text stays legible
  darkAccent: "#E23181",    // pink for the hero accent line / dark-section checks
  heroBg: "#02023C",        // deep navy, matching the top of the brand gradient
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Xcelerate Gyms",
  ],
  heroSubline: "Made Different. Made Better.",
  location: "Edgware, North London",
  promoCode: "XCELERATEPT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
  positioningSubline: "Built inside Xcelerate Gyms Edgware — a real coaching floor, not a classroom.",
  whyThisGymHeading: "Learn Inside Xcelerate Gyms Edgware",
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",  // shared payment links
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // gym tracked via enrolment form
  stats: [
    { value: "HA8",      label: "Edgware, North London" },
    { value: "2021",     label: "Open Since — Award-Winning Gym" },
    { value: "Functional", label: "Dedicated CrossFit Floor" },
    { value: "Studio",   label: "Classes & Yoga Space" },
  ],
  gymHighlights: [
    "An award-winning gym floor in Edgware, open since 2021",
    "Full free-weights, resistance and cardio floor plus a dedicated CrossFit area",
    "Studio space for group classes and yoga — you see real coaching happen every day",
    "No fixed-term contracts and a genuinely mixed membership, from first-timers to serious lifters",
  ],
  metaTitle: "Xcelerate PT Academy | Become a Qualified Personal Trainer in Edgware",
  metaDescription:
    "Train, qualify and earn at Xcelerate Gyms Edgware. Get £200 off your Level 2 & 3 PT qualification exclusively for Xcelerate members. Mentorship included.",
  canonicalPath: "/xcelerate-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function XcelerateAcademyPage() {
  return <GymAcademyPage config={config} />;
}
