// The CRM's rules, with no React, no Supabase and no env.
//
// Everything the list and the panel decide — which rows a URL means, what
// "waiting" looks like, who wrote a message, which mode changes are allowed —
// lives here so `node --test` can pin it. The pages only fetch and render.
//
// Filtering happens in memory over the whole crm_people view (low hundreds of
// rows). The URL is never passed to the database: it is parsed into a typed
// CrmQuery through fixed whitelists, and anything not on a list is dropped.

// ─── The row ────────────────────────────────────────────────────────────

export type PersonKind = "person" | "site_only";
export type PlannerBand = "prime" | "strong" | "nurture";

export interface CrmPerson {
  id: string;
  kind: PersonKind;
  name: string | null;
  email: string | null;
  phone: string | null;
  primary_channel: string | null;
  setter_status: string | null;
  setter_stage: string | null;
  setter_intent: number | null;
  planner_band: PlannerBand | null;
  already_qualified: boolean;
  setter_profile_id: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  created_at: string;
  unsubscribed: boolean;
  dnc_reason: string | null;
  site_lead_id: string | null;
  site_intent: string | null;
  site_page_path: string | null;
  site_gym_slug: string | null;
  site_lead_count: number;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

/**
 * One raw view row, made safe to render.
 *
 * The view is being built in parallel and may arrive with a column missing or
 * renamed; any column that is absent reads as null/false rather than crashing
 * the page. Rows without an id are dropped by the caller.
 */
export function normalisePerson(raw: Record<string, unknown>): CrmPerson | null {
  const id = str(raw.id);
  if (!id) return null;
  const band = str(raw.planner_band);
  return {
    id,
    kind: raw.kind === "site_only" ? "site_only" : "person",
    name: str(raw.name),
    email: str(raw.email),
    phone: str(raw.phone),
    primary_channel: str(raw.primary_channel),
    setter_status: str(raw.setter_status),
    setter_stage: str(raw.setter_stage),
    setter_intent: num(raw.setter_intent),
    planner_band: band === "prime" || band === "strong" || band === "nurture" ? band : null,
    already_qualified: raw.already_qualified === true,
    setter_profile_id: str(raw.setter_profile_id),
    utm_source: str(raw.utm_source),
    utm_campaign: str(raw.utm_campaign),
    utm_content: str(raw.utm_content),
    last_inbound_at: str(raw.last_inbound_at),
    last_outbound_at: str(raw.last_outbound_at),
    created_at: str(raw.created_at) ?? new Date(0).toISOString(),
    unsubscribed: raw.unsubscribed === true,
    dnc_reason: str(raw.dnc_reason),
    site_lead_id: str(raw.site_lead_id),
    site_intent: str(raw.site_intent),
    site_page_path: str(raw.site_page_path),
    site_gym_slug: str(raw.site_gym_slug),
    site_lead_count: num(raw.site_lead_count) ?? 0,
  };
}

// ─── Modes ──────────────────────────────────────────────────────────────

/** What the CRM calls a setter_status. Site-only people have no mode. */
export type CrmMode = "ai" | "reply_only" | "human" | "dnc";

export const MODE_LABEL: Record<CrmMode, string> = {
  ai: "🤖 AI active",
  reply_only: "💬 Reply-only",
  human: "👤 Human",
  dnc: "⛔ Do not contact",
};

export function modeOf(setterStatus: string | null): CrmMode | null {
  switch (setterStatus) {
    case "auto":
      return "ai";
    case "reply_only":
      return "reply_only";
    case "human":
    case "paused":
    case "booked":
      return "human";
    case "closed":
      return "dnc";
    default:
      return null;
  }
}

/** The setter_status the CRM writes for each mode. Human is always 'human'. */
export const MODE_STATUS: Record<CrmMode, string> = {
  ai: "auto",
  reply_only: "reply_only",
  human: "human",
  dnc: "closed",
};

export const KNOWN_STATUSES = ["auto", "reply_only", "human", "paused", "booked", "closed"] as const;

export const DNC_REASONS = ["asked_to_stop", "spam", "not_eligible", "lost", "other"] as const;
export type DncReason = (typeof DNC_REASONS)[number];
export const DNC_REASON_LABEL: Record<DncReason, string> = {
  asked_to_stop: "Asked to stop",
  spam: "Spam",
  not_eligible: "Not eligible",
  lost: "Lost",
  other: "Other",
};

export type ModeChange =
  | { ok: true; status: string; dncReason: string | null }
  | { ok: false; error: string };

/**
 * Is this mode change allowed, and what exactly gets written?
 *
 * - the target must be one of the four CRM modes, and the current status one
 *   the setter actually uses — anything else is refused, not guessed at
 * - no-op changes are refused (paused → Human is already Human)
 * - Do not contact needs a reason from the fixed list; "other" needs words
 * - someone who unsubscribed cannot be handed back to the AI from here
 * - leaving Do not contact clears the reason
 */
export function validateModeChange(input: {
  current: string | null;
  target: unknown;
  reason?: unknown;
  note?: unknown;
  unsubscribed?: boolean;
}): ModeChange {
  const target = input.target;
  if (target !== "ai" && target !== "reply_only" && target !== "human" && target !== "dnc") {
    return { ok: false, error: "Unknown mode." };
  }
  if (!input.current || !(KNOWN_STATUSES as readonly string[]).includes(input.current)) {
    return { ok: false, error: "This person has no conversation to control." };
  }
  if (modeOf(input.current) === target) return { ok: false, error: "Already in that mode." };
  if ((target === "ai" || target === "reply_only") && input.unsubscribed) {
    return { ok: false, error: "They unsubscribed, so the AI can't be switched back on." };
  }
  if (target !== "dnc") return { ok: true, status: MODE_STATUS[target], dncReason: null };

  const reason = input.reason;
  if (typeof reason !== "string" || !(DNC_REASONS as readonly string[]).includes(reason)) {
    return { ok: false, error: "Pick a reason for Do not contact." };
  }
  const note = typeof input.note === "string" ? input.note.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  if (reason === "other" && !note) return { ok: false, error: "Say why, for “Other”." };
  const label = DNC_REASON_LABEL[reason as DncReason];
  return { ok: true, status: "closed", dncReason: note ? `${label}: ${note}` : label };
}

// ─── Qualified PT ───────────────────────────────────────────────────────

/**
 * The coach's "Already a qualified PT" choice, merged into ai_profile.
 *
 * Same semantics as Leads Central's applyCoachProfilePatch: the value and
 * already_qualified_set_by:"coach" are written together, and every other key
 * (planner answers, the setter's notes) is carried over untouched.
 */
export function mergeQualified(stored: unknown, value: boolean): Record<string, unknown> {
  const base = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {};
  return { ...base, already_qualified: value, already_qualified_set_by: "coach" };
}

// ─── Waiting ────────────────────────────────────────────────────────────

export function isClosed(p: Pick<CrmPerson, "setter_status" | "unsubscribed">): boolean {
  return p.setter_status === "closed" || p.unsubscribed;
}

/** They wrote more recently than we did, and the conversation is still open. */
export function isWaiting(p: CrmPerson): boolean {
  if (p.kind !== "person" || isClosed(p) || !p.last_inbound_at) return false;
  if (!p.last_outbound_at) return true;
  return Date.parse(p.last_inbound_at) > Date.parse(p.last_outbound_at);
}

export function waitingMinutes(p: CrmPerson, now: number): number | null {
  if (!isWaiting(p) || !p.last_inbound_at) return null;
  return Math.max(0, Math.floor((now - Date.parse(p.last_inbound_at)) / 60_000));
}

export type WaitBand = "green" | "yellow" | "orange" | "red";

/** 🟢 under 30m, 🟡 under 2h, 🟠 under 12h, 🔴 12h or more. */
export function waitBand(minutes: number): WaitBand {
  if (minutes < 30) return "green";
  if (minutes < 120) return "yellow";
  if (minutes < 720) return "orange";
  return "red";
}

export const WAIT_DOT: Record<WaitBand, string> = { green: "🟢", yellow: "🟡", orange: "🟠", red: "🔴" };

export function formatWait(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 48 * 60) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

export function lastActivity(p: CrmPerson): number {
  const t = [p.last_inbound_at, p.last_outbound_at, p.created_at].map((s) => (s ? Date.parse(s) : 0));
  return Math.max(0, ...t.filter(Number.isFinite));
}

// ─── Search ─────────────────────────────────────────────────────────────

/** UK phone digits in one spelling: +44 7700… and 07700… both become 07700…. */
export function normalisePhone(raw: string | null | undefined): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("44")) d = `0${d.slice(2)}`;
  return d;
}

