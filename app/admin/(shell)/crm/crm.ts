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

/** setter_paused_reason written when Callum takes over from the CRM. */
export const TAKEOVER_REASON = "Taken over in CRM";
/** Reasons that mean a person took over, not that the setter stood itself down. */
export const MANUAL_TAKEOVER_REASONS = ["manual takeover", TAKEOVER_REASON] as const;

export function isManualTakeover(reason: string | null | undefined): boolean {
  return !!reason && (MANUAL_TAKEOVER_REASONS as readonly string[]).includes(reason.trim());
}

/**
 * Exactly what a mode change writes to consultations.
 *
 * Mirrors Leads Central's PATCH side effects: handing back to the AI (active or
 * reply-only) resets ai_unanswered_count and clears setter_paused_reason, so the
 * re-engagement cron does not read a stale count; taking over records why the
 * setter is silent. Every change stamps who and when.
 */
export function modeUpdatePayload(
  change: { status: string; dncReason: string | null },
  nowIso: string,
  actor: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    setter_status: change.status,
    dnc_reason: change.dncReason,
    mode_changed_at: nowIso,
    mode_changed_by: actor,
  };
  if (change.status === "auto" || change.status === "reply_only") {
    out.ai_unanswered_count = 0;
    out.setter_paused_reason = null;
  }
  if (change.status === "human") out.setter_paused_reason = TAKEOVER_REASON;
  return out;
}

export type ModePlan =
  | { ok: true; update: Record<string, unknown>; activity: Record<string, unknown> }
  | { ok: false; error: string; conflict?: boolean };

/**
 * The whole of changeMode's decision, minus the I/O: given the request and the
 * row as freshly read, either the exact update + activity entry, or why not.
 * The action still makes the write conditional on `expected`, so a change that
 * lands between this read and the write is caught too.
 */
export function planModeChange(
  input: { id: unknown; expected: unknown; target: unknown; reason?: unknown; note?: unknown },
  row: { setter_status: unknown; unsubscribed: unknown } | null,
  nowIso: string,
  actor: string,
): ModePlan {
  if (!isUuid(input.id)) return { ok: false, error: "Unknown person." };
  const expected = typeof input.expected === "string" ? input.expected : null;
  if (!expected || !(KNOWN_STATUSES as readonly string[]).includes(expected)) {
    return { ok: false, error: "This person has no conversation to control." };
  }
  if (!row) return { ok: false, error: "Unknown person." };
  if (row.setter_status !== expected) return { ok: false, conflict: true, error: "Changed elsewhere, refresh." };
  const v = validateModeChange({
    current: expected,
    target: input.target,
    reason: input.reason,
    note: input.note,
    unsubscribed: row.unsubscribed === true,
  });
  if (!v.ok) return v;
  return { ok: true, update: modeUpdatePayload(v, nowIso, actor), activity: modeActivityDetail(expected, v) };
}

/** The confirm-dialog warning for a change, if it needs one. */
export function modeChangeWarning(current: string | null, target: CrmMode): string | null {
  if (current === "booked" && (target === "ai" || target === "reply_only")) {
    return "They've booked a call — the setter may message them again.";
  }
  return null;
}

/** The activity-log entry for a mode change. */
export function modeActivityDetail(from: string, change: { status: string; dncReason: string | null }): Record<string, unknown> {
  return { from, to: change.status, from_mode: modeOf(from), to_mode: modeOf(change.status), dnc_reason: change.dncReason };
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

/** setQualified's input check: a person id and a real boolean, nothing else. */
export function validateQualifiedInput(input: { id: unknown; value: unknown }): { ok: true; id: string; value: boolean } | { ok: false; error: string } {
  if (!isUuid(input.id)) return { ok: false, error: "Unknown person." };
  if (typeof input.value !== "boolean") return { ok: false, error: "Invalid value." };
  return { ok: true, id: input.id, value: input.value };
}

// ─── Waiting ────────────────────────────────────────────────────────────

export function isClosed(p: Pick<CrmPerson, "setter_status" | "unsubscribed">): boolean {
  return p.setter_status === "closed" || p.unsubscribed;
}

/** They wrote more recently than anything recorded going back. */
function wroteLast(p: CrmPerson): boolean {
  if (p.kind !== "person" || isClosed(p) || !p.last_inbound_at) return false;
  if (!p.last_outbound_at) return true;
  return Date.parse(p.last_inbound_at) > Date.parse(p.last_outbound_at);
}

/**
 * Waiting on us: they wrote last, the conversation is open, and the setter is
 * the one meant to answer.
 *
 * Human-mode people are excluded. Callum replies from Gmail or his phone and
 * those replies are not recorded, so "they wrote last" says nothing about
 * whether he answered — counting them would keep a red timer on every
 * conversation he took over.
 */
export function isWaiting(p: CrmPerson): boolean {
  return wroteLast(p) && modeOf(p.setter_status) !== "human";
}

/** Human mode and they wrote last: Callum is handling it, outside anything recorded here. */
export function isHandling(p: CrmPerson): boolean {
  return wroteLast(p) && modeOf(p.setter_status) === "human";
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

/** The UK rewrites shared by stored numbers and typed searches (see normalisePhone). */
function ukDigits(raw: string | null | undefined): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("440")) d = `0${d.slice(3)}`;
  else if (d.startsWith("44")) d = `0${d.slice(2)}`;
  else if (d.length === 10 && d.startsWith("7")) d = `0${d}`;
  return d;
}

