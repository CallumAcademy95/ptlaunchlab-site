import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const imperiumStrengthAcademy: GymConfig = {
  gymName: "Imperium Strength",
  gymSlug: "imperium-strength",     // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  // Gold column, laurel and wordmark, cut out of their og:image onto
  // transparent. It is drawn for dark surfaces, which is every surface it sits
  // on here. Near-square (600×554): keeps the default square tile.
  logoUrl: "/gym-logos/imperium-strength.png",
  logoAlt: "Imperium Strength",

  // Their site renders gold #BFA25F on near-black #13100B (computed CSS, not the
  // theme vars). White on that gold is 2.5:1, so the gold is the dark-section
  // accent only; buttons on white take a darker shade of the same gold, #836B33
  // (5.1:1).
  primaryColor: "#836B33",
  darkAccent: "#BFA25F",
  heroBg: "#13100B",
  sectionBg: "#1F1A14",

  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At Imperium Strength",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Chichester, West Sussex",

  // What is distinctive here, per their own site: a new strength gym where
  // bodybuilding, powerlifting, strongman and functional training share one
  // floor, with a coaching team that writes bespoke programmes.
  positioningSubline:
    "Built inside Imperium Strength, a Chichester strength gym where bodybuilding, powerlifting, strongman and functional training share one floor.",
  whyThisGymHeading: "Learn Inside Imperium Strength",
  gymIntro:
    "You learn the job in a gym where coaches write bespoke programmes and teach technique to everyone from first-timers to competitive lifters.",

  stats: [
    { value: "6am",       label: "Open From, Monday To Saturday" },
    { value: "4",         label: "Coaches On The Team" },
    { value: "Platforms", label: "Custom-Built For Lifting" },
    { value: "Cafe",      label: "Coffee & Recovery Bar On Site" },
  ],

  gymHighlights: [
    "Founded by Marcelo Prado, a Level 3 PT and Level 4 nutritionist, with coaches in performance, bodybuilding and nutrition",
    "Training drawn from bodybuilding, powerlifting, strongman and functional fitness: the range of clients a new PT meets",
    "Custom-built lifting platforms and hand-picked strength and conditioning kit",
    "Open 6am to 10pm Monday to Saturday and 7am to 5pm on Sunday, so client sessions fit around your day",
  ],

  metaTitle: "Imperium Strength PT Academy Chichester | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at Imperium Strength, Chichester. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/imperium-strength-academy",
};
