import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "6fit Gyms",
  logoUrl: "https://6fitgyms.co.uk/wp-content/uploads/2022/12/6fit_FF-02.png",
  primaryColor: "#ed0000",
  heroBg: "#000000",
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside The Best\nGym In The North",
  ],
  heroSubline: "Train. Qualify. Earn.",
  promoCode: "6FITPTDISCOUNT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
  stats: [
    { value: "#1", label: "Best Gym In The North" },
    { value: "2×", label: "Best Gym In Bradford" },
    { value: "5★", label: "Member Rated" },
    { value: "Pro", label: "Gymleco · Cybex · Rogue" },
  ],
  gymHighlights: [
    "Best Gym In The North",
    "Best Gym In Bradford — 2 years running",
    "Premium equipment: Gymleco, Cybex, Nautilus, Rogue",
    "A real coaching environment — you learn where standards are set",
  ],
  metaTitle: "6fit PT Academy | Become a Qualified Personal Trainer at 6fit Gyms",
  metaDescription:
    "Train, qualify, and earn at Bradford's best gym. Get £200 off your Level 2 & 3 PT qualification exclusively through 6fit Gyms. Mentorship included. Interview opportunities at 6fit.",
  canonicalPath: "/6fit-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function SixFitAcademyPage() {
  return <GymAcademyPage config={config} />;
}