export interface SearchTerm {
  text: string;
  digits: string | null;
}

/**
 * The search box, normalised once.
 *
 * Text is lowercased and trimmed (emails match case-insensitively). When the
 * query has enough digits to be a phone number, those digits are matched
 * against the phone in the same normalised spelling.
 */
export function normaliseSearch(q: string | null | undefined): SearchTerm | null {
  const text = String(q ?? "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 100);
  if (!text) return null;
  const digitCount = text.replace(/\D/g, "").length;
  const phoneLike = digitCount >= 4 && /^[\d\s()+\-.]+$/.test(text);
  return { text, digits: phoneLike ? normalisePhone(text) : null };
}

export function matchesSearch(p: CrmPerson, s: SearchTerm | null): boolean {
  if (!s) return true;
  if (s.digits) return normalisePhone(p.phone).includes(s.digits);
  return [p.name, p.email].some((v) => (v ?? "").toLowerCase().includes(s.text));
}

// ─── The URL ────────────────────────────────────────────────────────────

export const MODE_FILTERS = ["ai", "reply_only", "human", "dnc"] as const;
export const BAND_FILTERS = ["prime", "strong", "nurture", "qualified", "gym"] as const;
export const CHANNEL_FILTERS = ["email", "whatsapp", "messenger", "instagram", "web", "lead_ads", "site"] as const;
export const WAIT_FILTERS = ["30m", "2h", "12h"] as const;
export const VIEW_FILTERS = ["new", "waiting", "hot", "quiet", "prime7d"] as const;

export const BAND_LABEL: Record<(typeof BAND_FILTERS)[number], string> = {
  prime: "Prime",
  strong: "Strong",
  nurture: "Nurture",
  qualified: "Qualified PT",
  gym: "Gym owner",
};
export const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  messenger: "Messenger",
  instagram: "Instagram",
  web: "Web",
  lead_ads: "Lead ad",
  site: "Website only",
};
export const WAIT_LABEL: Record<(typeof WAIT_FILTERS)[number], string> = { "30m": "> 30m", "2h": "> 2h", "12h": "> 12h" };
const WAIT_MINUTES: Record<(typeof WAIT_FILTERS)[number], number> = { "30m": 30, "2h": 120, "12h": 720 };