/**
 * A stored phone in one UK spelling, matching the SQL crm_normalise_uk_phone
 * the crm_people view joins on: digits only, leading 00 dropped, 44/440 → 0,
 * ten digits starting 7 → 07…, and fewer than 9 digits is no number at all.
 */
export function normalisePhone(raw: string | null | undefined): string {
  const d = ukDigits(raw);
  return d.length < 9 ? "" : d;
}

/** Fewer digits than this and a search is not treated as a phone number. */
export const MIN_PHONE_SEARCH_DIGITS = 6;

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
  const phoneLike = digitCount >= MIN_PHONE_SEARCH_DIGITS && /^[\d\s()+\-.]+$/.test(text);
  return { text, digits: phoneLike ? ukDigits(text) : null };
}

export function matchesSearch(p: CrmPerson, s: SearchTerm | null): boolean {
  if (!s) return true;
  if (s.digits) {
    const phone = normalisePhone(p.phone);
    return phone !== "" && phone.includes(s.digits);
  }
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

/**
 * When a read stopped short of the rows that exist, the words for a Notice;
 * null when everything was read (or the total is unknown).
 */
export function incompleteNote(got: number, total: number | null): string | null {
  if (total === null || got >= total) return null;
  return `Showing ${got} of ${total}: the list may be incomplete, so counts may be low.`;
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

/** A saved view's id as deleteView accepts it (uuid, or a positive integer id), else null. */
export function viewIdOf(id: unknown): string | null {
  const v = typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? String(id) : id;
  if (isUuid(v)) return v;
  return typeof v === "string" && /^[1-9]\d{0,17}$/.test(v) ? v : null;
}

// ─── Messages ───────────────────────────────────────────────────────────

/**
 * meta.via values for fixed WhatsApp templates: words nobody wrote for this
 * person. (reengage_nudge and intake are model-written, so they are the AI.)
 */
export const TEMPLATE_VIAS = ["planner_template", "planner_nudge"] as const;

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

/** meta.via on a message Callum sent from the CRM's reply box (via Leads Central). */
export const OWNER_VIA = "crm_owner";

/**
 * Who wrote this message.
 *
 * Inbound is the lead. A CRM reply (via "crm_owner") is Callum, even when it
 * went out as the ptll_owner_message template: he typed the words. The planner
 * template opener and nudge are labelled as templates (they are stored
 * ai_generated=false, but nobody typed them). Otherwise Callum only when
 * ai_generated is explicitly false; anything else outbound — true, or a
 * missing flag — is the setter.
 */
export function messageAuthor(m: { direction: string; ai_generated: boolean | null; meta: unknown }): Author {
  if (m.direction === "inbound") return "lead";
  const via = viaOf(m.meta);
  if (via === OWNER_VIA) return "human";
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

// ─── Replying from the CRM ──────────────────────────────────────────────
//
// The site never sends anything itself: sendOwnerMessage hands the text to
// Leads Central (POST /api/setter/owner-send), which takes over if needed,
// picks free text or the template, sends, and records. These are the rules
// the reply box and the action share.

export type ReplyChannel = "whatsapp" | "email";
export const REPLY_CHANNELS: readonly ReplyChannel[] = ["whatsapp", "email"];

/** Leads Central's cap on a typed reply. */
export const REPLY_MAX = 2000;
/** The template's {{2}} cap: the typed text with newlines collapsed. */
export const TEMPLATE_TEXT_MAX = 900;
export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;
export const OWNER_TEMPLATE = "ptll_owner_message";

export const TEMPLATE_NOTICE = "Outside WhatsApp's 24-hour window: this will go as a template";
/** When the window was estimated from a stored row's time, not the message's own. */
export const TEMPLATE_NOTICE_PROBABLY = "Probably outside WhatsApp's 24-hour window: this will likely go as a template";
export const WINDOW_PROBABLY_OPEN = "Probably inside WhatsApp's 24-hour window. Leads Central decides; if it has closed, this goes as a template.";
export const TEMPLATE_NOT_APPROVED = "WhatsApp template not approved yet. Message them from your phone.";
export const SEND_UNREACHABLE = "Couldn't reach Leads Central — nothing was sent";
export const SEND_UNCONFIRMED = "Couldn't confirm — check the conversation before resending";

/**
 * Which channels the reply box offers, in picker order.
 *
 * WhatsApp when they have a WhatsApp identity or a usable phone number. Email
 * when the stored address is a real one: Leads Central stores
 * "whatsapp:<id>"-style placeholders in consultations.email for people who
 * never gave one. Messenger/Instagram are not offered (yet).
 */
export function replyChannels(
  p: { email: string | null; phone: string | null },
  identityChannels: readonly string[] = [],
): ReplyChannel[] {
  const out: ReplyChannel[] = [];
  if (identityChannels.includes("whatsapp") || waNumber(p.phone)) out.push("whatsapp");
  const email = (p.email ?? "").trim();
  if (email.includes("@") && !email.includes(":")) out.push("email");
  return out;
}

/** Their primary channel if the box offers it, else the first one it does. */
export function defaultReplyChannel(channels: readonly ReplyChannel[], primary: string | null): ReplyChannel | null {
  const hit = channels.find((c) => c === primary);
  return hit ?? channels[0] ?? null;
}

export type ReplyState =
  | { kind: "blocked"; reason: string }
  | { kind: "takeover"; label: "Take over and send" }
  | { kind: "send"; label: "Send" };

/**
 * What the send button does for a conversation in this state.
 *
 * AI active and Reply-only: the send hands the conversation to Callum first
 * (Leads Central does the take-over), so the button says so. Human, paused and
 * booked: just send. Do not contact and unsubscribed: no sending at all.
 */
export function replyState(setterStatus: string | null, unsubscribed: boolean): ReplyState {
  if (setterStatus === "closed") return { kind: "blocked", reason: "Marked do not contact" };
  if (unsubscribed) return { kind: "blocked", reason: "Unsubscribed" };
  const mode = modeOf(setterStatus);
  if (mode === "ai" || mode === "reply_only") return { kind: "takeover", label: "Take over and send" };
  if (mode === "human") return { kind: "send", label: "Send" };
  return { kind: "blocked", reason: "No conversation to reply in" };
}

/** The newest inbound message's time on one channel, from the loaded timeline. */
export function lastInboundOn(
  messages: readonly { channel: string | null; direction: string; created_at: string }[],
  channel: string,
): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const m of messages) {
    if (m.direction !== "inbound" || m.channel !== channel) continue;
    const t = Date.parse(m.created_at);
    if (Number.isFinite(t) && t > bestMs) {
      bestMs = t;
      best = m.created_at;
    }
  }
  return best;
}

/** Free text is allowed while their last WhatsApp message is under 24h old. */
export function insideWhatsAppWindow(lastInboundIso: string | null, now: number): boolean {
  if (!lastInboundIso) return false;
  const t = Date.parse(lastInboundIso);
  return Number.isFinite(t) && now - t < WHATSAPP_WINDOW_MS;
}

/** Will this reply go as the ptll_owner_message template? */
export function willUseTemplate(channel: ReplyChannel | null, lastWhatsAppInbound: string | null, now: number): boolean {
  return channel === "whatsapp" && !insideWhatsAppWindow(lastWhatsAppInbound, now);
}

/** The template's {{2}}: the typed text on one line (same rule as Leads Central's oneLine). */
export function templateText(text: string): string {
  return text.replace(/[\n\t\r]+/g, " ").replace(/ {2,}/g, " ").trim();
}

/** What the counter counts, and against which cap. */
export function replyCount(text: string, template: boolean): { length: number; max: number; over: boolean } {
  const length = template ? templateText(text).length : text.trim().length;
  const max = template ? TEMPLATE_TEXT_MAX : REPLY_MAX;
  return { length, max, over: length > max };
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isUuidV4(v: unknown): v is string {
  return typeof v === "string" && UUID_V4.test(v);
}

export interface OwnerSendBody {
  consultationId: string;
  channel: ReplyChannel;
  text: string;
  actor: "callum";
  expectStatus: string;
  requestId: string;
}

/**
 * sendOwnerMessage's input check, before anything leaves the site.
 *
 * Mirrors Leads Central's own validation (1–2000 chars after trimming) so an
 * obviously bad request is refused here with a clear message. Leads Central
 * still re-checks everything against the live row.
 */
export function validateSendInput(input: {
  consultationId: unknown;
  channel: unknown;
  text: unknown;
  expectStatus: unknown;
  requestId: unknown;
}): { ok: true; body: OwnerSendBody } | { ok: false; error: string } {
  if (!isUuid(input.consultationId)) return { ok: false, error: "Unknown person." };
  if (input.channel !== "whatsapp" && input.channel !== "email") return { ok: false, error: "Pick WhatsApp or email." };
  const status = typeof input.expectStatus === "string" ? input.expectStatus : null;
  if (!status || !(KNOWN_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "This person has no conversation to reply in." };
  }
  if (status === "closed") return { ok: false, error: "Marked do not contact." };
  if (!isUuidV4(input.requestId)) return { ok: false, error: "Bad request id. Refresh and try again." };
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) return { ok: false, error: "Write a message first." };
  if (text.length > REPLY_MAX) return { ok: false, error: `Keep it under ${REPLY_MAX} characters.` };
  return {
    ok: true,
    body: { consultationId: input.consultationId, channel: input.channel, text, actor: "callum", expectStatus: status, requestId: input.requestId },
  };
}

/**
 * Where to send, from the site's env. Both are server-only; either missing is
 * a setup problem, said plainly rather than as a failed send.
 */
export function ownerSendEndpoint(
  baseUrl: string | undefined,
  secret: string | undefined,
): { ok: true; url: string; secret: string } | { ok: false; error: string } {
  const base = (baseUrl ?? "").trim();
  const key = (secret ?? "").trim();
  const missing = [!base && "LEADS_CENTRAL_URL", !key && "CRM_SEND_SECRET"].filter(Boolean);
  if (missing.length) {
    return { ok: false, error: `Sending isn't set up on the site: ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} missing. Nothing was sent.` };
  }
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    return { ok: false, error: "LEADS_CENTRAL_URL isn't a valid URL. Nothing was sent." };
  }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(local && u.protocol === "http:")) {
    return { ok: false, error: "LEADS_CENTRAL_URL must be https. Nothing was sent." };
  }
  return { ok: true, url: `${u.origin}${u.pathname.replace(/\/+$/, "")}/api/setter/owner-send`, secret: key };
}

