// app/lib/careerPlannerV2.ts
// Career Planner v2 — pure, no imports. Bands a lead on buying intent and builds
// the plan a stranger reads. No income forecast, no mentor name, 8–16 weeks only.

export const WHY_VALUES = ["outgrown_job", "love_training", "freedom", "already_helping", "other"] as const;
export const JOB_VALUES = ["desk", "trades", "retail", "hospitality", "warehouse", "forces", "health", "other"] as const;
export const GOAL_VALUES = ["full_time", "part_time", "side_income", "alongside", "not_sure"] as const;
export const TIMEFRAME_VALUES = ["now", "30_days", "1_3_months", "3_6_months", "researching"] as const;
export const BLOCKER_VALUES = ["cost", "time", "confidence", "clients", "where_to_start", "other"] as const;
export const HOURS_VALUES = ["lt3", "3_5", "5_10", "10_plus"] as const;
export const TRAINING_VALUES = ["regular", "sometimes", "not_now", "coached_others", "qualified_lapsed"] as const;
export const PAYMENT_VALUES = ["full", "monthly", "unsure", "save_first"] as const;

export type Why = (typeof WHY_VALUES)[number];
export type Job = (typeof JOB_VALUES)[number];
export type Goal = (typeof GOAL_VALUES)[number];
export type Timeframe = (typeof TIMEFRAME_VALUES)[number];
export type Blocker = (typeof BLOCKER_VALUES)[number];
export type Hours = (typeof HOURS_VALUES)[number];
export type Training = (typeof TRAINING_VALUES)[number];
export type Payment = (typeof PAYMENT_VALUES)[number];
export type Band = "prime" | "strong" | "nurture";

export interface PlannerAnswers {
  why: Why; job: Job; goal: Goal; timeframe: Timeframe; blocker: Blocker; blockerNote: string | null;
  hours: Hours; training: Training; region: string; town: string; payment: Payment;
}

export const CONSENT_TEXT = "OK for PT Launch Lab to WhatsApp, text or call me about my plan. I can reply STOP any time.";

// Illustrative £/session by region (carried over from v1). Shown only as a labelled range.
const REGION_RATES: Record<string, number> = {
  "London": 45, "South East": 40, "South West": 33, "East of England": 35, "West Midlands": 32,
  "East Midlands": 30, "Yorkshire & the Humber": 30, "North West": 32, "North East": 28,
  "Wales": 28, "Scotland": 32, "Northern Ireland": 28,
};
export const REGIONS = Object.keys(REGION_RATES);
const DEFAULT_RATE = 32;

// ── Question copy (UI renders from this; tests pin the values) ──────────────
export const QUESTIONS = {
  why: { title: "What's got you thinking about becoming a PT?", options: [
    ["outgrown_job", "I've outgrown my job"], ["love_training", "I love training and want it to be my work"],
    ["freedom", "I want more freedom and flexibility"], ["already_helping", "I already help people train"], ["other", "Something else"]] },
  job: { title: "What do you do for work now?", options: [
    ["desk", "Office / desk job"], ["trades", "Trades / manual"], ["retail", "Retail / sales"], ["hospitality", "Hospitality"],
    ["warehouse", "Warehouse / driving"], ["forces", "Forces / ex-forces"], ["health", "Health / care"], ["other", "Something else"]] },
  goal: { title: "What would you like personal training to become?", options: [
    ["full_time", "A full-time career"], ["part_time", "Part-time alongside my job"], ["side_income", "A side income"],
    ["alongside", "Work in fitness alongside something else"], ["not_sure", "Not sure yet"]] },
  timeframe: { title: "When would you realistically like to start?", options: [
    ["now", "Now"], ["30_days", "In the next 30 days"], ["1_3_months", "In 1–3 months"], ["3_6_months", "In 3–6 months"], ["researching", "Just researching"]] },
  blocker: { title: "What's most likely to stop you?", options: [
    ["cost", "The cost"], ["time", "Finding the time"], ["confidence", "Not sure I'd be good enough"],
    ["clients", "Finding clients once qualified"], ["where_to_start", "Don't know where to start"], ["other", "Something else"]] },
  hours: { title: "How many hours a week could you study?", options: [
    ["lt3", "Under 3"], ["3_5", "3–5"], ["5_10", "5–10"], ["10_plus", "10+"]] },
  training: { title: "Where are you with training?", options: [
    ["regular", "I train regularly"], ["sometimes", "I train sometimes"], ["not_now", "Not at the moment"],
    ["coached_others", "I've coached friends or family"], ["qualified_lapsed", "I was qualified before (lapsed)"]] },
  payment: { title: "If you went ahead, how would you most likely pay?", options: [
    ["full", "Pay in full"], ["monthly", "Spread it monthly"], ["unsure", "Not sure yet"], ["save_first", "I'd need to save first"]] },
} as const;

export const TIMEFRAME_PHRASE: Record<Timeframe, string> = {
  now: "straight away", "30_days": "in the next month", "1_3_months": "in the next few months",
  "3_6_months": "later this year", researching: "when the time's right",
};
export const BLOCKER_PHRASE: Record<Blocker, string> = {
  cost: "the cost", time: "finding the time", confidence: "whether you'd be good enough",
  clients: "finding clients once you're qualified", where_to_start: "knowing where to start", other: "getting started",
};

