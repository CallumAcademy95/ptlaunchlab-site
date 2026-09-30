// What has actually happened with a partner gym, in order.
//
// The point of deriving this rather than asking anyone to log it: the history
// already exists and has never been shown. Agreement signed, portal login
// created, first sign-in, every sale with the learner's name, every payout.
// Five tables that each know one part of the story and are never read
// together.
//
// So the CRM opens with a real timeline on day one instead of an empty box
// inviting someone to start typing — which is the usual reason an internal CRM
// dies in week two.
//
// Pure: it takes rows and returns rows, no I/O, so the ordering and the
// wording can be tested without a database.

export type TimelineKind =
  | "signed"
  | "login_created"
  | "first_login"
  | "sale"
  | "payout"
  | "note";

export interface TimelineEvent {
  at: string;              // ISO
  kind: TimelineKind;
  title: string;
  detail?: string | null;
  /** Money in pence, where the event is about money. */
  amountPence?: number | null;
  /** True for things WE did to them, false for things THEY did. */
  byUs: boolean;
}

export interface PartnerRow {
  gym_name: string;
  created_at: string | null;
  agreement_signed_at: string | null;
  agreement_version: string | null;
}

export interface UserRow {
  email: string;
  full_name: string | null;
  created_at: string | null;
  last_login_at: string | null;
}

export interface SaleRow {
  learner_name: string | null;
  learner_email: string | null;
  plan_type: string | null;
  amount_paid_pence: number | null;
  commission_pence: number | null;
  status: string;
  enrolled_at: string | null;
  created_at: string;
}

export interface PayoutRow {
  period_label: string | null;
  total_pence: number;
  status: string;
  invoice_number: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface NoteRow {
  body: string;
  author: string | null;
  created_at: string;
}

const money = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: pence % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/**
 * Build the timeline, newest first.
 *
 * ⚠️ `last_login_at` is a LAST login, not a first one. Calling it "first
 * signed in" would be wrong for anyone who has logged in more than once, and
 * there is no login history table to do better. It is labelled as a last
 * login and dated accordingly — an honest single point rather than an
 * invented one.
 */
export function buildPartnerTimeline(input: {
  partner: PartnerRow;
  users: UserRow[];
  sales: SaleRow[];
  payouts: PayoutRow[];
  notes?: NoteRow[];
}): TimelineEvent[] {
  const { partner, users, sales, payouts, notes = [] } = input;
  const out: TimelineEvent[] = [];

  if (partner.agreement_signed_at) {
    out.push({
      at: partner.agreement_signed_at,
      kind: "signed",
      title: "Partnership agreement signed",
      detail: partner.agreement_version ? `Version ${partner.agreement_version}` : null,
      byUs: false,
    });
  }

  for (const u of users) {
    if (u.created_at) {
      out.push({
        at: u.created_at,
        kind: "login_created",
        title: "Portal login created",
        detail: u.full_name ? `${u.full_name} · ${u.email}` : u.email,
        byUs: true,
      });
    }
    if (u.last_login_at) {
      out.push({
        at: u.last_login_at,
        kind: "first_login",
        title: "Last signed in",
        detail: u.email,
        byUs: false,
      });
    }
  }

  for (const s of sales) {
    if (s.status === "voided") continue;
    const when = s.enrolled_at ?? s.created_at;
    const who = s.learner_name || s.learner_email || "A learner";
    out.push({
      at: when,
      kind: "sale",
      title: `${who} enrolled`,
      detail: [s.plan_type, s.amount_paid_pence != null ? `paid ${money(s.amount_paid_pence)}` : null]
        .filter(Boolean)
        .join(" · ") || null,
      amountPence: s.commission_pence ?? null,
      byUs: false,
    });
  }

  for (const p of payouts) {
    // An unpaid payout row is a plan, not an event. Only what left the bank
    // belongs on a history.
    if (p.status !== "paid" || !p.paid_at) continue;
    out.push({
      at: p.paid_at,
      kind: "payout",
      title: `Paid ${money(p.total_pence)}`,
      detail: [p.period_label, p.invoice_number].filter(Boolean).join(" · ") || null,
      amountPence: p.total_pence,
      byUs: true,
    });
  }

  for (const n of notes) {
    out.push({
      at: n.created_at,
      kind: "note",
      title: n.body,
      detail: n.author,
      byUs: true,
    });
  }

  return out
    .filter((e) => e.at && !Number.isNaN(Date.parse(e.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/**
 * How long since anything happened at all.
 *
 * This is the number the list page should sort on. Four of the nine partners
 * have produced nothing, and "quiet for 89 days" is the fact that should reach
 * someone, not a row that looks the same as every other row.
 *
 * Returns null when there is no history at all, which is itself worth showing.
 */
export function daysSinceLastActivity(events: TimelineEvent[], now = Date.now()): number | null {
  const latest = events.find((e) => Date.parse(e.at) <= now);
  if (!latest) return null;
  return Math.floor((now - Date.parse(latest.at)) / 86_400_000);
}

/**
 * How long since the PARTNER did something — not since we did something to
 * them.
 *
 * The distinction is the whole point of `byUs`. Creating a login for a gym,
 * or paying an invoice, are our actions. Counting them as partner activity is
 * how a dead partner comes to look merely slow: 6fit's page read "last
 * activity 63 days ago" when the only event in its history was us making them
 * an account they have never opened.
 *
 * Returns null when the partner has never done anything at all, which is the
 * honest answer and a different fact from "a long time ago".
 */
export function daysSinceTheirActivity(events: TimelineEvent[], now = Date.now()): number | null {
  return daysSinceLastActivity(events.filter((e) => !e.byUs), now);
}

/**
 * A one-line read on where this partner stands, derived rather than typed.
 *
 * Deliberately blunt. A CRM that calls a gym which has never logged in and
 * produced nothing "active" is worse than no CRM, because it launders the
 * problem into a green label.
 */
export type PartnerHealth = "producing" | "engaged" | "quiet" | "never started";

export function partnerHealth(input: {
  events: TimelineEvent[];
  hasEverLoggedIn: boolean;
  learners: number;
  /** How many portal accounts exist, used or not. */
  logins?: number;
  now?: number;
}): { health: PartnerHealth; why: string } {
  const { events, hasEverLoggedIn, learners, logins = hasEverLoggedIn ? 1 : 0, now = Date.now() } = input;

  // Deliberately THEIR activity, not all activity. A payout we sent last week
  // says nothing about whether the gym is still sending us people.
  const idle = daysSinceTheirActivity(events, now);
  const plural = `${learners} learner${learners === 1 ? "" : "s"}`;

  if (learners > 0 && idle !== null && idle <= 90) {
    return { health: "producing", why: `${plural}, active in the last 90 days` };
  }
  if (!hasEverLoggedIn && learners === 0) {
    // A login that exists and has never been opened is a different problem
    // from no login at all — one needs a nudge, the other needs an account.
    return {
      health: "never started",
      why: logins > 0
        ? "Login created but never used, no learners"
        : "No portal login, no learners",
    };
  }
  if (learners > 0) {
    return {
      health: "quiet",
      why: idle === null
        ? `${plural}, but nothing from them on record`
        : `${plural}, but nothing from them for ${idle} days`,
    };
  }
  if (hasEverLoggedIn) {
    return { health: "engaged", why: "Has signed in, no learners yet" };
  }
  return { health: "quiet", why: idle === null ? "No recorded activity" : `Nothing for ${idle} days` };
}
