// ─────────────────────────────────────────────────────────────────────────────
// Proof Engine — tagged graduate database (WS3 #2, PTLL Growth OS)
//
// One source of truth for social proof. Every graduate is tagged (avatar,
// previous job, region, specialism) so any landing page / ad / email can pull
// AVATAR-MATCHED proof instead of the same generic carousel. The <ProofStrip>
// component and the /graduates wall both read from here.
//
// SEED DATA is the real, verified Google reviews already published on the site
// (Reviews.tsx) + Gemma's video story (VideoTestimonial.tsx). Tags are set ONLY
// where the graduate's own words support them — we do NOT invent previous jobs
// or income figures. Untagged graduates still show as general proof; the
// graduate-capture workflow (Sprint 2) backfills richer tags + income as real
// cohort data comes in. When it does, that same data tunes careerPlanner.ts.
// ─────────────────────────────────────────────────────────────────────────────

// The three ad avatars (aligned with the portfolio doc + cold-quiz funnel).
export type Avatar = "switcher" | "starter" | "returner";

export const AVATAR_LABELS: Record<Avatar, string> = {
  switcher: "Career changer",
  starter: "Gym starter",
  returner: "Returning to fitness",
};

// Short human blurb for filter UI / section subheads.
export const AVATAR_BLURBS: Record<Avatar, string> = {
  switcher: "Left a job they'd outgrown to build a coaching career.",
  starter: "Turned time already spent in the gym into a real qualification.",
  returner: "Came back to fitness — after a break, a baby, or a lapsed qual.",
};

export interface Graduate {
  id: string;
  name: string;
  course: string;              // qualification label
  avatar?: Avatar;             // matched avatar (only where their words support it)
  previousJob?: string;        // only where stated
  region?: string;             // only where known
  specialism?: string;         // e.g. "Online coaching", "Gym floor", "Business & marketing"
  incomeNote?: string;         // ONLY real, verified figures — omitted otherwise
  quote: string;
  videoUrl?: string;           // YouTube embed URL
  photo?: string;              // /public asset path
  verified: boolean;           // verified Google review / on-record
}

