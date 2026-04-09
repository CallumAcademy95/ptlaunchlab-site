import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "Ministry of Fitness",
  logoUrl: "https://mofgym.co.uk/wp-content/uploads/2020/08/cropped-Ministry-Logo-new-final-05.png",
  primaryColor: "#00cc33",
  sectionBg: "#007a1f",
  heroBg: "#000000",
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Bristol's\nBiggest Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  promoCode: "MOFPTDISCOUNT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
  positioningSubline: "Built inside Bristol's biggest independent gym, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Ministry of Fitness",
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
  stats: [
    { value: "#1",  label: "Biggest independent gym in Bristol" },
    { value: "2010", label: "Est. — 15+ years transforming Bristol" },
    { value: "4",   label: "Pro equipment brands" },
    { value: "100%", label: "Independent & locally owned" },
  ],
  gymHighlights: [
    "Bristol's biggest independent gym — established 2010",
    "15+ years producing serious transformation results",
    "Pro equipment: Nautilus, Life Fitness, Watson & Startrac",
    "A real coaching environment — not a chain, not a class factory",
  ],
  metaTitle: "Ministry of Fitness PT Academy | Become a Qualified Personal Trainer in Bristol",
  metaDescription:
    "Train, qualify, and earn at Bristol's biggest independent gym. Get £200 off your Level 2 & 3 PT qualification exclusively through Ministry of Fitness. Mentorship included.",
  canonicalPath: "/mof-gym",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function MofGymAcademyPage() {
  return <GymAcademyPage config={config} />;
}
