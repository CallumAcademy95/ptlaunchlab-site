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
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS
// Add, remove, or reorder questions freely. Each option has a `scores` object
// that adds weighted points to one or more result buckets.
// ─────────────────────────────────────────────────────────────────────────────
export const questions: QuizQuestion[] = [
  {
    id: 1,
    question: 'Why do you really want to become a PT?',
    options: [
      { label: "I want to quit my job and do something I actually love",       scores: { onFloor: 1, online: 1, hybrid: 1 } },
      { label: "I want to help people change their bodies and their lives",    scores: { onFloor: 2, hybrid: 1 } },
      { label: "I want to build a real business — not just swap one job for another", scores: { online: 2, hybrid: 2 } },
      { label: "I'm already in fitness — I just need to make it my income",   scores: { alreadyQualified: 4 } },
    ],
  },
  {
    id: 2,
    question: 'What does your ideal day as a PT look like?',
    options: [
      { label: "Up early, clients back-to-back, energy in the gym all day",        scores: { onFloor: 3 } },
      { label: "Coaching clients from my phone or laptop — wherever I am",         scores: { online: 3 } },
      { label: "A mix — some in-person, some online, multiple income streams",     scores: { hybrid: 3 } },
      { label: "I've got clients — I just need more of them and better ones",      scores: { alreadyQualified: 4 } },
    ],
  },
  {
    id: 3,
    question: "What's your biggest fear about making this move?",
    options: [
      { label: "That I won't make enough money to replace my income",              scores: { online: 2, hybrid: 1 } },
      { label: "That I'll qualify and still not know how to get clients",          scores: { onFloor: 2, alreadyQualified: 1 } },
      { label: "That I'll end up stuck — trading hours for money with no freedom", scores: { online: 2, hybrid: 2 } },
      { label: "That I'll keep putting it off and never actually do it",           scores: { onFloor: 1, online: 1, hybrid: 1 } },
    ],
  },
  {
    id: 4,
    question: 'What does success look like for you in 12 months?',
    options: [
      { label: "A full client roster and waking up excited every day",             scores: { onFloor: 2 } },
      { label: "Earning more than I do now — with real flexibility",               scores: { online: 2, hybrid: 1 } },
      { label: "A PT business that runs online and gives me real freedom",         scores: { online: 3, hybrid: 1 } },
      { label: "Consistent income from PT — finally getting paid what I'm worth",  scores: { alreadyQualified: 3, hybrid: 1 } },
    ],
  },
  {
    id: 5,
    question: 'Where are you right now?',
    options: [
      { label: "Complete beginner — haven't qualified yet, but I'm ready",         scores: { onFloor: 1, online: 1, hybrid: 1 } },
      { label: "I've been researching but haven't taken the leap yet",             scores: { onFloor: 1 } },
      { label: "I'm ready to start — I just need the right support around me",    scores: { online: 1, hybrid: 1 } },
      { label: "Already qualified but not where I want to be",                    scores: { alreadyQualified: 5 } },
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
      'Working face-to-face with clients, building trust through presence, and delivering results you can see in real time. This is the most direct, most rewarding path into the PT industry — and it\'s where most great coaches start. You don\'t need to be online to build something meaningful.',
    nextStep:
      'Get your NCFE Level 3 qualification and start your career with real mentorship from day one. We\'ll help you get your first clients, price your sessions properly, and build a roster that actually pays you.',
    guideTitle: 'The On-Floor PT Starter Guide',
    guideDescription:
      'How to get your first 5 clients and build a full gym floor roster in 90 days.',
  },
  online: {
    key: 'online',
    title: 'The Online Coach',
    badge: 'Online Coaching Path',
    tagline: "Your PT business doesn't need four walls.",
    description:
      'You want to coach clients online, build systems, and create income that isn\'t tied to your physical presence. The online coaching model gives you scale, flexibility, and the ability to reach clients anywhere in the world. Done right, it\'s the most scalable business model in the fitness industry.',
    nextStep:
      'Get qualified, build your online presence from day one, and learn how to sign clients without a gym floor. We\'ll show you how PTs doing this right now built their online businesses from scratch.',
    guideTitle: 'The Online PT Launch Guide',
    guideDescription:
      'How to build your online coaching business from zero — clients, content, and recurring income.',
  },
  hybrid: {
    key: 'hybrid',
    title: 'The Hybrid Coach',
    badge: 'Hybrid Coaching Path',
    tagline: 'The best of both worlds.',
    description:
      'You want in-person impact and online income. A hybrid model gives you multiple revenue streams, real-world connection with clients, and the flexibility to scale without burning out. This is how modern PTs build sustainable, long-term businesses that don\'t depend on being in a gym 40 hours a week.',
    nextStep:
      'Get your Level 3, start building in-person, then grow your online arm alongside it. We\'ll teach you how to run both without dropping the ball — and when to make the shift as you scale.',
    guideTitle: 'The Hybrid PT Blueprint',
    guideDescription:
      'How to run in-person and online coaching at the same time — without burning out.',
  },
  alreadyQualified: {
    key: 'alreadyQualified',
    title: 'The Redirected PT',
    badge: 'Already Qualified — Needs Direction',
    tagline: "You're qualified. Now you need direction.",
    description:
      "You've done the hard work. You've got the qualification. But something isn't clicking — whether that's clients, income, niche, or confidence. What you need isn't another certificate. You need a mentor who can look at where you are, identify what's actually holding you back, and build a clear plan to get you moving.",
    nextStep:
      "Book a free strategy call. Let's figure out exactly where you're stuck and build a plan to get you earning consistently. No fluff, no generic advice — just an honest conversation about your situation.",
    guideTitle: 'The Qualified PT Restart Guide',
    guideDescription:
      'Already qualified but stuck? This guide breaks down the 5 most common reasons PTs fail to get traction — and how to fix each one.',
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
