// ─────────────────────────────────────────────────────────────────────────────
// WS2 Intelligence Layer — deterministic lead scoring + behaviour tags.
//
// Pure functions, no I/O — the "brain" of the profile layer. Given a visitor's
// rolling signal counters, produce a 0–100 lead score, a score band, and a set
// of behaviour tags marketing can segment on. Deterministic + side-effect-free
// so it's unit-testable and safe to run anywhere (server or edge). Tune the
// WEIGHTS as real conversion data comes in.
// ─────────────────────────────────────────────────────────────────────────────

/** Rolling per-visitor counters, aggregated from the visitor_events stream. */
export interface VisitorSignals {
  pageViews?: number;              // total pages seen
  guideViews?: number;             // knowledge-hub / SEO guide pages seen
  maxVideoPct?: number;            // deepest VSL/testimonial watch % (0–100)
  quizCompleted?: number;          // completed the fit quiz
  quizScore?: number;              // 0–100 if the quiz yields one
  careerPlannerCompleted?: number; // finished the Career Escape Plan
  salaryCalcUsed?: number;         // used the salary calculator
  downloads?: number;              // prospectus etc.
  liveRegistered?: number;         // registered for a live session
  liveAttended?: number;           // attended a live session
  bookCallStarted?: number;        // opened/started the book-a-call flow
  checkoutStarted?: number;        // hit Stripe checkout (InitiateCheckout)
  objectionLogged?: number;        // told us what's holding them back
  whatsappReplied?: number;        // replied on WhatsApp
  daysSinceFirstTouch?: number;    // recency context (not additive)
}

/** Objection reasons that flag a finance-sensitive visitor (see ObjectionCapture). */
const FINANCE_SIGNAL_TAGS = new Set(["too_expensive", "need_finance"]);

// Points per signal. Capped so no single behaviour dominates; the sum is
// clamped to 100. Weighted by how strongly each predicts an enrolment: warm,
// bottom-of-funnel actions (checkout, book-call, live-attend) score highest.
const WEIGHTS: Record<keyof VisitorSignals, number> = {
  pageViews: 1,
  guideViews: 3,
  maxVideoPct: 0,            // handled separately (scaled 0–15)
  quizCompleted: 8,
  quizScore: 0,             // handled separately (scaled 0–10)
  careerPlannerCompleted: 14,
  salaryCalcUsed: 6,
  downloads: 8,
  liveRegistered: 10,
  liveAttended: 18,
  bookCallStarted: 20,
  checkoutStarted: 28,
  objectionLogged: 6,
  whatsappReplied: 16,
  daysSinceFirstTouch: 0,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * 0–100 lead score. Additive across signals with per-signal caps, plus scaled
 * contributions for the two graded signals (video depth, quiz score).
 */
export function computeLeadScore(s: VisitorSignals): number {
  let score = 0;

  // Countable signals — cap the contribution of repeat-heavy ones.
  score += clamp((s.pageViews ?? 0) * WEIGHTS.pageViews, 0, 6);
  score += clamp((s.guideViews ?? 0) * WEIGHTS.guideViews, 0, 12);
  score += (s.quizCompleted ? WEIGHTS.quizCompleted : 0);
  score += (s.careerPlannerCompleted ? WEIGHTS.careerPlannerCompleted : 0);
  score += (s.salaryCalcUsed ? WEIGHTS.salaryCalcUsed : 0);
  score += clamp((s.downloads ?? 0) * WEIGHTS.downloads, 0, 12);
  score += (s.liveRegistered ? WEIGHTS.liveRegistered : 0);
  score += (s.liveAttended ? WEIGHTS.liveAttended : 0);
  score += (s.bookCallStarted ? WEIGHTS.bookCallStarted : 0);
  score += (s.checkoutStarted ? WEIGHTS.checkoutStarted : 0);
  score += (s.objectionLogged ? WEIGHTS.objectionLogged : 0);
  score += (s.whatsappReplied ? WEIGHTS.whatsappReplied : 0);

  // Graded signals.
  score += clamp(((s.maxVideoPct ?? 0) / 100) * 15, 0, 15);
  score += clamp(((s.quizScore ?? 0) / 100) * 10, 0, 10);

  return clamp(Math.round(score), 0, 100);
}

export type ScoreBand = "cold" | "warming" | "warm" | "hot";

export function scoreBand(score: number): ScoreBand {
  if (score >= 70) return "hot";
  if (score >= 45) return "warm";
  if (score >= 20) return "warming";
  return "cold";
}

/**
 * Behaviour tags for segmentation. Derived from the same signals (+ the visitor's
 * logged objection reason, if any). Additive — a visitor can hold several.
 */
export function deriveTags(s: VisitorSignals, objectionReason?: string): string[] {
  const tags = new Set<string>();

  if ((s.checkoutStarted ?? 0) > 0) tags.add("checkout-abandoner");
  if ((s.bookCallStarted ?? 0) > 0) tags.add("call-intent");
  if ((s.careerPlannerCompleted ?? 0) > 0) tags.add("planner-completed");
  if ((s.liveAttended ?? 0) > 0) tags.add("live-attendee");
  else if ((s.liveRegistered ?? 0) > 0) tags.add("live-registrant");
  if ((s.maxVideoPct ?? 0) >= 60) tags.add("video-engaged");
  if ((s.guideViews ?? 0) >= 3) tags.add("researcher");
  if ((s.whatsappReplied ?? 0) > 0) tags.add("whatsapp-active");
  if (objectionReason && FINANCE_SIGNAL_TAGS.has(objectionReason)) tags.add("finance-sensitive");
  if (objectionReason === "just_researching") tags.add("early-stage");
  if (objectionReason === "no_time") tags.add("time-poor");

  // High-intent = any bottom-of-funnel action.
  if (tags.has("checkout-abandoner") || tags.has("call-intent") || (s.whatsappReplied ?? 0) > 0) {
    tags.add("high-intent");
  }

  return Array.from(tags);
}

/** Merge a new event's counters into a visitor's existing signals (immutably). */
export function mergeSignals(prev: VisitorSignals, delta: Partial<VisitorSignals>): VisitorSignals {
  const out: VisitorSignals = { ...prev };
  for (const [k, v] of Object.entries(delta) as [keyof VisitorSignals, number | undefined][]) {
    if (v == null) continue;
    // maxVideoPct/quizScore are "max/latest" signals, not cumulative counts.
    if (k === "maxVideoPct" || k === "quizScore") {
      out[k] = Math.max(out[k] ?? 0, v);
    } else if (k === "daysSinceFirstTouch") {
      out[k] = v; // latest
    } else {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}
