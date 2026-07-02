// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Hub taxonomy (WS3 #4, PTLL Growth OS)
//
// Single source of truth that turns the standalone SEO/content pages into an
// interlinked, docs-style hub (topic clusters) rather than a flat list of
// landing pages. Both /hub (the index) and <RelatedGuides> (in-page sibling
// links) read from here, so adding a page in one place links it everywhere.
//
// Only REAL, indexable URLs are listed — the [location] programmatic pages all
// canonical to a single URL, so they're represented by their topic, not every
// permutation. Ordered start-of-journey → decision.
// ─────────────────────────────────────────────────────────────────────────────

export type HubClusterId =
  | "start"
  | "qualifications"
  | "study"
  | "career"
  | "situation"
  | "tools"
  | "proof";

export interface HubCluster {
  id: HubClusterId;
  title: string;
  blurb: string;
}

export interface HubEntry {
  href: string;
  title: string;
  blurb: string;
  cluster: HubClusterId;
  kind?: "guide" | "tool" | "proof" | "page";
}

export const HUB_CLUSTERS: HubCluster[] = [
  { id: "start", title: "Start here", blurb: "The big-picture route into personal training in the UK." },
  { id: "qualifications", title: "Qualifications & recognition", blurb: "What's legit, what gyms accept, and what the NCFE L3 actually is." },
  { id: "study", title: "How you study", blurb: "Online, flexible, and built around a full-time job." },
  { id: "career", title: "Career & earnings", blurb: "What you can earn, and going self-employed." },
  { id: "situation", title: "Is it right for you?", blurb: "Honest answers for career-changers, returners and later starters." },
  { id: "tools", title: "Free tools", blurb: "Plan your move and picture the numbers before you commit." },
  { id: "proof", title: "Proof & people", blurb: "Real graduates, the founders, and the podcast." },
];

export const HUB_ENTRIES: HubEntry[] = [
  // Start here
  { href: "/how-to-become-a-personal-trainer-uk", title: "How to become a personal trainer in the UK", blurb: "The full step-by-step route: qualifications, cost, and timeline.", cluster: "start", kind: "guide" },
  { href: "/become-a-personal-trainer-uk", title: "Become a personal trainer", blurb: "Where to start if the gym's already your happy place.", cluster: "start", kind: "guide" },
  { href: "/best-personal-trainer-course-uk", title: "Best personal trainer course in the UK", blurb: "How to tell a real qualification from a £29 weekend cert.", cluster: "start", kind: "guide" },
  { href: "/personal-trainer-course-near-me", title: "Personal trainer courses near you", blurb: "Study online from anywhere in the UK, assess at any gym.", cluster: "start", kind: "guide" },

  // Qualifications & recognition
  { href: "/are-online-pt-qualifications-recognised-by-uk-gyms", title: "Are online PT qualifications recognised by UK gyms?", blurb: "The honest answer on what employers and CIMSPA actually accept.", cluster: "qualifications", kind: "guide" },
  { href: "/courses", title: "The NCFE Level 3 Diploma", blurb: "Ofqual-regulated Gym Instructing + PT (603/4388/6), with mentorship.", cluster: "qualifications", kind: "page" },

  // How you study
  { href: "/online-personal-trainer-course-uk", title: "Online personal trainer course", blurb: "Fully online, self-paced, video-assessed — no fixed class times.", cluster: "study", kind: "guide" },
  { href: "/personal-trainer-course-with-business-support", title: "PT course with business support", blurb: "Why the qualification alone isn't enough — and what closes the gap.", cluster: "study", kind: "guide" },
  { href: "/personal-trainer-mentorship-uk", title: "Personal trainer mentorship", blurb: "The £500 Mentorship Hub that teaches you to get clients.", cluster: "study", kind: "guide" },

  // Career & earnings
  { href: "/personal-trainer-salary-uk", title: "Personal trainer salary in the UK", blurb: "What PTs really earn — employed, self-employed and online.", cluster: "career", kind: "guide" },
  { href: "/self-employed-personal-trainer-uk", title: "Becoming a self-employed PT", blurb: "Rates, insurance, and building a book that pays the bills.", cluster: "career", kind: "guide" },

  // Is it right for you?
  { href: "/vsl/career-change-to-personal-trainer", title: "Career change to personal training", blurb: "A believable transition from a job you've outgrown — without quitting on Monday.", cluster: "situation", kind: "guide" },
  { href: "/vsl/retrain-as-a-personal-trainer", title: "Retraining as a PT", blurb: "Coming back after a break, a baby, or a lapsed qualification.", cluster: "situation", kind: "guide" },
  { href: "/too-old-to-become-a-personal-trainer", title: "Am I too old to become a PT?", blurb: "Why your 30s, 40s and 50s can be an advantage, not a barrier.", cluster: "situation", kind: "guide" },

  // Free tools
  { href: "/career-planner", title: "Career Escape Plan", blurb: "8 questions → when you could go full-time, what you'd earn, and how.", cluster: "tools", kind: "tool" },
  { href: "/pt-salary-calculator", title: "PT salary calculator", blurb: "Estimate your earning potential by region, hours and rate.", cluster: "tools", kind: "tool" },
  { href: "/quiz", title: "60-second PT fit quiz", blurb: "See whether PT is a realistic next step for your situation.", cluster: "tools", kind: "tool" },

  // Proof & people
  { href: "/graduates", title: "Our graduates", blurb: "Real people who qualified and built coaching careers with us.", cluster: "proof", kind: "proof" },
  { href: "/podcast", title: "The podcast", blurb: "Honest conversations on the industry, from people who hire PTs.", cluster: "proof", kind: "page" },
  { href: "/about", title: "About PT Launch Lab", blurb: "Gym owners who've hired 500+ trainers — and why we built this.", cluster: "proof", kind: "page" },
];

/** Entries in a given cluster, in declared order. */
export function entriesForCluster(id: HubClusterId): HubEntry[] {
  return HUB_ENTRIES.filter((e) => e.cluster === id);
}

/**
 * Sibling guides for in-page interlinking. Given the current page href, returns
 * up to `limit` other entries from the same cluster (falls back to nearby
 * clusters if the current page's cluster is thin). Never returns the current
 * page itself.
 */
export function relatedEntries(currentHref: string, limit = 3): HubEntry[] {
  const current = HUB_ENTRIES.find((e) => e.href === currentHref);
  const pool = current
    ? HUB_ENTRIES.filter((e) => e.cluster === current.cluster && e.href !== currentHref)
    : [];
  if (pool.length >= limit) return pool.slice(0, limit);
  // Top up with other guides/tools so a thin cluster still shows useful links.
  const extras = HUB_ENTRIES.filter(
    (e) => e.href !== currentHref && !pool.includes(e) && e.kind !== "page"
  );
  return [...pool, ...extras].slice(0, limit);
}
