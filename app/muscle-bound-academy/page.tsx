import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "Muscle Bound Gym",
  logoUrl: "https://www.muscleboundgymuk.co.uk/images/red-logo-white-text.png",
  primaryColor: "#ca1413",
  heroBg: "#000000",
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At Bradford's\nBiggest Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Bradford & Huddersfield",
  promoCode: "MBGPTDISCOUNT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
  stats: [
    { value: "17k", label: "Sq ft Facility" },
    { value: "2×", label: "Locations (Bradford & Huddersfield)" },
    { value: "5★", label: "Member Rated" },
    { value: "Pro", label: "Prime · Rogue · Hammer Strength" },
  ],
  gymHighlights: [
    "17,000 sqft facility packed with elite equipment — Prime, Rogue, Hammer Strength, Cybex and more",
    "Two locations — Bradford & Huddersfield",
    "Recovery suite with ice bath and infrared sauna",
    "A serious training environment — you'll learn in the gym where standards are set",
    "On-site physio, barbers, supplement shop and deli bar",
  ],
  metaTitle: "Muscle Bound PT Academy | Become a Qualified Personal Trainer at Muscle Bound Gym",
  metaDescription:
    "Train, qualify, and earn at Bradford's biggest gym. Get £200 off your Level 2 & 3 PT qualification exclusively through Muscle Bound Gym. Mentorship included. Interview opportunities at Muscle Bound.",
  canonicalPath: "/muscle-bound-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function MuscleBoundAcademyPage() {
  return <GymAcademyPage config={config} />;
}
