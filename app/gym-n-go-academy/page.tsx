import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

// Gym n Go's brand mark is monochrome, so the accent is drawn from their own
// gym imagery — the bright cyan walls on the Forest Hill floor. Worth confirming
// with the gym before launch; it's inferred, not taken from a brand guide.
const config: GymConfig = {
  gymName: "Gym n Go",
  logoUrl: "/gym-logos/gym-n-go.png",
  logoAlt: "Gym n Go Forest Hill",
  logoWidth: 915,
  logoHeight: 383,
  primaryColor: "#0087C4",  // deep cyan — white button text stays legible
  darkAccent: "#29B6F6",    // bright cyan for the hero accent line / dark-section checks
  heroBg: "#0A0A0A",        // their site reads near-black
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Gym n Go",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Forest Hill, South London",
  promoCode: "GYMNGOPT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
  positioningSubline: "Built inside Gym n Go Forest Hill — a real coaching floor, not a classroom.",
  whyThisGymHeading: "Learn Inside Gym n Go Forest Hill",
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",  // shared payment links
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // gym tracked via enrolment form
  stats: [
    { value: "SE23",     label: "Forest Hill, South London" },
    { value: "Strength", label: "Premium Free-Weights Floor" },
    { value: "Classes",  label: "Yoga, Pilates & HIIT" },
    { value: "Flexible", label: "No Long Contracts" },
  ],
  gymHighlights: [
    "A premium strength and free-weights floor in the heart of Forest Hill",
    "A full class timetable — yoga, Pilates and HIIT — running alongside the gym floor",
    "Flexible memberships and a free guest pass, so the floor stays busy with real members",
    "A real coaching environment in SE23 — you learn where members actually train",
  ],
  metaTitle: "Gym n Go PT Academy | Become a Qualified Personal Trainer in Forest Hill",
  metaDescription:
    "Train, qualify and earn at Gym n Go Forest Hill. Get £200 off your Level 2 & 3 PT qualification exclusively for Gym n Go members. Mentorship included.",
  canonicalPath: "/gym-n-go-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function GymNGoAcademyPage() {
  return <GymAcademyPage config={config} />;
}
