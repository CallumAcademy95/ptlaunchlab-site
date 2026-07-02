// ─────────────────────────────────────────────────────────────────────────────
// Career Planning Suite — deterministic engine (WS3, PTLL Growth OS)
//
// One flow, one lead. Takes the 8-step inputs and returns a full "career escape
// plan": readiness score, realistic full-time date, first-year income, the
// recommended qualification route, finance option, business model and payback.
//
// All numbers are ILLUSTRATIVE estimates from the tunable constants below —
// they exist to help someone picture the move, not to promise earnings. Keep
// the tone honest (see brand-profile voice). Adjust the constants as real PTLL
// graduate data comes in (this is exactly what the Proof Engine will feed).
// ─────────────────────────────────────────────────────────────────────────────

export type CareerJob =
  | "desk" | "trades" | "retail" | "hospitality" | "warehouse" | "forces" | "health" | "other";

export type GymExperience = "none" | "regular" | "trained-others" | "qualified-lapsed";

export interface CareerPlannerInputs {
  currentSalary: number;       // £ / year (current job)
  monthlyExpenses: number;     // £ / month (bills + outgoings)
  savings: number;             // £ (available buffer)
  job: CareerJob;
  region: string;              // one of REGION_RATES keys
  experience: GymExperience;
  targetMonthlyIncome: number; // £ / month wanted from PT
  hoursPerWeek: number;        // hours/week they can commit to PT
  confidence: number;          // 1–5
  risk: number;                // 1–5
}

export interface FinancePlan {
  name: string;
  upfront: number;             // £ paid up front
  monthly: number;             // £ / month (0 = pay in full)
  months: number;              // number of monthly instalments
  note: string;
}

export interface FinanceBreakdown {
  roiYear1: number;            // year-1 income ÷ course price (e.g. 9.2)
  breakEvenWeeks: number;      // weeks of PT income to recoup the course fee
  threeYearGross: number;      // cumulative gross income over years 1–3
  monthlyPTIncomeYear1: number;// £ / month, year one
  plans: FinancePlan[];
  planNote: string;
}

export interface CareerPlannerResult {
  readinessScore: number;      // 0–100
  readinessBand: string;
  readinessMessage: string;
  quitMonths: number;
  quitLabel: string;
  year1Income: number;         // £
  steadyIncome: number;        // £ (year 2–3 potential)
  incomeNote: string;
  recommendedRoute: string;
  routeNote: string;
  financeOption: string;
  financeNote: string;
  businessModel: string;
  businessNote: string;
  paybackSessions: number;
  paybackNote: string;
  sessionRate: number;         // £ / session used in the model
  finance: FinanceBreakdown;   // ROI / finance module
}

// ── Tunable constants ────────────────────────────────────────────────────────

export const COURSE_PRICE = 1599; // standard NCFE L3 price (direct/ads)

// £ per 1-hour PT session by UK region (illustrative market rates).
const REGION_RATES: Record<string, number> = {
  "London": 45,
  "South East": 40,
  "South West": 33,
  "East of England": 35,
  "West Midlands": 32,
  "East Midlands": 30,
  "Yorkshire & the Humber": 30,
  "North West": 32,
  "North East": 28,
  "Wales": 28,
  "Scotland": 32,
  "Northern Ireland": 28,
};
export const REGIONS = Object.keys(REGION_RATES);
const DEFAULT_RATE = 32;

// Regions where in-person gym-floor demand is strongest.
const CITY_REGIONS = new Set(["London", "South East", "West Midlands", "North West", "Scotland"]);

