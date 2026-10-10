import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const superflexAcademy: GymConfig = {
  gymName: "Superflex Gym",
  gymSlug: "superflex",       // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
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
  positioningSubline: "Built inside Superflex 2.0 Gym in Upton: a real coaching floor rather than a classroom.",
  whyThisGymHeading: "Learn Inside Superflex 2.0 Gym",
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
    "A real coaching environment in Upton, where members actually train",
  ],
  metaTitle: "Superflex PT Academy | Become a Qualified Personal Trainer in Upton",
  metaDescription:
    "Train, qualify and earn at Superflex 2.0 Gym in Upton. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/superflex-academy",
};
