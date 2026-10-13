// Content for the three local course pages (/personal-trainer-course-<town>),
// rendered by app/components/local/LocalCoursePage.tsx.
//
// Spec: docs/superpowers/specs/2026-10-13-ptlaunchlab-phase4b-local-pages-design.md
//
// EVERY sentence here must come from the facts Callum confirmed in that spec or
// from data already in the repo. No invented venues, events, distances, travel
// times, landmarks or testimonials. The course is fully online. Unit 3 is the
// business address and nothing more: learners do not go there, and there are no
// workshops. Ultimate Shred Academy has no street address in the repo, so none
// is given for it. tests/phase4b.test.mts guards all of this.
//
// A plain .ts module (relative imports carry .ts) so the tests can import it.

import type { Metadata } from "next";
import { COURSE_PRICE_LABEL, COURSE_PRICE_PENCE, MONTHLY_PAYMENTS, MONTHLY_PRICE_LABEL, MONTHLY_PLAN_TOTAL_PENCE } from "./pricing.ts";
import { ADDRESS_ONE_LINE, PHONE_NATIONAL } from "./contactDetails.ts";
import { GYMS } from "./gyms/index.ts";
import type { FaqItem } from "./faqSchema.ts";

const BASE = "https://ptlaunchlab.co.uk";

/**
 * Partner gyms whose config `location` is in West Yorkshire. Names and towns
 * are read from the configs, never typed here.
 *   superflex-academy:    location "Upton, West Yorkshire" (app/lib/gyms/superflex-academy.ts)
 *   muscle-bound-academy: location "Bradford & Huddersfield" (app/lib/gyms/muscle-bound-academy.ts)
 * Left out: partners with no `location` in their config (6fit, Leodis, 1079
 * Fitness), and those outside West Yorkshire (Iron Wolf: Goole; Ebor: York).
 */
export const WEST_YORKSHIRE_PARTNERS = ["superflex-academy", "muscle-bound-academy"] as const;

function westYorkshirePartners(): { name: string; town: string }[] {
  return WEST_YORKSHIRE_PARTNERS.map((slug) => {
    const g = GYMS[slug];
    if (!g?.location) throw new Error(`localPages: ${slug} has no location in its gym config`);
    return { name: g.gymName, town: g.location };
  });
}

export type LocalKey = "pontefract" | "wakefield" | "leeds";

export type LocalPage = {
  key: LocalKey;
  town: string;
  title: string;
  description: string;
  hero: { headline: string; goldTail: string; subline: string; image: { src: string; alt: string } };
  local: { lead: string; partnersIntro?: string; partners?: { name: string; town: string }[] };
  how: { title: string; body: string }[];
  faqs: FaqItem[];
};

// Spec fact: Ultimate Shred Academy (Pontefract) is our gym and the
// NCFE-approved centre (9002788); local learners can train or be assessed there.
const CENTRE_FACT =
  "Ultimate Shred Academy in Pontefract, our own gym and NCFE-approved centre (9002788), is where local learners can train or be assessed.";

// Spec fact: graduates in West Yorkshire can be introduced to nearby partner gyms.
const PARTNERS_INTRO = "Graduates in West Yorkshire can be introduced to nearby partner gyms.";

function hero(town: string, image: { src: string; alt: string }) {
  return {
    headline: `Personal Trainer Course in ${town},`,
    goldTail: "online around your job.",
    subline: `Qualify in 8–16 weeks with an NCFE Level 3 course you study from ${town}, around work.`,
    image,
  };
}

// Existing copy (app/components/HowItWorks.tsx, app/components/home/PriceBlock.tsx),
// localised with "from {town}" only.
function how(town: string) {
  return [
    { title: `Study online from ${town}`, body: "Work through your NCFE Level 2 & 3 qualification online, at a pace that fits around your job." },
    { title: "A tutor within 24 hours", body: "Your own personal tutor is introduced within 24 hours of enrolling." },
    { title: "Qualify in 8–16 weeks", body: "Complete in 8 weeks (intensive) or up to 16 weeks: you choose." },
    { title: "Your gym introduction", body: "When you qualify, we make your guaranteed introduction: we approach either a gym in our partner network or one local to you, on your behalf." },
  ];
}

function partnerSentence(): string {
  const list = westYorkshirePartners().map((p) => `${p.name} (${p.town})`);
  return `Partner gyms in West Yorkshire include ${list.join(" and ")}.`;
}

