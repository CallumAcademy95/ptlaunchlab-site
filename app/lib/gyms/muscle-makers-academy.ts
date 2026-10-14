import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const muscleMakersAcademy: GymConfig = {
  gymName: "Muscle Makers Gym",
  gymSlug: "muscle-makers",        // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  // Their classic logo (black bodybuilder, yellow lettering) is dark ink on
  // transparent and vanishes on a dark hero, so this copy sits on a white
  // plate. Near-square (600×585): keeps the default square tile.
  logoUrl: "/gym-logos/muscle-makers.png",
  logoAlt: "Muscle Makers Gym",

  // Their site renders orange #F8951D on black. White on that orange is 2.3:1,
  // so it is used on dark sections only; buttons on white take #A85800 (5.2:1).
  primaryColor: "#A85800",
  darkAccent: "#F8951D",
  heroBg: "#000000",
  sectionBg: "#141414",

  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At Muscle Makers Gym",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Rotherham, South Yorkshire",

  // What is distinctive here: an old-school, family-run iron gym where the
  // owners coach and compete themselves. Not another equipment list.
  positioningSubline:
    "Built inside Muscle Makers Gym, a family-run Rotherham gym where the owners coach and have both competed on stage.",
  whyThisGymHeading: "Learn Inside Muscle Makers Gym",
  gymIntro:
    "You learn the job in a gym where coaching, contest prep and inductions for complete beginners all happen every week.",

  stats: [
    { value: "2",    label: "Floors Of Heavy Iron" },
    { value: "50kg", label: "Dumbbells, From 1kg Up" },
    { value: "2017", label: "Family-Run Since" },
    { value: "24hr", label: "Key-Holder Access Available" },
  ],

  gymHighlights: [
    "Run by Andy and Krystina, who coach, prep competitors and have both competed on stage",
    "Two floors of old-school kit: Hammer Strength, hack, belt and lever squats, and dumbbells to 50kg",
    "Everyone welcome, from complete beginners to competitors: exactly the clients a new PT starts with",
    "Personal inductions for new members, so you see good coaching from someone's very first session",
  ],

  metaTitle: "Muscle Makers PT Academy Rotherham | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at Muscle Makers Gym, Rotherham. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/muscle-makers-academy",
};