export interface CrmQuery {
  q?: string;
  mode?: (typeof MODE_FILTERS)[number];
  band?: (typeof BAND_FILTERS)[number];
  channel?: (typeof CHANNEL_FILTERS)[number];
  wait?: (typeof WAIT_FILTERS)[number];
  view?: (typeof VIEW_FILTERS)[number];
  source?: string;
  ad?: string;
  from?: string;
  to?: string;
}

/** The order keys are written in, so the same filters always make the same URL. */
export const QUERY_KEYS = ["q", "view", "mode", "band", "channel", "source", "ad", "wait", "from", "to"] as const;

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function first(params: Params, key: string): string | undefined {
  const v = params instanceof URLSearchParams ? (params.get(key) ?? undefined) : params[key];
  return Array.isArray(v) ? v[0] : v;
}

function oneOf<T extends string>(list: readonly T[], v: string | undefined): T | undefined {
  return v !== undefined && (list as readonly string[]).includes(v) ? (v as T) : undefined;
}

/** A free-text value matched exactly (utm source / ad). Bounded and printable. */
function token(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = v.trim().slice(0, 120);
  return t && !/[\u0000-\u001f\u007f]/.test(t) ? t : undefined;
}

function isoDate(v: string | undefined): string | undefined {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? undefined : v;
}

/** URL → filters. Unknown keys and values outside the whitelists are dropped. */
export function parseCrmQuery(params: Params): CrmQuery {
  const out: CrmQuery = {};
  const q = normaliseSearch(first(params, "q"));
  if (q) out.q = String(first(params, "q")).replace(/\s+/g, " ").trim().slice(0, 100);
  const view = oneOf(VIEW_FILTERS, first(params, "view"));
  if (view) out.view = view;
  const mode = oneOf(MODE_FILTERS, first(params, "mode"));
  if (mode) out.mode = mode;
  const band = oneOf(BAND_FILTERS, first(params, "band"));
  if (band) out.band = band;
  const channel = oneOf(CHANNEL_FILTERS, first(params, "channel"));
  if (channel) out.channel = channel;
  const source = token(first(params, "source"));
  if (source) out.source = source;
  const ad = token(first(params, "ad"));
  if (ad) out.ad = ad;
  const wait = oneOf(WAIT_FILTERS, first(params, "wait"));
  if (wait) out.wait = wait;
  const from = isoDate(first(params, "from"));
  if (from) out.from = from;
  const to = isoDate(first(params, "to"));
  if (to) out.to = to;
  return out;
}

