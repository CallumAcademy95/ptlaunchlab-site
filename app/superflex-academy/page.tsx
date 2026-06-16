import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "Superflex Gym",
  logoUrl: "https://static.wixstatic.com/media/88602e_b5b0f48fcacd4ae7b459fdc0c0a0c0b8~mv2.png",
  logoAlt: "Superflex 2.0 Gym",
  primaryColor: "#1E9E1E",  // balanced grass green — white button text stays legible
  darkAccent: "#4BD42E",    // bright lime for the hero accent line / dark-section checks
  heroBg: "#000000",
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Superflex Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Upton, West Yorkshire",
  promoCode: "SUPERFLEXPT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
  positioningSubline: "Built inside Superflex 2.0 Gym, Upton — a real coaching floor, not a classroom.",
  whyThisGymHeading: "Learn Inside Superflex 2.0 Gym",
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",  // shared payment links
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // gym tracked via enrolment form
  stats: [
    { value: "WF9",     label: "Upton, West Yorkshire" },
    { value: "S&C",     label: "Strength & Conditioning Floor" },
    { value: "Classes", label: "Group Training Timetable" },
    { value: "Therapy", label: "On-Site Sports Therapy" },
  ],
  gymHighlights: [
    "A positive, no-ego environment where effort is respected and progress is celebrated",
    "Full free-weights and strength & conditioning floor",
    "Group classes, sports therapy and nutritional advice on site",
    "A real coaching environment in Upton — you learn where members actually train",
  ],
  metaTitle: "Superflex PT Academy | Become a Qualified Personal Trainer in Upton",
  metaDescription:
    "Train, qualify and earn at Superflex 2.0 Gym in Upton. Get £200 off your Level 2 & 3 PT qualification exclusively for Superflex members. Mentorship included.",
  canonicalPath: "/superflex-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function SuperflexAcademyPage() {
  return <GymAcademyPage config={config} />;
}
