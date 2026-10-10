import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const gymNGoAcademy: GymConfig = {
  gymName: "Gym n Go",
  gymSlug: "gym-n-go",       // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  logoUrl: "/gym-logos/gym-n-go.png",
  logoAlt: "Gym n Go Forest Hill",
  logoWidth: 915,
  logoHeight: 383,
  primaryColor: "#0087C4",  // deep cyan — white button text stays legible
  darkAccent: "#29B6F6",    // bright cyan for the hero accent line / dark-section checks
  heroBg: "#0A0A0A",        // their site reads near-black
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Gym n Go",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Forest Hill, South London",
  positioningSubline: "Built inside Gym n Go Forest Hill, a real coaching floor rather than a classroom.",
  whyThisGymHeading: "Learn Inside Gym n Go Forest Hill",
  stats: [
    { value: "SE23",     label: "Forest Hill, South London" },
    { value: "Strength", label: "Premium Free-Weights Floor" },
    { value: "Classes",  label: "Yoga, Pilates & HIIT" },
    { value: "Flexible", label: "No Long Contracts" },
  ],
  gymHighlights: [
    "A premium strength and free-weights floor in the heart of Forest Hill",
    "A full class timetable of yoga, Pilates and HIIT running alongside the gym floor",
    "Flexible memberships and a free guest pass, so the floor stays busy with real members",
    "A real coaching environment in SE23, where members actually train",
  ],
  metaTitle: "Gym n Go PT Academy | Become a Qualified Personal Trainer in Forest Hill",
  metaDescription:
    "Train, qualify and earn at Gym n Go Forest Hill. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/gym-n-go-academy",
};