function faqs(key: LocalKey, town: string): FaqItem[] {
  // Pontefract leads with the centre (it is in town); the others with the partners.
  const gymAnswer =
    key === "pontefract"
      ? `Yes. ${CENTRE_FACT} ${PARTNERS_INTRO} ${partnerSentence()}`
      : `${PARTNERS_INTRO} ${partnerSentence()} ${CENTRE_FACT}`;
  return [
    {
      q: "Do I need to travel for the course?",
      a: `No. The NCFE Level 2 & 3 course is fully online, so you study from ${town}, around your job.`,
    },
    {
      q: "Where is PT Launch Lab based?",
      a: `In Pontefract, West Yorkshire. Our business address is PT Launch Lab, ${ADDRESS_ONE_LINE}, phone ${PHONE_NATIONAL}.`,
    },
    { q: `Can I train at a gym near ${town}?`, a: gymAnswer },
    {
      q: "How much does it cost?",
      a: `${COURSE_PRICE_LABEL}, everything included: the NCFE Level 3 qualification, your own personal tutor, £500 business mentorship, business training and a guaranteed gym introduction. Flexible ways to pay at checkout.`,
    },
    {
      q: "How long does it take?",
      a: "Most learners qualify in 8–16 weeks, studying online around their job.",
    },
  ];
}

const IMAGES = {
  pontefract: { src: "/learner-3.webp", alt: "PT Launch Lab learner who completed the online Level 3 personal training qualification" },
  wakefield: { src: "/learner-4.webp", alt: "PT Launch Lab graduate working as a qualified personal trainer in the UK" },
  leeds: { src: "/learner-2.webp", alt: "PT Launch Lab graduate qualified through the NCFE Level 3 personal trainer course" },
};

function page(key: LocalKey, town: string, description: string, local: LocalPage["local"]): LocalPage {
  return {
    key,
    town,
    title: `Personal Trainer Course ${town} | NCFE Level 3 Online`,
    description,
    hero: hero(town, IMAGES[key]),
    local,
    how: how(town),
    faqs: faqs(key, town),
  };
}

function nearbyLocal(town: string): LocalPage["local"] {
  return {
    lead: `Pontefract-based, close to ${town}.`,
    partnersIntro: PARTNERS_INTRO,
    partners: westYorkshirePartners(),
  };
}

export const LOCAL_PAGES: Record<LocalKey, LocalPage> = {
  pontefract: page(
    "pontefract",
    "Pontefract",
    `Online NCFE Level 2 & 3 personal trainer course from a Pontefract-based team, with our own NCFE-approved centre in town. Qualify in 8–16 weeks. ${COURSE_PRICE_LABEL}.`,
    {
      lead: "We are based in Pontefract. Ultimate Shred Academy, our own gym and NCFE-approved centre (9002788), is here, and local learners can train or be assessed there.",
    },
  ),
  wakefield: page(
    "wakefield",
    "Wakefield",
    `Study an NCFE Level 2 & 3 personal trainer course online from Wakefield, with a tutor within 24 hours. Pontefract-based team. ${COURSE_PRICE_LABEL}, everything included.`,
    nearbyLocal("Wakefield"),
  ),
  leeds: page(
    "leeds",
    "Leeds",
    `NCFE Level 2 & 3 personal trainer course you study online from Leeds, around your job. Qualify in 8–16 weeks, then a guaranteed gym introduction. ${COURSE_PRICE_LABEL}.`,
    nearbyLocal("Leeds"),
  ),
};

export const localUrl = (p: LocalPage) => `${BASE}/personal-trainer-course-${p.key}`;

export function localMetadata(p: LocalPage): Metadata {
  const url = localUrl(p);
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "PT Launch Lab",
      title: p.title,
      description: p.description,
      url,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

/** Course JSON-LD: the provider is the site-wide organisation; offers from pricing.ts. */
export function courseSchema(p: LocalPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Personal Trainer Course ${p.town}: NCFE Level 2 & 3, online`,
    description: `Online NCFE Level 2 & 3 personal trainer course, studied from ${p.town} around your job. Qualify in 8–16 weeks. ${COURSE_PRICE_LABEL}, everything included.`,
    url: localUrl(p),
    provider: { "@id": `${BASE}/#org` },
    educationalCredentialAwarded: "NCFE Level 3 Personal Training Certificate",
    offers: [
      {
        "@type": "Offer",
        name: "Pay In Full",
        category: "Paid",
        price: (COURSE_PRICE_PENCE / 100).toFixed(2),
        priceCurrency: "GBP",
        url: `${BASE}/enrol`,
      },
      {
        "@type": "Offer",
        name: `${MONTHLY_PAYMENTS} Monthly Payments`,
        category: "Paid",
        price: (MONTHLY_PLAN_TOTAL_PENCE / 100).toFixed(2),
        priceCurrency: "GBP",
        url: `${BASE}/enrol`,
        description: `${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}.`,
      },
    ],
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
  };
}

/** Breadcrumbs after Home: Courses → Personal Trainer Course {town}. */
export function breadcrumbTrail(p: LocalPage) {
  return [
    { name: "Courses", url: `${BASE}/courses` },
    { name: `Personal Trainer Course ${p.town}`, url: localUrl(p) },
  ];
}
