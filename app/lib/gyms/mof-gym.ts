import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const mofGym: GymConfig = {
  gymName: "Ministry of Fitness",
  gymSlug: "mof",       // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  logoUrl: "/logos/mof.png",
  primaryColor: "#00cc33",
  sectionBg: "#007a1f",
  heroBg: "#000000",
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Bristol's\nBest Independent Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  positioningSubline: "Built inside Bristol's best independent gym, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Ministry of Fitness",
  stats: [
    { value: "#1",  label: "Best independent gym in Bristol" },
    { value: "2010", label: "Est. — 15+ years transforming Bristol" },
    { value: "7+",  label: "Pro equipment brands" },
    { value: "100%", label: "Independent & locally owned" },
  ],
  gymHighlights: [
    "Bristol's best independent gym — established 2010",
    "15+ years producing serious transformation results",
    "Pro equipment: Hammer, Nautilus, Panatta, Watson, Life Fitness, Startrac, Gymnico & more",
    "A real coaching environment — not a chain, not a class factory",
  ],
  metaTitle: "Ministry of Fitness PT Academy | Become a Qualified Personal Trainer in Bristol",
  metaDescription:
    "Train, qualify, and earn at Bristol's biggest independent gym. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/mof-gym",
};
