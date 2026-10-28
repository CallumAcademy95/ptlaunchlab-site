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

  // Sales page (28 Oct 2026 pilot). Voice and claims come from ATP's own
  // Instagram (@atpfitnessfelixstowe) and website: George describes coaching
  // as talking the session through, watching technique and building
  // confidence. Written for people who have only SEEN ATP as well as members.
  // Photos are from atpfitnessfelixstowe.com (agreement cl. 6.3: show George).
  salesPage: {
    heroImage: "/gym-photos/atp-felixstowe/hero.jpg",
    heroImageAlt: "ATP Fitness coaches watching a member's squat",
    heroHeadline: ["Become the coach", "you'd want to train with."],
    heroSubline:
      "You've seen how ATP coaches: talking people through every session, watching technique, building confidence. Now learn to do it yourself. Qualify as a personal trainer through ATP Fitness Felixstowe.",
    coaching: {
      heading: "The coaching ATP is known for. That's the job.",
      intro: "Good coaching. Good people. Good energy. Here is what that looks like on the gym floor.",
      cards: [
        {
          image: "/gym-photos/atp-felixstowe/talk.jpg",
          imageAlt: "An ATP coach talking members through the session",
          title: "Talk it through",
          body: "Explain the session and why you're doing it. People train harder for a coach they understand.",
        },
        {
          image: "/gym-photos/atp-felixstowe/watch.jpg",
          imageAlt: "An ATP coach spotting a bench press",
          title: "Watch the movement",
          body: "Demonstrate it, watch the technique, reinforce good patterns. Seeing what's off and fixing it is the core of the job.",
        },
        {
          image: "/gym-photos/atp-felixstowe/confidence.jpg",
          imageAlt: "An ATP coach and a member sharing a laugh mid-session",
          title: "Build confidence",
          body: "Adjust, give feedback, keep it fun. People stay with the coach who makes them feel capable.",
        },
      ],
      closingLine: "This course teaches you how to do all three, properly.",
    },
    quotesHeading: "What people say about coaching at ATP",
    quotes: [
      {
        text: "A great gym, great coaching and great community. I would highly recommend it to everyone, any ability!",
        attribution: "ATP Fitness member",
      },
      {
        text: "The loveliest, friendliest gym. I love that we follow a programme in a small coaching environment, it takes the confusion out of training. Such a fab group of people and I always come away from class smiling and feeling like I've achieved.",
        attribution: "ATP Fitness member",
      },
    ],
    quotesSource: "https://www.atpfitnessfelixstowe.com/reviews",
    path: {
      heading: "What becoming a coach here looks like",
      steps: [
        "Qualify online, typically in 8–16 weeks, around your job.",
        "Practise in the gym you train in.",
        "When you qualify, ATP gets the first introduction to you.",
        "Coach your own clients.",
      ],
    },
    community: {
      image: "/gym-photos/atp-felixstowe/community.jpg",
      imageAlt: "ATP Fitness members and coaches together in front of the ATP sign",
      line: "Different people. Different goals. One community.",
    },
  },

  metaTitle: "ATP PT Academy Felixstowe | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at ATP Fitness Felixstowe. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/atp-felixstowe-academy",
};