/** Filters → canonical query string (no leading "?"). */
export function serialiseCrmQuery(q: CrmQuery): string {
  const sp = new URLSearchParams();
  for (const k of QUERY_KEYS) {
    const v = q[k];
    if (v) sp.set(k, v);
  }
  return sp.toString();
}

export function crmHref(q: CrmQuery, extra?: { open?: string }): string {
  const s = serialiseCrmQuery(q);
  const sp = new URLSearchParams(s);
  if (extra?.open) sp.set("open", extra.open);
  const out = sp.toString();
  return out ? `/admin/crm?${out}` : "/admin/crm";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

// ─── Applying the filters ───────────────────────────────────────────────

const DAY = 86_400_000;

/** A timestamp's calendar date in London, as YYYY-MM-DD. */
export function londonDate(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

const hotBand = (p: CrmPerson) => p.planner_band === "prime" || p.planner_band === "strong";

function matchesView(p: CrmPerson, view: CrmQuery["view"], now: number): boolean {
  switch (view) {
    case undefined:
      return true;
    case "new":
      return londonDate(Date.parse(p.created_at)) === londonDate(now);
    case "waiting":
      return isWaiting(p);
    case "hot":
      return hotBand(p) && !isClosed(p) && now - lastActivity(p) <= 7 * DAY;
    case "quiet":
      return hotBand(p) && !isClosed(p) && now - lastActivity(p) > 5 * DAY;
    case "prime7d":
      return hotBand(p) && now - Date.parse(p.created_at) <= 7 * DAY;
  }
}

function matchesBand(p: CrmPerson, band: CrmQuery["band"]): boolean {
  if (!band) return true;
  if (band === "qualified") return p.already_qualified;
  if (band === "gym") return p.setter_profile_id !== null;
  return p.planner_band === band;
}

function matchesChannel(p: CrmPerson, channel: CrmQuery["channel"]): boolean {
  if (!channel) return true;
  if (channel === "site") return p.kind === "site_only";
  return p.primary_channel === channel;
}

export function matchesQuery(p: CrmPerson, q: CrmQuery, now: number): boolean {
  if (!matchesSearch(p, normaliseSearch(q.q))) return false;
  if (!matchesView(p, q.view, now)) return false;
  if (q.mode && modeOf(p.setter_status) !== q.mode) return false;
  if (!matchesBand(p, q.band)) return false;
  if (!matchesChannel(p, q.channel)) return false;
  if (q.source && p.utm_source !== q.source) return false;
  if (q.ad && p.utm_content !== q.ad) return false;
  if (q.wait) {
    const m = waitingMinutes(p, now);
    if (m === null || m < WAIT_MINUTES[q.wait]) return false;
  }
  const day = londonDate(Date.parse(p.created_at));
  if (q.from && day < q.from) return false;
  if (q.to && day > q.to) return false;
  return true;
}

/** Waiting first (longest wait first), then open by recency, closed last. */
export function sortPeople(rows: CrmPerson[], now: number): CrmPerson[] {
  const rank = (p: CrmPerson) => (isClosed(p) ? 2 : isWaiting(p) ? 0 : 1);
  return rows.slice().sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    if (rank(a) === 0) return (waitingMinutes(b, now) ?? 0) - (waitingMinutes(a, now) ?? 0);
    return lastActivity(b) - lastActivity(a);
  });
}

export function filterPeople(rows: CrmPerson[], q: CrmQuery, now: number): CrmPerson[] {
  return sortPeople(rows.filter((p) => matchesQuery(p, q, now)), now);
}

// ─── Tiles and built-in views ───────────────────────────────────────────

export interface Tiles {
  newToday: number;
  waiting: number;
  oldestWaitMinutes: number | null;
  aiActive: number;
  human: number;
  hot7d: number;
  qualified: number;
}

export function tileCounts(rows: CrmPerson[], now: number): Tiles {
  const waits = rows.map((p) => waitingMinutes(p, now)).filter((m): m is number => m !== null);
  return {
    newToday: rows.filter((p) => matchesView(p, "new", now)).length,
    waiting: waits.length,
    oldestWaitMinutes: waits.length ? Math.max(...waits) : null,
    aiActive: rows.filter((p) => modeOf(p.setter_status) === "ai").length,
    human: rows.filter((p) => modeOf(p.setter_status) === "human").length,
    hot7d: rows.filter((p) => matchesView(p, "prime7d", now)).length,
    qualified: rows.filter((p) => p.already_qualified).length,
  };
}

