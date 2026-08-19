import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "HITIO Gym Orpington",
  logoUrl: "https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png",
  logoAlt: "HITIO Gym Orpington",
  // Both dimensions are REQUIRED. The wordmark is 168×46; with either missing,
  // GymConfig falls back to the 52×52 square tile and crushes it.
  logoWidth: 168,
  logoHeight: 46,

  // Their own palette, read off the live site's theme config rather than eyeballed.
  primaryColor: "#e70034",  // their button colour — carries white text legibly
  darkAccent: "#ed4b51",    // lifts the hero accent line off the near-black hero
  heroBg: "#1a1a23",        // their own background, not a generic black

  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At HITIO Gym Orpington",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Orpington, South East London",

  promoCode: "HITIOPT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,

  // Positioning leans on what is actually distinctive here — a family-run
  // martial arts and fitness gym with a real coaching culture already in the
  // building. Equipment lists are what every other gym page says.
  positioningSubline:
    "Built inside HITIO Gym Orpington — a family-run gym where coaching is already what the place does.",
  whyThisGymHeading: "Learn Inside HITIO Gym Orpington",
  gymIntro:
    "You qualify on a floor that already runs coached sessions every day, from fitness boxing and kickboxing to strength and conditioning.",

  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",  // shared payment links
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // gym tracked via enrolment form

  stats: [
    { value: "5am",     label: "Open From, Seven Days" },
    { value: "Classes", label: "Fitness Boxing & Kickboxing" },
    { value: "Studio",  label: "Dedicated Group Training Space" },
    { value: "3hrs",    label: "Free Parking On Site" },
  ],

  gymHighlights: [
    "A family-run gym that coaches every day — fitness boxing, kickboxing and strength and conditioning",
    "Full free-weight, cardio and functional training zones, plus a dedicated group training studio",
    "Open from 5am seven days a week, so client sessions fit around whatever else you do",
    "Three hours' free parking with EV charging, and strong bus links into Orpington",
  ],

  metaTitle: "HITIO PT Academy Orpington | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at HITIO Gym Orpington. Get £200 off your Level 2 & 3 PT qualification as a HITIO member. Mentorship included.",
  canonicalPath: "/hitio-orpington-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function HitioOrpingtonAcademyPage() {
  return <GymAcademyPage config={config} />;
}
