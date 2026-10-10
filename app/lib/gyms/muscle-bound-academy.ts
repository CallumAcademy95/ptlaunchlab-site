import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const muscleBoundAcademy: GymConfig = {
  gymName: "Muscle Bound Gym",
  gymSlug: "muscle-bound",       // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  logoUrl: "https://www.muscleboundgymuk.co.uk/images/red-logo-white-text.png",
  primaryColor: "#ca1413",
  heroBg: "#000000",
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At Muscle Bound Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Bradford & Huddersfield",
  positioningSubline: "Built inside Muscle Bound Gym, by people who actually hire PTs.",
  whyThisGymHeading: "Learn Inside Muscle Bound Gym",
  stats: [
    { value: "17k", label: "Sq ft Facility" },
    { value: "2×", label: "Locations (Bradford & Huddersfield)" },
    { value: "5★", label: "Member Rated" },
    { value: "Pro", label: "Prime · Rogue · Hammer Strength" },
  ],
  gymHighlights: [
    "17,000 sqft facility packed with elite equipment: Prime, Rogue, Hammer Strength, Cybex and more",
    "Two locations: Bradford and Huddersfield",
    "Recovery suite with ice bath and infrared sauna",
    "A serious training environment, where standards are set",
    "On-site physio, barbers, supplement shop and deli bar",
  ],
  metaTitle: "Muscle Bound PT Academy | Become a Qualified Personal Trainer at Muscle Bound Gym",
  metaDescription:
    "Train, qualify, and earn at Bradford's biggest gym. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included. Introduction guarantee on qualifying.",
  canonicalPath: "/muscle-bound-academy",
};