// Steady-state utilisation (share of available hours actually billed once
// established) by experience. New PTs never bill 100% of the hours they offer.
const STEADY_UTIL: Record<GymExperience, number> = {
  "none": 0.45,
  "regular": 0.50,
  "trained-others": 0.60,
  "qualified-lapsed": 0.65,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round(n);
const WEEKS_PER_YEAR = 48; // allow for holidays/illness

export function computeCareerPlan(raw: CareerPlannerInputs): CareerPlannerResult {
  // Sanitise inputs
  const currentSalary = clamp(raw.currentSalary || 0, 0, 500_000);
  const monthlyExpenses = clamp(raw.monthlyExpenses || 0, 0, 50_000);
  const savings = clamp(raw.savings || 0, 0, 5_000_000);
  const hoursPerWeek = clamp(raw.hoursPerWeek || 0, 0, 60);
  const targetMonthlyIncome = clamp(raw.targetMonthlyIncome || 0, 0, 50_000);
  const confidence = clamp(raw.confidence || 3, 1, 5);
  const risk = clamp(raw.risk || 3, 1, 5);
  const experience: GymExperience = raw.experience in STEADY_UTIL ? raw.experience : "none";

  const sessionRate = REGION_RATES[raw.region] ?? DEFAULT_RATE;

  // ── Income projection ──────────────────────────────────────────────────────
  const billableCap = Math.min(hoursPerWeek, 30);       // realistic weekly ceiling
  const steadyUtil = STEADY_UTIL[experience];
  const year1Util = steadyUtil * 0.7;                    // first year ramps up
  const year1Income = round(billableCap * year1Util * sessionRate * WEEKS_PER_YEAR);
  const steadyIncome = round(billableCap * Math.min(steadyUtil * 1.25, 0.8) * sessionRate * WEEKS_PER_YEAR);

  // ── Readiness score (0–100) ────────────────────────────────────────────────
  const runwayMonths = monthlyExpenses > 0 ? savings / monthlyExpenses : 12;
  const expScore = { none: 10, regular: 20, "trained-others": 28, "qualified-lapsed": 30 }[experience];
  const confScore = (confidence / 5) * 20;
  const riskScore = (risk / 5) * 15;
  const finScore = Math.min(runwayMonths / 6, 1) * 20;
  const hoursScore = Math.min(hoursPerWeek / 20, 1) * 15;
  const readinessScore = clamp(round(expScore + confScore + riskScore + finScore + hoursScore), 0, 100);

  let readinessBand: string;
  if (readinessScore >= 80) readinessBand = "Prime — go for it";
  else if (readinessScore >= 60) readinessBand = "Strong — time to plan your exit";
  else if (readinessScore >= 40) readinessBand = "Getting there — build the foundations";
  else readinessBand = "Early — worth starting now, part-time";

  // "What to work on" = lowest-scoring dimension (normalised).
  const dims: [string, number][] = [
    ["experience", expScore / 30],
    ["confidence", confScore / 20],
    ["financial", finScore / 20],
    ["hours", hoursScore / 15],
  ];
  const weakest = dims.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  const readinessMessage = {
    experience: "Your fastest win is hands-on coaching experience — the qualification gives you clients to practise on from week one.",
    confidence: "Confidence is the gap, not capability. Structured mentorship (not just a certificate) is what closes it.",
    financial: "Build a small savings buffer while you train part-time — you don't need to quit on day one.",
    hours: "Even a few focused hours a week is enough to start building a client base alongside your job.",
  }[weakest] ?? "You've got the ingredients — the next step is a clear plan and a real qualification.";

  // ── Realistic full-time date ───────────────────────────────────────────────
  // Months of part-time building before PT income safely covers your outgoings,
  // reduced by how far your savings can bridge the gap.
  let rampMonths = 12;
  rampMonths += { none: 0, regular: -1, "trained-others": -3, "qualified-lapsed": -4 }[experience];
  rampMonths -= (confidence - 3);                 // confident → sooner
  if (hoursPerWeek >= 20) rampMonths -= 2;
  else if (hoursPerWeek >= 12) rampMonths -= 1;
  else if (hoursPerWeek < 8) rampMonths += 2;
  if (risk >= 4) rampMonths -= 1;
  rampMonths = clamp(rampMonths, 3, 18);

  const quitMonths = clamp(round(rampMonths - Math.min(runwayMonths, 6) * 0.6), 1, 24);
  const quitLabel =
    quitMonths <= 2
      ? "You could realistically go full-time within a couple of months"
      : `You could realistically go full-time in ~${quitMonths} months`;

  // ── Recommended qualification route ────────────────────────────────────────
  const recommendedRoute =
    experience === "qualified-lapsed"
      ? "NCFE Level 3 (refresh) + PT Launch Lab Mentorship"
      : "NCFE Level 3 Diploma + PT Launch Lab Mentorship";
  const routeNote =
    experience === "qualified-lapsed"
      ? "You've done this before — the L3 gets you current and CIMSPA-recognised, and the mentorship covers the business side that's changed most."
      : "Ofqual-regulated and CIMSPA-recognised — plus the mentorship that actually teaches you how to get clients, not just pass.";

  // ── Finance option ─────────────────────────────────────────────────────────
  let financeOption: string, financeNote: string;
  if (savings >= COURSE_PRICE) {
    financeOption = `Pay in full — £${COURSE_PRICE.toLocaleString()}`;
    financeNote = "You've got it covered, and paying up front saves vs the instalment plan.";
  } else if (savings >= 599) {
    financeOption = "£599 deposit + 5 × £200";
    financeNote = "Keeps your savings buffer intact while you start straight away.";
  } else {
    financeOption = "Deposit plan / 0% finance";
    financeNote = "Spread the cost and start now — your first few clients can cover the payments.";
  }

  // ── Business model ─────────────────────────────────────────────────────────
  let businessModel: string, businessNote: string;
  if (hoursPerWeek < 12) {
    businessModel = "Online coaching";
    businessNote = "Flexible and low-overhead — the best fit to build alongside your current job.";
  } else if (CITY_REGIONS.has(raw.region) && experience !== "none") {
    businessModel = "In-person / gym-floor PT";
    businessNote = `Strong face-to-face demand in ${raw.region} — the fastest route to a full book locally.`;
  } else {
    businessModel = "Hybrid (online + in-person)";
    businessNote = "Start online around your job, add in-person sessions as your reputation grows.";
  }

  // ── Payback ────────────────────────────────────────────────────────────────
  const paybackSessions = Math.ceil(COURSE_PRICE / sessionRate);
  const paybackNote = `About ${paybackSessions} sessions at ${raw.region || "UK"} rates (£${sessionRate}/session) pays your course back — most new PTs clear that inside their first month or two.`;

  // ── Finance / ROI module ───────────────────────────────────────────────────
  // How the £1,599 stacks up against what the plan projects you'll earn.
  const weeklyYear1 = year1Income / WEEKS_PER_YEAR;
  const breakEvenWeeks = weeklyYear1 > 0 ? clamp(Math.ceil(COURSE_PRICE / weeklyYear1), 1, 52) : 0;
  const roiYear1 = COURSE_PRICE > 0 ? Math.round((year1Income / COURSE_PRICE) * 10) / 10 : 0;
  const year2Income = round((year1Income + steadyIncome) / 2); // ramps between yr1 and steady
  const threeYearGross = year1Income + year2Income + steadyIncome;
  const monthlyPTIncomeYear1 = round(year1Income / 12);

  const plans: FinancePlan[] = [
    {
      name: "Pay in full",
      upfront: COURSE_PRICE,
      monthly: 0,
      months: 0,
      note: "Simplest — one payment, nothing to manage, and it saves against the instalment plan.",
    },
    {
      name: "Deposit + instalments",
      upfront: 599,
      monthly: 200,
      months: 5,
      note: "Most popular — £599 deposit then 5 × £200. Start straight away and keep your savings buffer.",
    },
  ];

  const planCover = monthlyPTIncomeYear1 > 0 ? Math.max(1, Math.round(monthlyPTIncomeYear1 / 200)) : 0;
  const planNote =
    planCover >= 2
      ? `On the instalment plan, your projected first-year PT income (~£${monthlyPTIncomeYear1.toLocaleString()}/mo) covers the £200 monthly payment roughly ${planCover}× over once you start taking clients.`
      : "The £200 monthly instalment is designed to be covered by just a couple of PT sessions a week once you qualify.";

  const finance: FinanceBreakdown = {
    roiYear1,
    breakEvenWeeks,
    threeYearGross,
    monthlyPTIncomeYear1,
    plans,
    planNote,
  };

  let incomeNote: string;
  if (currentSalary > 0 && steadyIncome >= currentSalary) {
    incomeNote = `At a full book (~£${steadyIncome.toLocaleString()}) you'd beat your current £${currentSalary.toLocaleString()} salary — and packages, online clients and rate rises push it higher.`;
  } else if (targetMonthlyIncome > 0 && targetMonthlyIncome * 12 > steadyIncome) {
    incomeNote = `Your £${targetMonthlyIncome.toLocaleString()}/mo goal is above a solo book at ${hoursPerWeek}h/wk — reachable by raising rates, packages or online scale (covered in the mentorship).`;
  } else {
    incomeNote = "These are conservative solo-PT estimates; packages, online clients and rate rises push them higher.";
  }

  return {
    readinessScore, readinessBand, readinessMessage,
    quitMonths, quitLabel,
    year1Income, steadyIncome, incomeNote,
    recommendedRoute, routeNote,
    financeOption, financeNote,
    businessModel, businessNote,
    paybackSessions, paybackNote,
    sessionRate,
    finance,
  };
}
