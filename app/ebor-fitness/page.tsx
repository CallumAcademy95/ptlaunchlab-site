import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  // ── Identity
  gymName: "Ebor Fitness",
  logoUrl: "https://static.wixstatic.com/media/b2edc7_5ca945ff5059428e8e2646f8debf33d8~mv2.jpg",
  logoAlt: "Ebor Fitness York",

  // ── Branding
  primaryColor: "#222222",
  heroBg: "#000000",

  // ── Hero copy
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside York's\nPremier Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "York",

  // ── Discount
  showDiscount: false,
  fullPrice: 1599,
  depositPrice: 599,

  positioningSubline: "Built inside one of York's most established gyms, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Ebor Fitness",
  // ── Stripe (add links once created in Stripe dashboard)
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",  // shared payment links
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // gym tracked via enrolment form

  // ── Why this gym (4 stat boxes)
  stats: [
    { value: "2006", label: "Est. by competitive bodybuilders" },
    { value: "🔨",   label: "Official Hammer Strength Center" },
    { value: "24/7", label: "Open all day, every day" },
    { value: "Pro",  label: "Athletes, footballers & fighters" },
  ],

  // ── Why this gym (bullet list)
  gymHighlights: [
    "Official Hammer Strength Center — one of only a few elite gyms in the UK",
    "Founded by Mr Universe 2013 & NABBA Pro Stuart Garrington",
    "Preferred by professional footballers, England cricketers and MMA fighters",
    "24 hours / 7 days a week — train on your schedule",
    "World-class equipment and an unmatched training environment in York",
  ],

  // ── SEO
  metaTitle: "Ebor Fitness PT Academy | Become a Qualified Personal Trainer in York",
  metaDescription:
    "Train, qualify, and earn at Ebor Fitness in York. Level 2 & 3 PT qualification through York's premier gym. Mentorship included. Interview opportunities at Ebor Fitness.",
  canonicalPath: "/ebor-fitness",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function EborFitnessAcademyPage() {
  return <GymAcademyPage config={config} />;
}