export const BUILT_IN_VIEWS: { name: string; query: CrmQuery }[] = [
  { name: "Waiting on us", query: { view: "waiting" } },
  { name: "Hot", query: { view: "hot" } },
  { name: "Qualified PTs", query: { band: "qualified" } },
  { name: "Gone quiet", query: { view: "quiet" } },
  { name: "Human-controlled", query: { mode: "human" } },
];

// ─── Saved views ────────────────────────────────────────────────────────

export type SavedViewInput = { ok: true; name: string; query: string } | { ok: false; error: string };

/**
 * A custom view's name and query, checked before it is stored.
 *
 * The query is re-parsed through the same whitelist as the URL and stored in
 * its canonical form, so a saved view can never hold anything the list page
 * would not accept. A view with no filters at all is refused — it would just
 * be the full list.
 */
export function validateSavedView(name: unknown, query: unknown): SavedViewInput {
  const n = typeof name === "string" ? name.replace(/\s+/g, " ").trim() : "";
  if (!n) return { ok: false, error: "Give the view a name." };
  if (n.length > 40) return { ok: false, error: "Keep the name under 40 characters." };
  if (/[\u0000-\u001f\u007f<>]/.test(n)) return { ok: false, error: "The name has characters it can't use." };
  if (BUILT_IN_VIEWS.some((v) => v.name.toLowerCase() === n.toLowerCase())) {
    return { ok: false, error: "That name is already a built-in view." };
  }
  const raw = typeof query === "string" ? query.replace(/^\?/, "").slice(0, 1000) : "";
  const canonical = serialiseCrmQuery(parseCrmQuery(new URLSearchParams(raw)));
  if (!canonical) return { ok: false, error: "Set at least one filter before saving a view." };
  return { ok: true, name: n, query: canonical };
}

// ─── Messages ───────────────────────────────────────────────────────────

/** meta.via values for messages sent from a fixed template or a scheduled nudge, not written by the setter or Callum. */
export const TEMPLATE_VIAS = ["planner_template", "planner_nudge", "reengage_nudge", "intake"] as const;

export type Author = "lead" | "ai" | "template" | "human";

export const AUTHOR_LABEL: Record<Author, string> = {
  lead: "🟢 Lead",
  ai: "🤖 AI Setter",
  template: "🤖 Template",
  human: "👤 Callum",
};

export function viaOf(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const v = (meta as Record<string, unknown>).via;
  return typeof v === "string" ? v : null;
}

/**
 * Who wrote this message.
 *
 * Inbound is the lead. Outbound sent by a template or nudge is labelled as a
 * template whatever its ai_generated flag says (the planner opener and nudge
 * are stored ai_generated=false). Otherwise ai_generated decides: true is the
 * setter, false is a person — Callum.
 */
export function messageAuthor(m: { direction: string; ai_generated: boolean | null; meta: unknown }): Author {
  if (m.direction === "inbound") return "lead";
  const via = viaOf(m.meta);
  if (via && (TEMPLATE_VIAS as readonly string[]).includes(via)) return "template";
  return m.ai_generated === false ? "human" : "ai";
}

// ─── Reply links ────────────────────────────────────────────────────────

export const GMAIL_ACCOUNT = "info@ptlaunchlab.co.uk";

/** wa.me wants international digits with no plus: UK 07… becomes 447…. */
export function waNumber(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  let d = s.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `44${d.slice(1)}`;
  else if (/^7\d{9}$/.test(d) && !s.startsWith("+")) d = `44${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export function gmailUrl(email: string | null, threadId?: string | null): string | null {
  const base = `https://mail.google.com/mail/u/?authuser=${GMAIL_ACCOUNT}`;
  if (threadId && /^[0-9a-f]{6,32}$/i.test(threadId)) return `${base}#all/${threadId}`;
  if (!email) return null;
  return `${base}#search/${encodeURIComponent(email)}`;
}

/** The newest stored Gmail thread id among a person's email messages. */
export function latestThreadId(messages: { channel: string | null; meta: unknown }[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.channel !== "email" || !m.meta || typeof m.meta !== "object") continue;
    const em = (m.meta as Record<string, unknown>).emailMeta;
    const t = em && typeof em === "object" ? (em as Record<string, unknown>).threadId : null;
    if (typeof t === "string" && t) return t;
  }
  return null;
}

export function channelLabel(channel: string | null): string {
  return channel ? (CHANNEL_LABEL[channel] ?? channel) : "Unknown";
}