export type SendResult =
  | {
      ok: true;
      /** setter_status after the send; null on a duplicate (an earlier attempt already sent). */
      mode: string | null;
      tookOver: boolean;
      /** Went as the ptll_owner_message template (outside the 24h window). */
      template: boolean;
      /** Leads Central shortened the text to fit the template. */
      truncated: boolean;
      /** This requestId had already been sent: nothing new went out. */
      duplicate: boolean;
      messageId: string | null;
    }
  | {
      ok: false;
      error: string;
      /** Leads Central's code (dnc, conflict, in_progress, send_failed, …), when it gave one. */
      code?: string;
      /** The conversation changed under the panel (409 conflict): refresh, new requestId. */
      conflict?: boolean;
      /** Refresh the panel: what it shows is out of date (taken over, DNC, unsubscribed…). */
      refresh?: boolean;
      /**
       * Keep the same requestId for the next attempt: the send may have reached
       * Leads Central (timeout, lost connection, still in progress), and the
       * same id makes a retry idempotent. False after a definite answer.
       */
      retrySameId: boolean;
    };

export const SEND_IN_PROGRESS = "Still sending — wait a moment";

/** 409 codes after which the panel is out of date and should be re-read. */
const STALE_CODES = ["conflict", "dnc", "unsubscribed", "closed", "opted_out"];

