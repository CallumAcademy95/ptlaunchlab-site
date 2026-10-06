// What the setter is doing, derived from the rows.
//
// WHY THIS SCREEN EXISTS
//
// The gym outreach stamps `gym_prospects.replied_at` when it can link an
// inbound email back to the gym it wrote to. It cannot always: the reconciler
// refuses to domain-match a shared mail host, because two gyms on gmail.com are
// not the same gym and crediting one's reply to the other is worse than missing
// it.
//
// That rule is right and it has a cost, measured on 2026-10-05. Twelve gyms were
// emailed at 09:10. Two replied within half an hour — Nitrogym at 09:40, and PFP
// Exeter at 09:22 saying "No thanks but I appreciate the message". Only Nitrogym
// was linked. PFP writes from pfpexeter@gmail.com, so its reply sat in
// `consultations` with nothing anywhere showing it had arrived, and the outreach
// screen honestly reported one reply out of twelve.
//
// So this reads the conversation tables directly. A reply that cannot be
// attributed to a prospect is still a reply, and it is still a person waiting.

export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  primary_channel: string | null;
  setter_status: string | null;
  setter_stage: string | null;
  setter_intent: number | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  ai_unanswered_count: number | null;
  unsubscribed: boolean | null;
  created_at: string;
}

/**
 * Has someone written to us more recently than we have written to them?
 *
 * The single most useful thing this screen can say. Everything else is
 * classification; this is a person who said something and is waiting.
 *
 * A lead with an inbound and no outbound at all counts — that is the worst
 * version of it, not an edge case to skip.
 */
export function waitingOnUs(lead: LeadRow): boolean {
  if (!lead.last_inbound_at) return false;
  if (lead.unsubscribed) return false;
  if (!lead.last_outbound_at) return true;
  return Date.parse(lead.last_inbound_at) > Date.parse(lead.last_outbound_at);
}

/**
 * Does a human need to look at this?
 *
 * Only the two states where the setter has actually stood down: it escalated
 * deliberately, or somebody paused it.
 *
 * ⚠️ NOT `ai_unanswered_count`, despite the name. That column counts the
 * messages WE have sent since they last replied — engine.ts sets it to 1 on
 * every outbound and back to 0 on every inbound, and the re-engagement cron
 * reads 1 as "nudge them once more". It means "waiting on THEM", which is the
 * opposite of needing a human.
 *
 * Including it put 24 of 26 live conversations under a red "needs a human"
 * badge, which is the normal resting state of cold outreach and tells the
 * reader nothing. An alert that fires on everything is not an alert.
 */
export function needsHuman(lead: LeadRow): boolean {
  if (lead.unsubscribed) return false;
  return lead.setter_status === "human" || lead.setter_status === "paused";
}

/**
 * How many messages we have sent since they last said anything.
 *
 * Zero means their reply is the most recent thing in the thread. The column is
 * named ai_unanswered_count, which reads as "the AI failed to answer" and means
 * nothing of the sort.
 */
export function nudgesSinceTheySpoke(lead: LeadRow): number {
  return lead.ai_unanswered_count ?? 0;
}

export function isClosed(lead: LeadRow): boolean {
  return lead.setter_status === "closed" || Boolean(lead.unsubscribed);
}

export interface LeadCounts {
  live: number;
  waiting: number;
  needsHuman: number;
  closed: number;
}

export function leadCounts(leads: LeadRow[]): LeadCounts {
  return {
    live: leads.filter((l) => !isClosed(l)).length,
    waiting: leads.filter((l) => !isClosed(l) && waitingOnUs(l)).length,
    needsHuman: leads.filter((l) => !isClosed(l) && needsHuman(l)).length,
    closed: leads.filter(isClosed).length,
  };
}

/**
 * Most urgent first: waiting on us, then needing a human, then by recency.
 *
 * Sorting by last activity alone buries a three-day-old unanswered question
 * under a conversation the bot handled by itself an hour ago, which is the
 * wrong way round for a screen whose job is to show what has been dropped.
 */
export function byUrgency(leads: LeadRow[]): LeadRow[] {
  const rank = (l: LeadRow) => (isClosed(l) ? 3 : waitingOnUs(l) ? 0 : needsHuman(l) ? 1 : 2);
  const when = (l: LeadRow) =>
    Date.parse(l.last_inbound_at ?? l.last_outbound_at ?? l.created_at) || 0;
  return leads.slice().sort((a, b) => rank(a) - rank(b) || when(b) - when(a));
}

/** How long they have been waiting, in whole hours. */
export function hoursWaiting(lead: LeadRow, now: number): number | null {
  if (!waitingOnUs(lead) || !lead.last_inbound_at) return null;
  return Math.floor((now - Date.parse(lead.last_inbound_at)) / 3_600_000);
}

const CHANNELS: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  messenger: "Messenger",
  instagram: "Instagram",
  web: "Web",
  lead_ads: "Lead ad",
};

export function channelLabel(channel: string | null): string {
  return channel ? (CHANNELS[channel] ?? channel) : "Unknown";
}
