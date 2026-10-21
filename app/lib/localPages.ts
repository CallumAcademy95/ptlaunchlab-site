// Content for the local course pages, rendered by
// app/components/local/LocalCoursePage.tsx:
//   /personal-trainer-course-pontefract       (our town)
//   /personal-trainer-course-west-yorkshire   (the county, one page rather than
//                                              town-swapped clones; owner's decision)
//
// Spec: docs/superpowers/specs/2026-10-13-ptlaunchlab-phase4b-local-pages-design.md
//
// EVERY sentence here must come from the facts Callum confirmed in that spec or
// from data already in the repo. No invented venues, events, distances, travel
// times, landmarks or testimonials. The course is fully online, with NO
// in-person training or assessment anywhere (owner, 13 Oct 2026). Unit 3 is the
// business address and nothing more. Ultimate Shred Academy is described only as
// our own gym and NCFE-approved centre; it has no street address in the repo, so
// none is given. Partner gyms are introductions after qualifying.
// tests/phase4b.test.mts guards all of this.
//
// A plain .ts module (relative imports carry .ts) so the tests can import it.

import type { Metadata } from "next";
import { COURSE_PRICE_LABEL, COURSE_PRICE_PENCE, MONTHLY_PAYMENTS, MONTHLY_PRICE_LABEL, MONTHLY_PLAN_TOTAL_PENCE } from "./pricing.ts";
import { ADDRESS_ONE_LINE, PHONE_NATIONAL } from "./contactDetails.ts";
import { GYMS } from "./gyms/index.ts";
import type { GymConfig } from "./gymPartnerConfig.ts";
import type { FaqItem } from "./faqSchema.ts";

const BASE = "https://ptlaunchlab.co.uk";

/** Towns that count as West Yorkshire when they appear in a gym config's `location`. */
export const WEST_YORKSHIRE_TOWNS = [
  "Upton", "Bradford", "Huddersfield", "Wakefield", "Leeds", "Pontefract",
  "Castleford", "Dewsbury", "Halifax", "Keighley", "Ossett", "Normanton",
] as const;

/**
 * Allow-listed names that are not unique to West Yorkshire (there is an Upton
 * on the Wirral, in Dorset, ...). They count only when the location also says
 * "West Yorkshire".
 */
export const AMBIGUOUS_TOWNS = ["Upton"] as const;

export type Partner = { name: string; towns: string[]; town: string };

/**
 * Partner gyms whose config `location` names a West Yorkshire town. Names and
 * towns come from the configs; `town` is the matched towns, e.g. "Upton" or
 * "Bradford & Huddersfield". A gym with no `location` is never listed, and an
 * ambiguous town (AMBIGUOUS_TOWNS) needs "West Yorkshire" in the location too.
 */
export function westYorkshirePartners(gyms: Record<string, GymConfig> = GYMS): Partner[] {
  const out: Partner[] = [];
  for (const g of Object.values(gyms)) {
    const loc = g.location;
    if (!loc) continue;
    const saysWestYorkshire = /West Yorkshire/.test(loc);
    const towns = WEST_YORKSHIRE_TOWNS.filter(
      (t) => new RegExp(`\\b${t}\\b`).test(loc) && (saysWestYorkshire || !(AMBIGUOUS_TOWNS as readonly string[]).includes(t)),
    );
    if (towns.length) out.push({ name: g.gymName, towns, town: towns.join(" & ") });
  }
  return out;
}

export type LocalKey = "pontefract" | "westYorkshire";

export type LocalPage = {
  key: LocalKey;
  /** URL slug: /personal-trainer-course-{slug}. Also the CTA source infix. */
  slug: string;
  /** The place the page is for, as in "Personal Trainer Course {place}". */
  place: string;
  title: string;
  description: string;
  hero: { headline: string; goldTail: string; subline: string; image: { src: string; alt: string } };
  local: { lead: string; served?: string; partnersIntro?: string; partners?: Partner[] };
  how: { title: string; body: string }[];
  faqs: FaqItem[];
};

