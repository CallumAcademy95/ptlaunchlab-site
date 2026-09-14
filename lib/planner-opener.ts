// The friendly first touch sent to a new career-planner lead.
//
// Pure: no network, no dates read from the clock beyond what is passed in, so
// the selection rules and the copy can be tested without touching MailerLite or
// Resend. The route is the only place that does I/O.
//
// WHY THIS EXISTS. The planner already sends two automated things: the plan
// result (instantly, via Resend) and the 7-day MailerLite sequence. Across ~10,000
// sends those sequences have produced ONE click. What actually gets a response is
// a short note that reads like a person asking a question — 16 sent by hand on
// 2026-09-14 all landed. This is that note, sent automatically, so a lead who
// arrives while nobody is watching still gets one.
//
// It asks for a REPLY, never a click. Replies go to info@, which the setter polls.

/** A lead as we need it, mapped out of a MailerLite subscriber. */
export interface PlannerLead {
  email: string;
  name: string | null;
  score: string | null;
  months: string | null;
  job: string | null;
  route: string | null;
  subscribedAt: string | null;
  openerSent: string | null;
  status: string;
}

/** Wait this long after signup before the opener goes. */
export const MIN_AGE_MINUTES = 120;
/**
 * Never open to a lead older than this. This is the backstop that matters: if
 * the sent-marker is ever cleared or a field rename silently empties it, the
 * blast radius is one week of leads rather than the whole list.
 */
export const MAX_AGE_DAYS = 7;
/** Per run. Leads trickle in; a burst would look automated, which is the one thing this must not look like. */
export const MAX_PER_RUN = 5;

export const SUBJECT = "your career planner result";

/** Never contact, on any channel. Hardcoded so the list cannot be lost with a config file. */
export const BLOCKED = new Set([
  "mickeyhogg_13@hotmail.co.uk", // unsubscribed 2026-09-07
  "hhjbv@gmail.com", // hard bounce
]);

const JOB_LINE: Record<string, string> = {
  desk: "Going from a desk job into fitness is the most common route we see, for what it’s worth.",
  trades:
    "Coming from a trade you’ve got more of the groundwork than you’d think — you already work with your hands and deal with people face to face all day.",
  health: "You’re already in a health role, so the science side of it should feel familiar.",
  // 'other' deliberately maps to nothing — a generic line is worse than no line.
};

const REFRESH_QUESTION =
  'It also put you on the "refresh" route, which means you’ve done a fitness qualification before. Worth me knowing whether that’s current or lapsed — it changes the route quite a bit.';

/**
 * First name only, and only when it is plausibly a first name.
 *
 * The planner's name field is free text: it has captured a surname alone
 * ("Parkinson"), full names, and single words. A wrong name in the first line is
 * worse than no name, so anything doubtful falls back to a bare "Hi".
 */
export function greetingName(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  if (first.length < 2 || first.length > 12) return null;
  if (!/^[A-Za-z][A-Za-z'’-]*$/.test(first)) return null;
  // Title case, so "JANE" and "jane" both read as Jane.
  return first[0].toUpperCase() + first.slice(1).toLowerCase();
}

export function isRefreshRoute(route: string | null | undefined): boolean {
  return /refresh/i.test(route ?? "");
}

/**
 * Signup time to epoch ms.
 *
 * Two shapes arrive here and only one of them is obvious. MailerLite returns
 * `"2026-09-14 09:30:45"` — UTC, but with nothing saying so, which a bare
 * `new Date()` reads as LOCAL time and shifts by an hour under BST. Anything
 * that already carries a zone is trusted as-is.
 *
 * Blindly appending "Z" to everything is what the first version did, which
 * turned every real ISO timestamp into `Invalid Date` — so every lead read as
 * "unreadable" and the cron would have sent nothing at all, silently, forever.
 */
export function parseSubscribedAt(value: string): number {
  const s = value.trim();
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) return new Date(s).getTime();
  return new Date(s.replace(" ", "T") + "Z").getTime();
}

/**
 * Should this lead get the opener right now?
 *
 * Every rejection returns a reason so a dry run explains itself — "0 to send" is
 * useless when you cannot tell "nobody qualifies" from "the query is wrong".
 */
export function eligibility(
  lead: PlannerLead,
  now: Date
): { ok: true } | { ok: false; reason: string } {
  if (lead.status !== "active") return { ok: false, reason: `status ${lead.status}` };
  if (BLOCKED.has(lead.email.toLowerCase())) return { ok: false, reason: "on the do-not-contact list" };
  if (lead.openerSent) return { ok: false, reason: `opener already sent ${lead.openerSent}` };
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(lead.email)) return { ok: false, reason: "unusable address" };
  if (!lead.subscribedAt) return { ok: false, reason: "no signup time" };

  const age = now.getTime() - parseSubscribedAt(lead.subscribedAt);
  if (Number.isNaN(age)) return { ok: false, reason: "unreadable signup time" };
  if (age < MIN_AGE_MINUTES * 60_000) {
    return { ok: false, reason: `too new (${Math.round(age / 60_000)}m, waiting ${MIN_AGE_MINUTES}m)` };
  }
  if (age > MAX_AGE_DAYS * 86_400_000) {
    return { ok: false, reason: `too old (${Math.round(age / 86_400_000)}d)` };
  }
  return { ok: true };
}

/** UK wall-clock hour, so sending hours survive BST without any date maths of our own. */
export function ukHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(now)
  ) % 24;
}

export function compose(lead: PlannerLead): string {
  const first = greetingName(lead.name);
  const jobLine = JOB_LINE[(lead.job ?? "").toLowerCase()] ?? "";

  // The score and month count come straight from what the planner told them.
  // If either is missing the sentence is rebuilt rather than printed with a gap —
  // "it came back at , with around  months" is the kind of thing that makes a
  // real email read as a mailmerge.
  const hasScore = !!(lead.score ?? "").trim();
  const hasMonths = !!(lead.months ?? "").trim();
  let opener: string;
  if (hasScore && hasMonths) {
    opener = `You filled in our career planner and it came back at ${lead.score}, with around ${lead.months} months before going full-time looks realistic.`;
  } else if (hasScore) {
    opener = `You filled in our career planner and it came back at ${lead.score}.`;
  } else {
    opener = "You filled in our career planner the other day.";
  }
  if (jobLine) opener += ` ${jobLine}`;

  const parts = [
    first ? `Hi ${first},` : "Hi,",
    "",
    opener,
    "",
    "I wanted to say hello properly rather than leave it at an automated result.",
    "",
    "Two things I’m always curious about:",
    "",
    "What got you thinking about this as a career in the first place?",
    "",
    "And is there anything about starting that’s worrying you?",
  ];

  if (isRefreshRoute(lead.route)) parts.push("", REFRESH_QUESTION);

  parts.push(
    "",
    "Answer one, both, or fire a question back at me instead — whatever’s useful. There’s no pitch coming. If you’re stuck on something I’d rather just help.",
    "",
    "Callum",
    "PT Launch Lab"
  );
  return parts.join("\n");
}
