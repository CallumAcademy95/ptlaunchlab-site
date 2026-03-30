import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  // ── Identity
  gymName: "Ebor Fitness",
  logoUrl: "https://static.wixstatic.com/media/b2edc7_5ca945ff5059428e8e2646f8debf33d8~mv2.jpg",
  logoAlt: "Ebor Fitness York",

  // ── Branding
  primaryColor: "#116dff",
  heroBg: "#080808",

  // ── Hero copy
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside York's\nPremier Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "York",

  // ── Discount
  promoCode: "EBORPTDISCOUNT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,

  // ── Stripe (add links once created in Stripe dashboard)
  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",

  // ── Why this gym (4 stat boxes)
  stats: [
    { value: "York", label: "City Centre Location" },
    { value: "5★",   label: "Member Rated" },
    { value: "Pro",  label: "Premium Equipment" },
    { value: "L2+3", label: "PT Qualification" },
  ],

  // ── Why this gym (bullet list)
  gymHighlights: [
    "Based in the heart of York — one of the UK's most sought-after cities",
    "Premium facilities on Hospital Fields Road",
    "A professional coaching environment with high standards",
    "Strong local member community — perfect for building a PT client base",
  ],

  // ── SEO
  metaTitle: "Ebor Fitness PT Academy | Become a Qualified Personal Trainer in York",
  metaDescription:
    "Train, qualify, and earn at Ebor Fitness in York. Get £200 off your Level 2 & 3 PT qualification exclusively through Ebor Fitness. Mentorship included. Interview opportunities at Ebor.",
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
