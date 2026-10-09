import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const xcelerateAcademy: GymConfig = {
  gymName: "Xcelerate Gyms",
  logoUrl: "/gym-logos/xcelerate.png",
  logoAlt: "Xcelerate Gyms",
  logoWidth: 866,
  logoHeight: 182,
  primaryColor: "#D81A3F",  // crimson from the mark — white button text stays legible
  darkAccent: "#E23181",    // pink for the hero accent line / dark-section checks
  heroBg: "#02023C",        // deep navy, matching the top of the brand gradient
  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "Inside Xcelerate Gyms",
  ],
  heroSubline: "Made Different. Made Better.",
  location: "Edgware, North London",
  positioningSubline: "Built inside Xcelerate Gyms Edgware: a real coaching floor rather than a classroom.",
  whyThisGymHeading: "Learn Inside Xcelerate Gyms Edgware",
  stats: [
    { value: "HA8",      label: "Edgware, North London" },
    { value: "2021",     label: "Open Since · Award-Winning Gym" },
    { value: "Functional", label: "Dedicated CrossFit Floor" },
    { value: "Studio",   label: "Classes & Yoga Space" },
  ],
  gymHighlights: [
    "An award-winning gym floor in Edgware, open since 2021",
    "Full free-weights, resistance and cardio floor plus a dedicated CrossFit area",
    "Studio space for group classes and yoga, where real coaching happens every day",
    "No fixed-term contracts and a genuinely mixed membership, from first-timers to serious lifters",
  ],
  metaTitle: "Xcelerate PT Academy | Become a Qualified Personal Trainer in Edgware",
  metaDescription:
    "Train, qualify and earn at Xcelerate Gyms Edgware. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/xcelerate-academy",
};