// ── Seed graduates ───────────────────────────────────────────────────────────
// Order is roughly "strongest proof first". Avatar tags inferred conservatively
// from each person's own quote; blanks are intentional (general proof).
export const GRADUATES: Graduate[] = [
  {
    id: "gemma",
    name: "Gemma",
    course: "Level 3 Personal Training",
    avatar: "switcher",
    previousJob: "Corporate (burnout)",
    specialism: "Own PT business",
    quote:
      "Went from corporate burnout to running my own PT business. Watch how I made the leap — and what life looks like on the other side.",
    videoUrl: "https://www.youtube.com/embed/pAm1jvDKRM0",
    verified: true,
  },
  {
    id: "jonathan-plummer",
    name: "Jonathan Plummer",
    course: "Level 3 Personal Training",
    specialism: "Business & marketing",
    quote:
      "I completed my PT qualification with PT Launch Lab around Christmas time and I couldn't recommend them enough. What I love is the support once you've completed the course. Most PTs fail because they don't understand the business and marketing side — and PT Launch Lab help you improve in all these areas.",
    verified: true,
  },
  {
    id: "rachel-waldock",
    name: "Rachel Waldock",
    course: "Level 2 & Level 3 PT",
    avatar: "switcher",
    quote:
      "From start to finish, the course was structured, supportive, and everything I needed to make the career change I'd been putting off for years. Couldn't be happier with the experience.",
    verified: true,
  },
  {
    id: "rebecca-davies",
    name: "Rebecca Davies",
    course: "Level 3 Personal Training",
    avatar: "returner",
    previousJob: "New parent",
    quote:
      "The support I received was second to none. After having my baby, I thought I'd struggle to find the time — but Callum and the team were so supportive and helpful every step of the way.",
    verified: true,
  },
  {
    id: "michelle",
    name: "Michelle",
    course: "Level 3 Personal Training",
    avatar: "switcher",
    previousJob: "Full-time job",
    quote:
      "Highly recommend using PT Launch Lab. I work full time on a busy schedule, but they allowed me to complete the coursework and learn in my own time. I am now a qualified Level 3 Personal Trainer and I couldn't have done it without the team!",
    verified: true,
  },
  {
    id: "terri-altilar",
    name: "Terri Altilar",
    course: "Level 3 Personal Training",
    avatar: "switcher",
    previousJob: "Full-time job",
    quote:
      "Highly recommend PT Launch Lab, especially if you want flexible learning. I work full time and generally very busy, however they allowed me to learn at my own rate while still ensuring I had the support and knowledge every step of the way.",
    verified: true,
  },
  {
    id: "matthew-bell",
    name: "Matthew Bell",
    course: "Level 3 Personal Training",
    specialism: "Building own business",
    quote:
      "Fantastic from start to finish. The support didn't stop once I qualified — they've continued to offer guidance and help that's been invaluable as I build my business.",
    verified: true,
  },
  {
    id: "rebecca-sykes",
    name: "Rebecca Sykes",
    course: "Level 3 Personal Training",
    quote:
      "Wow, absolutely amazing place to train and learn to become a qualified PT! I honestly wouldn't have been able to do it without the support from Callum all throughout. If you're looking to become qualified then I can 100% recommend these guys!",
    verified: true,
  },
  {
    id: "annie-chomba-kilbride",
    name: "Annie Chomba-Kilbride",
    course: "Level 3 Personal Training",
    quote:
      "My training experience with PT Launch Lab has been amazing. I've gained new skills, knowledge and confidence. I was able to learn at my own pace and was well supported throughout.",
    verified: true,
  },
  {
    id: "jordan-wills",
    name: "Jordan Wills",
    course: "Level 3 Personal Training",
    specialism: "Building own business",
    quote:
      "I got qualified through PT Launch Lab who were really helpful throughout the process and have continued to help me get my PT business up and running. Highly recommended.",
    verified: true,
  },
  {
    id: "mel-hume",
    name: "Mel Hume",
    course: "Level 3 Personal Training",
    quote:
      "Passed my Level 3 Personal Training yesterday with PT Launch Lab. Loved every minute. Callum was on hand to answer all my questions. Thank you for all the help and support.",
    verified: true,
  },
  {
    id: "declan-marsden",
    name: "Declan Marsden",
    course: "Level 3 Personal Training",
    quote:
      "Officially passed my Level 3 personal training qualification today. Shout-out to Cal, Chris and Craig for all the support. If you're thinking about becoming a personal trainer then do not hesitate to go to PT Launch Lab.",
    verified: true,
  },
  {
    id: "leon-jones",
    name: "Leon Jones",
    course: "Level 3 Personal Training",
    quote:
      "Friendly, responsive and very helpful. Helped me every step of the way and provided great information and knowledge. Would highly recommend to anyone wanting their PT certification.",
    verified: true,
  },
  {
    id: "sam-jordan",
    name: "Sam Jordan",
    course: "Level 3 Personal Training",
    quote:
      "Great experience all round. They make getting your qualification so simple with an easy-to-use online learning platform. Highly recommend.",
    verified: true,
  },
];

// ── Query helpers ────────────────────────────────────────────────────────────

/** Distinct specialisms present in the DB (for filter UI). */
export const GRADUATE_SPECIALISMS = Array.from(
  new Set(GRADUATES.map((g) => g.specialism).filter(Boolean) as string[])
).sort();

export interface GraduateFilter {
  avatar?: Avatar | "all";
  specialism?: string | "all";
  search?: string;
}

/** Filter the graduate wall. Empty/`all` filters pass everything through. */
export function filterGraduates(f: GraduateFilter = {}): Graduate[] {
  const q = (f.search || "").trim().toLowerCase();
  return GRADUATES.filter((g) => {
    if (f.avatar && f.avatar !== "all" && g.avatar !== f.avatar) return false;
    if (f.specialism && f.specialism !== "all" && g.specialism !== f.specialism) return false;
    if (q) {
      const hay = `${g.name} ${g.quote} ${g.course} ${g.previousJob ?? ""} ${g.specialism ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Avatar-matched proof for a landing page / ad section. Returns up to `count`
 * graduates: avatar matches first (video proof prioritised), topped up with
 * strong general proof so a page never renders an empty strip.
 */
export function graduatesForAvatar(avatar: Avatar, count = 3): Graduate[] {
  const score = (g: Graduate) =>
    (g.avatar === avatar ? 2 : 0) + (g.videoUrl ? 1 : 0);
  return [...GRADUATES]
    .sort((a, b) => score(b) - score(a))
    .slice(0, count);
}
