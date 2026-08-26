// ─────────────────────────────────────────────────────────────────────────────
// PT Launch Lab — Career Path Quiz Configuration
// Edit this file to customise questions, options, scoring, and result types.
// ─────────────────────────────────────────────────────────────────────────────

export type ResultKey = 'onFloor' | 'online' | 'hybrid' | 'alreadyQualified';

export interface QuizOption {
  label: string;
  scores: Partial<Record<ResultKey, number>>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export interface ResultType {
  key: ResultKey;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  nextStep: string;
  guideTitle: string;
  guideDescription: string;
  // Identity-first result-page additions (Priority 1 — Result Page Rebuild):
  // - identitySubhead: the one-line "what this path actually is" framer
  // - personalValidation: emotional resonance bullets ("you want X, not Y")
  // - objectionCollapse: confidence-builder bullets ("most start with zero...")
  // - futurePacing: 12-month vision bullets ("you could be...")
  identitySubhead: string;
  personalValidation: { intro: string; bullets: string[]; close: string };
  objectionCollapse: { intro: string; bullets: string[]; close: string };
  futurePacing: { intro: string; bullets: string[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS
// Add, remove, or reorder questions freely. Each option has a `scores` object
// that adds weighted points to one or more result buckets.
// ─────────────────────────────────────────────────────────────────────────────
export const questions: QuizQuestion[] = [
  {
    id: 1,
    question: "What's driving you toward PT?",
    options: [
      { label: "I hate my job. I want work that means something",        scores: { onFloor: 1, online: 1, hybrid: 1 } },
      { label: "I want to change lives, not just clock in and out",       scores: { onFloor: 2, hybrid: 1 } },
      { label: "I want to own a business, not just have a job",          scores: { online: 2, hybrid: 2 } },
      { label: "I'm already in fitness. I need to make it pay",          scores: { alreadyQualified: 4 } },
    ],
  },
  {
    id: 2,
    question: "What does your ideal working life look like?",
    options: [
      { label: "In the gym, face to face, building real relationships",  scores: { onFloor: 3 } },
      { label: "Online, coaching from anywhere, on my own terms",        scores: { online: 3 } },
      { label: "A mix of in-person clients and online income",           scores: { hybrid: 3 } },
      { label: "I'm already coaching. I need more clients and better pay", scores: { alreadyQualified: 4 } },
    ],
  },
  {
    id: 3,
    question: "What's actually holding you back?",
    options: [
      { label: "The cost. I can't justify it financially right now",     scores: { onFloor: 1, online: 1, hybrid: 1 } },
      { label: "My job. I'm scared to leave the security behind",        scores: { onFloor: 2, hybrid: 1 } },
      { label: "Myself. What if I qualify and still can't get clients",  scores: { onFloor: 2, alreadyQualified: 1 } },
      { label: "Nothing. I'm nearly ready, just need a final push",      scores: { online: 1, hybrid: 1 } },
    ],
  },
  {
    id: 4,
    question: "In 12 months, what does winning look like?",
    options: [
      { label: "Full client roster. Love every Monday morning",          scores: { onFloor: 2 } },
      { label: "Earning more than I do now with the freedom to match",   scores: { online: 2, hybrid: 1 } },
      { label: "A PT business I can run from my phone",                  scores: { online: 3, hybrid: 1 } },
      { label: "Consistent income. Finally getting paid what I'm worth", scores: { alreadyQualified: 3, hybrid: 1 } },
    ],
  },
  {
    id: 5,
    question: "How close are you to actually doing this?",
    options: [
      { label: "I'm ready. I just need to pull the trigger",             scores: { online: 1, hybrid: 1 } },
      { label: "Probably the next few months. Still figuring it out",    scores: { onFloor: 1 } },
      { label: "I want to but I keep talking myself out of it",          scores: { onFloor: 1, online: 1, hybrid: 1 } },
      { label: "I'm already qualified. I just need to make it work",     scores: { alreadyQualified: 5 } },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RESULT TYPES
// Four personalised outcomes. The highest scoring bucket wins.
// ─────────────────────────────────────────────────────────────────────────────
export const results: Record<ResultKey, ResultType> = {
  onFloor: {
    key: 'onFloor',
    title: 'The On-Floor PT',
    badge: 'In-Person Coaching Path',
    tagline: "You're built for real, in-person coaching.",
    description:
      "Working face to face with clients, building trust through presence, delivering results you can see in real time. This is the most direct and most rewarding path into PT. It's where most great coaches start and where real careers are built. You don't need to be online to build something meaningful.",
    nextStep:
      "Get your Level 2 & 3 fast-track and we'll guide you from day one — qualification, your first clients, and a guaranteed gym interview when you're done. Our team has hired 500+ PTs. We know exactly what gyms look for and we prepare you for it.",
    guideTitle: 'The On-Floor PT Starter Guide',
    guideDescription:
      'How to get your first 5 clients and build a full gym floor roster in 90 days.',
    identitySubhead:
      'A real, in-person coaching career — the most direct route into PT and where the strongest coaches are built.',
    personalValidation: {
      intro: "You're probably not chasing fitness fame. You want:",
      bullets: [
        'meaningful work that uses what you actually love',
        'real human connection — clients you see grow week by week',
        'better income than your current job gives you',
        'more control over your days, your time, your future',
      ],
      close: "Fitness is the thing you keep coming back to. This path takes that seriously.",
    },
    objectionCollapse: {
      intro: "The good news? Most people who land here start with:",
      bullets: [
        "zero paying clients",
        "no coaching experience",
        "no formal fitness qualifications",
        "no idea where the first step actually is",
      ],
      close: "You're not behind. You're at the same start line everyone else was — and we've put hundreds of them through.",
    },
    futurePacing: {
      intro: "12 months from now you could be:",
      bullets: [
        "coaching real clients on a real gym floor — confidently",
        "earning from something you'd actually talk about at a dinner party",
        "working for yourself, your hours, your terms",
        "building a career around health and fitness that compounds for decades",
      ],
    },
  },
  online: {
    key: 'online',
    title: 'The Online Coach',
    badge: 'Online Coaching Path',
    tagline: "Your PT business doesn't need four walls.",
    description:
      "You want to coach clients online, build systems, and create income that isn't tied to your physical presence. The online coaching model gives you scale, flexibility, and the ability to reach clients anywhere. Done right, it's the most scalable way to build a PT business.",
    nextStep:
      "Get your Level 2 & 3 fast-track around your current job, build your online presence from day one, and learn how to sign clients without a gym floor. Mentorship included — not just a qualification. A guaranteed gym interview when you're ready to go in-person too.",
    guideTitle: 'The Online PT Launch Guide',
    guideDescription:
      'How to build your online coaching business from zero. Clients, content, and recurring income.',
    identitySubhead:
      "An online coaching business — income that isn't tied to a gym floor, hours that aren't tied to anyone else's clock.",
    personalValidation: {
      intro: "You're not after a 9-5 with a tracksuit. You want:",
      bullets: [
        "a business you can run from a laptop and a phone",
        "income that scales without trading every hour for cash",
        "freedom to coach from anywhere — not stuck to one gym",
        "to build something that's actually yours, not someone else's PT roster",
      ],
      close: "You see fitness as a vehicle for the life you want, not the destination itself.",
    },
    objectionCollapse: {
      intro: "Reality check — almost every successful online coach started with:",
      bullets: [
        "no audience and no email list",
        "no PT qualification and no clients",
        "no Instagram following worth mentioning",
        "no clue how to package an offer or price it",
      ],
      close: "What they had was a system. We give you the same one — qualification, mentorship, and the playbook.",
    },
    futurePacing: {
      intro: "12 months from now you could be:",
      bullets: [
        "running an online coaching business from your phone",
        "earning recurring monthly income from a small, loyal client base",
        "coaching clients on three continents while keeping your evenings free",
        "off the salary treadmill — building equity in something you own",
      ],
    },
  },
  hybrid: {
    key: 'hybrid',
    title: 'The Hybrid Coach',
    badge: 'Hybrid Coaching Path',
    tagline: 'In-person energy. Online income. Both.',
    description:
      "You want real connection with clients and the freedom that comes with online income. A hybrid model gives you multiple revenue streams without being stuck in a gym 40 hours a week. This is how the best modern PTs build businesses that actually last.",
    nextStep:
      "Get your Level 2 & 3 fast-track, start building in-person with a guaranteed gym interview, then grow your online income alongside it. We've built this exact model ourselves — £500K+ as independent PTs — and we show you step by step how to do the same.",
    guideTitle: 'The Hybrid PT Blueprint',
    guideDescription:
      'How to run in-person and online coaching at the same time without burning out.',
    identitySubhead:
      "A flexible route into fitness — in-person coaching for the relationships, online income for the scale.",
    personalValidation: {
      intro: "You're not interested in the all-or-nothing pitch. You want:",
      bullets: [
        "meaningful coaching work — but not 40 hours stuck in one gym",
        "multiple income streams so one bad month doesn't break the year",
        "flexibility to design your week instead of clocking in to someone else's",
        "real control over your career — not at the mercy of a gym manager's rota",
      ],
      close: "And you genuinely care about fitness — it's not just a side interest.",
    },
    objectionCollapse: {
      intro: "Most students who fit this path start with:",
      bullets: [
        "no clients in either column",
        "no coaching qualifications",
        "no business experience whatsoever",
        "no idea which lever to pull first",
      ],
      close: "The hybrid model isn't harder — it's just unfamiliar. Once you've seen the playbook, the steps are obvious.",
    },
    futurePacing: {
      intro: "12 months from now you could be:",
      bullets: [
        "coaching in-person clients three days a week, online clients the rest",
        "earning from sessions AND recurring monthly retainers",
        "working from anywhere when life calls for it",
        "building a career that grows with you instead of pinning you down",
      ],
    },
  },
  alreadyQualified: {
    key: 'alreadyQualified',
    title: 'The Redirected PT',
    badge: 'Already Qualified',
    tagline: "You've done the hard part. Now let's make it work.",
    description:
      "You've got the qualification. But something isn't clicking. Whether that's clients, income, niche, or just knowing what to do next. You don't need another certificate. You need someone to look at where you are, tell you what's actually holding you back, and help you build a plan that gets you moving.",
    nextStep:
      "Book a free strategy call. We'll work out exactly where you're stuck and build a clear plan to get you earning consistently. No fluff, no generic advice. Just an honest conversation about your situation.",
    guideTitle: 'The Qualified PT Restart Guide',
    guideDescription:
      'Already qualified but stuck? This guide breaks down the 5 most common reasons PTs fail to get traction and how to fix each one.',
    identitySubhead:
      "You've already done the hard part. What you need now is a system that turns the qualification into actual income.",
    personalValidation: {
      intro: "You're past the 'should I qualify?' stage. You want:",
      bullets: [
        "real clients — not friends doing you a favour",
        "consistent income, not random PAYG sessions every few weeks",
        "to feel like the qualification was worth it",
        "an honest look at what's actually blocking you",
      ],
      close: "You don't need another certificate. You need someone to look at the picture and tell you what's broken.",
    },
    objectionCollapse: {
      intro: "Most qualified PTs we work with are stuck on the same things:",
      bullets: [
        "they don't know their niche or how to pick one",
        "they undercharge because they're scared to lose the few clients they have",
        "they have no marketing system — just hope and Instagram",
        "they're isolated, with nobody in their corner who's done this",
      ],
      close: "Every one of these is fixable in a 15-minute conversation. The blocker is almost never the qualification.",
    },
    futurePacing: {
      intro: "12 months from now you could be:",
      bullets: [
        "running a full, profitable client roster you actually enjoy",
        "earning what your qualification said you'd earn",
        "confident, niched, and respected in your local market",
        "back to remembering why you got into this in the first place",
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE
// Tallies scores across all answers and returns the winning result key.
// In a tie, priority order is: alreadyQualified > hybrid > online > onFloor
// ─────────────────────────────────────────────────────────────────────────────
const TIE_PRIORITY: ResultKey[] = ['alreadyQualified', 'hybrid', 'online', 'onFloor'];

export function calculateResult(answers: QuizOption[]): ResultKey {
  const scores: Record<ResultKey, number> = {
    onFloor: 0,
    online: 0,
    hybrid: 0,
    alreadyQualified: 0,
  };

  for (const answer of answers) {
    for (const [key, value] of Object.entries(answer.scores)) {
      scores[key as ResultKey] += value ?? 0;
    }
  }

  const maxScore = Math.max(...Object.values(scores));

  // Return the highest-priority key that has the max score
  return TIE_PRIORITY.find((k) => scores[k] === maxScore) ?? 'onFloor';
}