const clip = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 300);

/**
 * Leads Central's answer (status + raw body) as what the reply box shows.
 *
 * Its `error` is plain text written for Callum and is shown as-is; nothing
 * else from the body (`detail` in particular) is passed to the browser. Anything
 * that isn't a JSON answer is treated as "couldn't reach" (or, for a gateway
 * timeout, "couldn't confirm"), and the same requestId is kept for a retry.
 */
export function interpretSendResponse(status: number, raw: string): SendResult {
  let body: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    body = null;
  }

  if (!body) {
    // A gateway timeout means the function may still have sent.
    if (status === 504 || status === 502) return { ok: false, error: SEND_UNCONFIRMED, retrySameId: true };
    return { ok: false, error: SEND_UNREACHABLE, retrySameId: true };
  }

  if (status >= 200 && status < 300 && body.ok === true) {
    const t = body.template;
    return {
      ok: true,
      mode: typeof body.mode === "string" ? body.mode : null,
      tookOver: body.tookOver === true,
      template: (typeof t === "string" && t !== "") || t === true,
      truncated: body.truncated === true,
      duplicate: body.duplicate === true,
      messageId: typeof body.messageId === "string" ? body.messageId : null,
    };
  }
  if (status >= 200 && status < 300) {
    // 2xx without ok:true is not a confirmed send, and not a refusal either.
    return { ok: false, error: SEND_UNCONFIRMED, retrySameId: true };
  }

  const code = typeof body.code === "string" ? body.code : undefined;
  const said = typeof body.error === "string" && body.error.trim() ? clip(body.error) : null;
  const tookOver = body.tookOver === true;
  const out = (error: string, extra: { conflict?: boolean; refresh?: boolean; retrySameId?: boolean } = {}): SendResult => ({
    ok: false,
    error,
    ...(code ? { code } : {}),
    ...(extra.conflict ? { conflict: true } : {}),
    ...(extra.refresh || extra.conflict || tookOver ? { refresh: true } : {}),
    retrySameId: extra.retrySameId ?? false,
  });

  if (code === "in_progress") return out(SEND_IN_PROGRESS, { retrySameId: true });
  // Also "This send id was already used for a different message": either way a fresh id.
  if (code === "conflict") return out(said ?? "Changed elsewhere, refresh.", { conflict: true });
  // An earlier claim for this id never resolved. Show it and refresh; the next
  // click on Send is the confirmation to resend, and carries a new id.
  if (code === "unknown_outcome") return out(said ?? SEND_UNCONFIRMED, { refresh: true });
  if (status === 409) return out(said ?? "Leads Central refused the send.", { refresh: !code || STALE_CODES.includes(code) });
  if (code === "template_not_approved") return out(said ?? TEMPLATE_NOT_APPROVED);
  if (status === 401 || code === "unauthorized") {
    return out(`${said ?? "Unauthorized."} Check CRM_SEND_SECRET matches on both projects. Nothing was sent.`);
  }
  if (status === 503 && !said) return out("Leads Central isn't set up to send yet. Nothing was sent.");
  return out(said ?? `Leads Central couldn't send (HTTP ${status}).`);
}