export function bandFor(a: Pick<PlannerAnswers, "timeframe" | "goal">): Band {
  if (a.timeframe === "now" || a.timeframe === "30_days") return a.goal === "not_sure" ? "strong" : "prime";
  if (a.timeframe === "1_3_months") return "strong";
  return "nurture";
}
export const BAND_SCORE: Record<Band, number> = { prime: 90, strong: 60, nurture: 30 };

export interface PlanButton { label: string; href: string }
export interface CareerPlanV2 {
  band: Band;
  headline: string;
  goal: string;
  route: string;
  timeline: { start: string; qualify: string; next: string };
  concern: { title: string; answer: string };
  rateRange: { region: string; low: number; high: number };
  paymentLine: string;
  buttons: PlanButton[];
}

const HEADLINE: Record<Band, string> = {
  prime: "You're ready to start.",
  strong: "You're close. Let's plan your start.",
  nurture: "A good time to start planning.",
};
const JOB_FROM: Record<Job, string> = {
  desk: "an office job", trades: "a trade", retail: "retail work", hospitality: "hospitality",
  warehouse: "warehouse or driving work", forces: "the forces", health: "health or care work", other: "your current work",
};
const GOAL_TO: Record<Exclude<Goal, "not_sure">, string> = {
  full_time: "full-time work as a PT",
  part_time: "part-time PT work, alongside your current job",
  side_income: "a side income from personal training",
  alongside: "working in fitness alongside something else",
};
const QUALIFY: Record<Hours, string> = {
  "10_plus": "about 8 weeks", "5_10": "about 10–12 weeks", "3_5": "about 14–16 weeks", lt3: "about 16 weeks, at your own pace",
};
const START_OFFSET: Record<Timeframe, number | null> = { now: 0, "30_days": 1, "1_3_months": 2, "3_6_months": 4, researching: null };
const CONCERN: Record<Blocker, { title: string; answer: string }> = {
  cost: { title: "The cost", answer: "You can pay in full or spread it: a deposit today, then monthly payments. The options are below." },
  time: { title: "Finding the time", answer: "It's studied online at your own pace, so it fits around the job you already have. Most people study in the evenings and at weekends." },
  confidence: { title: "Whether you'd be good enough", answer: "You're not on your own. A personal tutor supports you throughout, and assessments can be resubmitted until your tutor is happy." },
  clients: { title: "Finding clients once you're qualified", answer: "That's what the business mentorship is for: working out who you want to coach, how you'll reach them, and what to offer. See what's included below." },
  where_to_start: { title: "Knowing where to start", answer: "This plan is the start. The next step is below, and you can talk it through with us first if you'd rather." },
  other: { title: "Something else", answer: "Book a 15-minute call and tell us what's on your mind. If it's not right for you, we'll say so." },
};
const PAYMENT_LINE: Record<Payment, string> = {
  full: "You said you'd most likely pay in full.",
  monthly: "You said you'd most likely spread it monthly. Both options are below.",
  unsure: "Not sure how you'd pay yet? Both options are below.",
  save_first: "Saving first? You can start with a deposit and spread the rest. Both options are below.",
};
const BTN = {
  start: { label: "Start now", href: "/enrol" },
  call: { label: "Book a 15-minute call", href: "/book-call" },
  course: { label: "See what the course covers", href: "/courses" },
  notReady: { label: "Not ready yet", href: "/courses" },
};

const round5 = (n: number) => Math.round(n / 5) * 5;

function monthName(now: Date, offset: number): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  return d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
}

export function computeCareerPlanV2(a: PlannerAnswers, now: Date = new Date()): CareerPlanV2 {
  const band = bandFor(a);
  const from = JOB_FROM[a.job] ?? "your current work";
  const goal = a.goal === "not_sure"
    ? `Work out whether personal training is right for you, coming from ${from}.`
    : `Move from ${from} towards ${GOAL_TO[a.goal]}.`;
  const route = a.training === "qualified_lapsed"
    ? "Refresh your qualification online, get back on the gym floor, then build up your client hours at your own pace."
    : a.goal === "full_time"
      ? "Qualify online alongside work, build coaching experience, then build towards full-time."
      : "Qualify online alongside work, build coaching experience, then decide when PT becomes part-time or full-time.";
  const off = START_OFFSET[a.timeframe];
  const base = REGION_RATES[a.region] ?? DEFAULT_RATE;
  const buttons = band === "prime" ? [BTN.start, BTN.call, BTN.notReady]
    : band === "strong" ? [BTN.call, BTN.start, BTN.notReady]
    : [BTN.course, BTN.call, BTN.start];
  return {
    band,
    headline: HEADLINE[band],
    goal,
    route,
    timeline: {
      start: off === null ? "Whenever you're ready" : monthName(now, off),
      qualify: QUALIFY[a.hours],
      next: "Start coaching your first clients, part-time at first",
    },
    concern: CONCERN[a.blocker],
    rateRange: { region: REGION_RATES[a.region] ? a.region : "the UK", low: round5(base - 5), high: round5(base + 10) },
    paymentLine: PAYMENT_LINE[a.payment],
    buttons,
  };
}

export function isUkMobileE164(p: string): boolean {
  return /^\+447\d{9}$/.test(p);
}