// The only thing said about Ultimate Shred (owner's wording). Nothing about
// learners going there.
const CENTRE_SENTENCE = "Ultimate Shred Academy in Pontefract is our own gym and NCFE-approved centre (9002788).";
const ONLINE_SENTENCE = "The course is fully online, with no in-person training.";
// Existing qualifier (HowItWorks.tsx:58).
const INTERVIEW_QUALIFIER = "Whether they interview you and whether you get the job is between you and them.";

function partnerList(partners: Partner[]): string {
  const items = partners.map((p) => `${p.name} (${p.town})`);
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "from {from}": where the learner studies from. */
function hero(place: string, from: string, image: { src: string; alt: string }) {
  return {
    headline: `Personal Trainer Course in ${place},`,
    goldTail: "online around your job.",
    subline: `Qualify in 8–16 weeks with an NCFE Level 3 course you study from ${from}, around work.`,
    image,
  };
}

// Existing copy (app/components/HowItWorks.tsx, app/components/home/PriceBlock.tsx),
// localised with "from {from}" only.
function how(from: string) {
  return [
    { title: `Study online from ${from}`, body: "Work through your NCFE Level 2 & 3 qualification online, at a pace that fits around your job." },
    { title: "A tutor within 24 hours", body: "Your own personal tutor is introduced within 24 hours of enrolling." },
    { title: "Qualify in 8–16 weeks", body: "Complete in 8 weeks (intensive) or up to 16 weeks: you choose." },
    {
      title: "Your gym introduction",
      body: `When you qualify, we make your guaranteed introduction: we approach either a gym in our partner network or one local to you, on your behalf. ${INTERVIEW_QUALIFIER}`,
    },
  ];
}

/** Pontefract only: the town page answers the town question first. */
const PONTEFRACT_FAQ: FaqItem = {
  q: "Is PT Launch Lab based in Pontefract?",
  a: `Yes. PT Launch Lab is based at ${ADDRESS_ONE_LINE} (${PHONE_NATIONAL}). ${CENTRE_SENTENCE} The course itself is fully online.`,
};

/** Shared FAQs. `withNap: false` drops the address question for a page that answers it itself. */
function faqs({ withNap = true }: { withNap?: boolean } = {}): FaqItem[] {
  const partners = westYorkshirePartners();
  const introduction = partners.length
    ? `Once you qualify, we can introduce you to partner gyms in West Yorkshire such as ${partnerList(partners)}.`
    : "Once you qualify, we introduce you to a gym in our partner network or one local to you.";
  return [
    {
      q: "Do I need to go to a gym or attend in person?",
      a: `No. ${ONLINE_SENTENCE} ${introduction} ${INTERVIEW_QUALIFIER}`,
    },
    ...(withNap
      ? [{
          q: "Where is PT Launch Lab based?",
          a: `In Pontefract, West Yorkshire. Our business address is PT Launch Lab, ${ADDRESS_ONE_LINE}, phone ${PHONE_NATIONAL}.`,
        }]
      : []),
    {
      // app/courses/page.tsx:186
      q: "Is the qualification recognised?",
      a: "Yes. The NCFE Level 2 & 3 qualification is regulated by Ofqual and recognised by CIMSPA.",
    },
    {
      q: "How much does it cost?",
      a: `${COURSE_PRICE_LABEL}, everything included: the NCFE Level 3 qualification, your own personal tutor, business mentorship, business training and a guaranteed gym introduction. Flexible ways to pay at checkout.`,
    },
    {
      q: "How long does it take?",
      a: "Most learners qualify in 8–16 weeks, studying online around their job.",
    },
  ];
}

function page(p: {
  key: LocalKey; slug: string; place: string; from: string;
  description: string; image: { src: string; alt: string }; local: LocalPage["local"];
  /** Page-specific questions, shown before the shared ones. */
  extraFaqs?: FaqItem[];
  /** False when an extra FAQ already gives the address (Pontefract). */
  sharedNapFaq?: boolean;
}): LocalPage {
  return {
    key: p.key,
    slug: p.slug,
    place: p.place,
    title: `Personal Trainer Course ${p.place} | NCFE Level 3 Online`,
    description: p.description,
    hero: hero(p.place, p.from, p.image),
    local: p.local,
    how: how(p.from),
    faqs: [...(p.extraFaqs ?? []), ...faqs({ withNap: p.sharedNapFaq ?? true })],
  };
}

export const LOCAL_PAGES: Record<LocalKey, LocalPage> = {
  pontefract: page({
    key: "pontefract",
    slug: "pontefract",
    place: "Pontefract",
    from: "Pontefract",
    description: `Personal trainer course for Pontefract: NCFE Level 2 & 3, fully online, from our Pontefract-based team. Qualify in 8–16 weeks, tutor within 24 hours. ${COURSE_PRICE_LABEL}.`,
    image: { src: "/learner-3.webp", alt: "PT Launch Lab learner who completed the online Level 3 personal training qualification" },
    local: {
      lead: `We are based in Pontefract. ${CENTRE_SENTENCE} ${ONLINE_SENTENCE}`,
    },
    // Its own NAP question replaces the shared one: one address answer per page.
    extraFaqs: [PONTEFRACT_FAQ],
    sharedNapFaq: false,
  }),
  westYorkshire: page({
    key: "westYorkshire",
    slug: "west-yorkshire",
    place: "West Yorkshire",
    from: "anywhere in West Yorkshire",
    description: `Online NCFE Level 2 & 3 personal trainer course for West Yorkshire, from a Pontefract-based team. Qualify in 8–16 weeks, tutor within 24 hours. ${COURSE_PRICE_LABEL}.`,
    image: { src: "/learner-2.webp", alt: "PT Launch Lab graduate qualified through the NCFE Level 3 personal trainer course" },
    local: {
      lead: `We are based in Pontefract, West Yorkshire. ${CENTRE_SENTENCE} ${ONLINE_SENTENCE}`,
      served: "Study from Wakefield, Leeds, Bradford, Huddersfield or anywhere in West Yorkshire.",
      partnersIntro: `Once you qualify, we can introduce you to our partner gyms in West Yorkshire. ${INTERVIEW_QUALIFIER}`,
      partners: westYorkshirePartners(),
    },
  }),
};

export const localUrl = (p: LocalPage) => `${BASE}/personal-trainer-course-${p.slug}`;

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

/** The qualification, exactly as the course JSON-LD and the learner prospectus name it. */
export const COURSE_CREDENTIAL =
  "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)";

/** Course JSON-LD: the provider is the site-wide organisation; offers from pricing.ts. */
export function courseSchema(p: LocalPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Personal Trainer Course ${p.place}: NCFE Level 2 & 3, online`,
    description: `Online NCFE Level 2 & 3 personal trainer course, studied from ${p.place} around your job. Qualify in 8–16 weeks. ${COURSE_PRICE_LABEL}, everything included.`,
    url: localUrl(p),
    provider: { "@id": `${BASE}/#org` },
    educationalCredentialAwarded: COURSE_CREDENTIAL,
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
    // 8 weeks: the fastest finish, as /courses (timeRequired P8W) and the /vsl
    // pages state. Weeks are a date component in ISO 8601, so it is P8W, not PT8W.
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "P8W" },
  };
}

/** Breadcrumbs after Home: Courses → Personal Trainer Course {place}. */
export function breadcrumbTrail(p: LocalPage) {
  return [
    { name: "Courses", url: `${BASE}/courses` },
    { name: `Personal Trainer Course ${p.place}`, url: localUrl(p) },
  ];
}