/** A fetch that threw: timed out (may have sent) or never connected. */
export function interpretSendError(e: unknown): SendResult {
  const name = e && typeof e === "object" && "name" in e ? String((e as { name: unknown }).name) : "";
  if (name === "TimeoutError" || name === "AbortError") return { ok: false, error: SEND_UNCONFIRMED, retrySameId: true };
  return { ok: false, error: SEND_UNREACHABLE, retrySameId: true };
}

// ─── The WhatsApp window, as Leads Central decides it ───────────────────

/**
 * When their last WhatsApp message was sent, by Leads Central's rule
 * (lastInboundWhatsAppAt in pt-app lib/setter/owner-send.ts): a lead_messages
 * row is written when the job runs, so its created_at can be hours late; the
 * identity's last_user_message_at is the message's own time. Use the newest
 * identity time at or before the newest inbound row, else the row's
 * created_at. `exact` is false in that fallback, so the box can say
 * "probably": Leads Central makes the real decision.
 */
export function whatsappLastMessageAt(
  newestInboundRowAt: string | null,
  identityLastUserAt: readonly (string | null | undefined)[],
): { at: string | null; exact: boolean } {
  if (!newestInboundRowAt) return { at: null, exact: true }; // nothing inbound: no window, for certain
  const row = Date.parse(newestInboundRowAt);
  if (!Number.isFinite(row)) return { at: null, exact: false };
  const earlier = identityLastUserAt.map((s) => (s ? Date.parse(s) : NaN)).filter((t) => Number.isFinite(t) && t <= row);
  return earlier.length
    ? { at: new Date(Math.max(...earlier)).toISOString(), exact: true }
    : { at: new Date(row).toISOString(), exact: false };
}
