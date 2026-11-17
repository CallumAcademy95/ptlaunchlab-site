// Partner-page enquiry follow-up emails (Nov 2026, first for PT Mentor Hub).
//
// Someone leaves their details on a partner's page (/api/lead, intent
// "partner_enquiry", gymSlug = the partner). They get the partner's sequence:
// email 1 straight away, then the rest on the days below, counted from the
// enquiry. It stops early when they enrol (a pp_sales row with their email),
// unsubscribe, or the lead is spam or TEST.
//
// The copy lives here, in the repo, so it is reviewed and tested like code
// (MailerLite automation bodies can't be edited through its API). Sending is in
// app/lib/server/partnerNurture.server.ts; this file is pure so node --test can
// load it.
//
// Copy rules (PT Mentor Hub agreement, clause 5): pay in full only, so never
// monthly, "pay later", finance or a provider's name; the Commitment always
// carries "Terms apply" and is never a refund; client results say results vary.

export type NurtureEmail = { day: number; subject: string; body: string };

export type PartnerSequence = {
  /** pp_partners.slug, also the lead's gym_slug. */
  slug: string;
  /** Display name in the From line, e.g. "Luke at PT Mentor Hub". */
  fromName: string;
  /** The partner's page, where every email links to. */
  pageUrl: string;
  emails: NurtureEmail[];
};

const PTMH_PAGE = "https://ptlaunchlab.co.uk/pt-mentor-hub-academy";
const PTMH_TERMS = "https://ptlaunchlab.co.uk/pt-mentor-hub-academy/commitment-terms";

export const PARTNER_SEQUENCES: Record<string, PartnerSequence> = {
  "pt-mentor-hub": {
    slug: "pt-mentor-hub",
    fromName: "Luke at PT Mentor Hub",
    pageUrl: PTMH_PAGE,
    emails: [
      {
        day: 0,
        subject: "Your PT Mentor Hub Academy details",
        body: `Hi {{first}},

Thanks for your interest. I'm Luke, founder of PT Mentor Hub.

Here's the short version. You qualify with the NCFE Level 2 & 3 through PT Launch Lab, online at your own pace with a personal tutor. When you start working as a PT, you get three months of mentoring with me:

- a 1-to-1 introduction call
- a 12-week roadmap to your first 10 clients
- monthly 1-to-1 check-ins
- daily group mentoring sessions

Everything is here: ${PTMH_PAGE}

Any questions, just reply. It comes straight to us.

Luke`,
      },
      {
        day: 2,
        subject: "Why great coaches still struggle",
        body: `Hi {{first}},

Being a great PT doesn't automatically make you a successful PT.

I've spent 12 years in gyms, at Virgin Active, PureGym and David Lloyd. The PTs I saw struggle weren't bad coaches. They just didn't have a system for getting clients.

Coaching is the skill. Business is the vehicle that gets you paid for it.

Most courses only teach you the first part. The Academy gives you both, from day one: your qualification, then mentoring the moment you start working as a PT.

${PTMH_PAGE}

Luke`,
      },
      {
        day: 4,
        subject: "Jacob, Jovan and Cameron",
        body: `Hi {{first}},

A few of the PTs I've mentored:

- Jacob added £990 to his monthly income in his first 4 weeks
- Jovan added £750 to his monthly income in his first 4 weeks
- Cameron added 7 clients to his diary in his first 5 weeks

These are individual results. Everyone's results are different, and they depend on the work you put in.

Each of them started with the same thing you'd get: an introduction call and a 12-week roadmap.

${PTMH_PAGE}

Luke`,
      },
      {
        day: 7,
        subject: "My commitment to you",
        body: `Hi {{first}},

Here's my commitment to every PT who joins the Academy:

If you don't earn back your investment within your first three months as a PT, I'll keep mentoring you for free until you do.

Terms apply, and you can read them in full here: ${PTMH_TERMS}

You also have a 14-day cooling-off period after you enrol.

${PTMH_PAGE}

Luke`,
      },
      {
        day: 10,
        subject: "Any questions?",
        body: `Hi {{first}},

The questions I get asked most:

Can I do it around my job?
Yes. It's online with no fixed class times, and most people finish in 8 to 16 weeks.

Do I need any experience?
No. It starts at Level 2, the foundations.

When does the mentoring start?
When you're working as a PT, so you can use it straight away.

Anything else, just hit reply.

${PTMH_PAGE}

Luke`,
      },
    ],
  },
};

export function sequenceFor(slug: string | null | undefined): PartnerSequence | undefined {
  return slug ? PARTNER_SEQUENCES[slug] : undefined;
}

const DAY_MS = 86_400_000;

export type NurtureLead = {
  created_at: string;
  nurture_step: number;
  nurture_stopped: string | null;
  is_spam: boolean;
  is_test: boolean;
  gym_slug: string | null;
};

/**
 * The index of the email this lead should get now, or null. One email per call:
 * a lead that fell behind (the cron was down) catches up one email at a time,
 * never several in one go.
 */
export function dueStep(lead: NurtureLead, now: Date): number | null {
  const seq = sequenceFor(lead.gym_slug);
  if (!seq || lead.is_spam || lead.is_test || lead.nurture_stopped) return null;
  const step = lead.nurture_step;
  if (step < 0 || step >= seq.emails.length) return null;
  const created = Date.parse(lead.created_at);
  if (!Number.isFinite(created)) return null;
  return now.getTime() >= created + seq.emails[step].day * DAY_MS ? step : null;
}

export function firstName(name: string): string {
  const f = name.trim().split(/\s+/)[0] ?? "";
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : "there";
}

export function unsubscribeUrl(email: string): string {
  return `https://ptlaunchlab.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain text and a light HTML version (links clickable), with the unsubscribe footer. */
export function renderEmail(seq: PartnerSequence, step: number, lead: { name: string; email: string }): { subject: string; text: string; html: string } {
  const e = seq.emails[step];
  const body = e.body.replace(/\{\{first\}\}/g, firstName(lead.name));
  const unsub = unsubscribeUrl(lead.email);
  const footer = `PT Mentor Hub Academy, qualification delivered by PT Launch Lab Ltd, Unit 3, Royals Business Park, King St, Pontefract WF8 4AH.\nYou're getting this because you asked for details on ${seq.pageUrl.replace("https://", "")}. Unsubscribe: ${unsub}`;
  const text = `${body}\n\n--\n${footer}`;
  const linkify = (s: string) => esc(s).replace(/https:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`);
  const paras = body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${linkify(p).replace(/\n/g, "<br>")}</p>`).join("");
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:560px">${paras}<p style="margin:24px 0 0;font-size:12px;color:#888">PT Mentor Hub Academy, qualification delivered by PT Launch Lab Ltd, Unit 3, Royals Business Park, King St, Pontefract WF8 4AH.<br>You're getting this because you asked for details on our page. <a href="${esc(unsub)}" style="color:#888">Unsubscribe</a></p></div>`;
  return { subject: e.subject, text, html };
}
