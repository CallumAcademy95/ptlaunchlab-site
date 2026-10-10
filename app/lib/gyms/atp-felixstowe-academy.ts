import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const atpFelixstoweAcademy: GymConfig = {
  gymName: "ATP Fitness Felixstowe",
  gymSlug: "atp-felixstowe",       // commission join key — must match the enrol page; never change
  // Their source logo is a white mark on an opaque black square. This copy has
  // the black knocked out to transparency, so it sits on any dark section —
  // and, like HITIO's, disappears on a light one.
  logoUrl: "/gym-logos/atp-felixstowe.png",
  logoAlt: "ATP Fitness Felixstowe",
  // Near-square (512×528), so it keeps the default square tile: no logoWidth/logoHeight.

  // Their palette is black, white and amber #FFC03A, read off the site's CSS.
  // White text on #FFC03A is about 1.7:1, so the amber is kept for dark
  // sections only and buttons on white use the darkest step of their own ramp.
  primaryColor: "#9D6A00",  // their ramp's dark amber — carries white text legibly
  darkAccent: "#FFC03A",    // their button amber, on black
  heroBg: "#000000",        // their site is black throughout
  sectionBg: "#191919",

  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At ATP Fitness Felixstowe",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Felixstowe, Suffolk",

  // What is distinctive here is the coaching: every session is coach-led, in
  // groups of twelve at most, by Level 3 trainers. That is the job a PT
  // learner is training for, happening in the room every day.
  positioningSubline:
    "Built inside ATP Fitness Felixstowe, where every session is already coach-led by Level 3 trainers.",
  whyThisGymHeading: "Learn Inside ATP Fitness Felixstowe",
  gymIntro:
    "You qualify in a gym where small-group coaching is the whole point, not an add-on.",

  stats: [
    { value: "12",     label: "Max Per Coached Class" },
    { value: "L3",     label: "Every Coach Level 3 Qualified" },
    { value: "6am",    label: "Open From, Monday to Friday" },
    { value: "Indoor", label: "And Outdoor Training Space" },
  ],

  gymHighlights: [
    "Every class is coach-led and capped at twelve, so you see good coaching up close every session",
    "Strength, hybrid and conditioning classes: the formats your own clients will ask for",
    "Racks, barbells, kettlebells, rowers, SkiErg and bike ergs, inside and out on Beach Street",
    "A community gym that is open to everyone, which is exactly the client base a new PT builds on",
  ],

  metaTitle: "ATP PT Academy Felixstowe | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at ATP Fitness Felixstowe. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/atp-felixstowe-academy",
};
