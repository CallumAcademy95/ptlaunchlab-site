import type { GymConfig } from "@/app/lib/gymPartnerConfig";

// Built 20 Oct 2026 ahead of signing, from their public site, so it can go
// live the day the agreement comes back. Logo and photos replaced with the
// originals M Club sent on 21 Oct.
export const mclubAcademy: GymConfig = {
  gymName: "M Club",
  gymSlug: "mclub",     // commission join key — must match the enrol page; never change
  memberSavingPence: 0,  // optional gym-funded saving on pay-in-full (0, 2500, 5000, 7500 or 10000)
  // White "m" roundel and "Club." wordmark on transparent: the logo file M Club
  // sent on 21 Oct 2026, trimmed to its edges and doubled (1398×504). Drawn
  // for dark surfaces, which is every surface it sits on here. Wide (2.8:1).
  logoUrl: "/gym-logos/mclub.png",
  logoAlt: "M Club",

  // Their site's theme: teal --mc-primary #004B47 and sand --mc-secondary
  // #C9B383. White on the teal is 10:1, so the teal carries buttons. The sand
  // is the accent on dark sections (7.1:1 on the hero teal).
  primaryColor: "#004B47",
  darkAccent: "#C9B383",
  heroBg: "#002F2C",
  sectionBg: "#003D3A",

  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At M Club",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Stoke-on-Trent, Staffordshire",

  // What is distinctive here, per their own site: two clubs (Hanley and
  // Newcastle) with gym, pools, spa and classes, and an official HYROX
  // training centre at Hanley.
  positioningSubline:
    "Built inside M Club, two Stoke-on-Trent health clubs with a gym, pools, spa, 100+ classes a week and an official HYROX training centre.",
  whyThisGymHeading: "Learn Inside M Club",
  gymIntro:
    "You learn the job in clubs where every member gets a personalised training programme, and where members come for strength, HYROX, swimming and classes: the range of clients a new PT meets.",

  stats: [
    { value: "2",           label: "Clubs In Stoke-on-Trent" },
    { value: "100+",        label: "Classes Every Week" },
    { value: "6,000 sq ft", label: "HYROX Zone At Hanley" },
    { value: "23m",         label: "Swimming Pool" },
  ],

  gymHighlights: [
    "Two clubs, Hanley (Waterworld) and Newcastle (Parklands), open 6am to 9:30pm on weekdays, so client sessions fit around your day",
    "An official HYROX training centre at Hanley, with a 6,000 sq ft zone covering all eight race stations",
    "Pulse Fitness equipment with TRAKK workout tracking and Tanita body composition scales",
    "Every member gets a free personalised training programme: a coaching culture to start your career in",
  ],

  metaTitle: "M Club PT Academy Stoke-on-Trent | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at M Club, Stoke-on-Trent. Get your Level 2 & 3 PT qualification here, paid in full or monthly. Mentorship included.",
  canonicalPath: "/mclub-academy",
};
