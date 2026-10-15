import "server-only";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { parseMedia, signablePaths, LEAD_MEDIA_BUCKET } from "@/app/lib/message-media";
import type { CallType } from "@/app/lib/booking/callTypes";
import { normalisePerson, isUuid, incompleteNote, type CrmPerson, type ReplyIdentity } from "./crm";

// Reads for the CRM. Service role, server only.
//
// Every read here degrades instead of throwing: the crm_people view, the new
// consultations columns and the crm_* tables arrive in a migration that may
// not be applied yet. A missing piece becomes a `problem` string the page
// shows in a Notice, and the rest of the page still renders.

type Db = ReturnType<typeof getSupabaseAdmin>;

function db(): { client: Db | null; problem: string | null } {
  try {
    return { client: getSupabaseAdmin(), problem: null };
  } catch (e) {
    return { client: null, problem: e instanceof Error ? e.message : "Supabase is not configured." };
  }
}

export interface PeopleResult {
  people: CrmPerson[];
  /** Set when the view could not be read; `people` may then be a fallback. */
  problem: string | null;
  /** True when rows came from the consultations fallback, not crm_people. */
  fallback: boolean;
  /** Set when not every row could be read, so counts may be low. */
  incomplete: string | null;
}

/** PostgREST's default max rows per response; asking for more is silently capped to this. */
const PAGE = 1000;
const MAX_PAGES = 10;

/**
 * Every row of a table or view, a page at a time, with an exact count.
 *
 * A plain .limit() is capped server-side at 1000 rows with no error, which
 * would undercount the tiles without anyone noticing. This pages until the
 * count is reached and reports a shortfall instead of hiding it.
 */
async function readAll(
  client: Db,
  table: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null; incomplete: string | null }> {
  const rows: Record<string, unknown>[] = [];
  let total: number | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error, count } = await client
      .from(table)
      .select("*", page === 0 ? { count: "exact" } : undefined)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) return { rows, error: error.message, incomplete: null };
    if (page === 0) total = count ?? null;
    const got = (data ?? []) as Record<string, unknown>[];
    rows.push(...got);
    if (got.length < PAGE || (total !== null && rows.length >= total)) break;
  }
  return { rows, error: null, incomplete: incompleteNote(rows.length, total) };
}

/**
 * Everyone, from crm_people.
 *
 * If the view is not there yet, fall back to the consultations table so the
 * conversations are still on screen (website-only enquiries will be missing
 * until the view exists), and say so.
 */
export async function loadPeople(): Promise<PeopleResult> {
  const { client, problem } = db();
  if (!client) return { people: [], problem, fallback: false, incomplete: null };

  try {
    const view = await readAll(client, "crm_people");
    if (!view.error) {
      const people = view.rows.map(normalisePerson).filter((p): p is CrmPerson => p !== null);
      return { people, problem: null, fallback: false, incomplete: view.incomplete };
    }
    const fb = await readAll(client, "consultations");
    if (fb.error) {
      return { people: [], problem: `${view.error} (fallback also failed: ${fb.error})`, fallback: false, incomplete: null };
    }
    const people = fb.rows
      .map((row) => {
        const profile = (row.ai_profile ?? {}) as Record<string, unknown>;
        const planner = (profile.planner ?? {}) as Record<string, unknown>;
        return normalisePerson({
          ...row,
          kind: "person",
          planner_band: planner.band,
          already_qualified: profile.already_qualified === true,
        });
      })
      .filter((p): p is CrmPerson => p !== null);
    return { people, problem: view.error, fallback: true, incomplete: fb.incomplete };
  } catch (e) {
    return { people: [], problem: e instanceof Error ? e.message : "Could not read the CRM.", fallback: false, incomplete: null };
  }
}

export interface SavedView {
  id: string;
  name: string;
  query: string;
}

const SAVED_VIEWS_CAP = 100;

export async function loadSavedViews(actor: string): Promise<{ views: SavedView[]; problem: string | null; incomplete: string | null }> {
  const { client, problem } = db();
  if (!client) return { views: [], problem, incomplete: null };
  try {
    const { data, error, count } = await client
      .from("crm_saved_views")
      .select("id, name, query", { count: "exact" })
      .eq("actor", actor)
      .order("name", { ascending: true })
      .limit(SAVED_VIEWS_CAP);
    if (error) return { views: [], problem: error.message, incomplete: null };
    const views = (data ?? []).map((r) => ({ id: String(r.id), name: String(r.name), query: String(r.query ?? "") }));
    return { views, problem: null, incomplete: incompleteNote(views.length, count ?? null) };
  } catch (e) {
    return { views: [], problem: e instanceof Error ? e.message : "Could not read saved views.", incomplete: null };
  }
}

export const MESSAGE_CAP = 500;
export const ACTIVITY_CAP = 50;

// ─── One person ─────────────────────────────────────────────────────────

export interface Message {
  id: string;
  channel: string | null;
  direction: string;
  body: string | null;
  ai_generated: boolean | null;
  status: string | null;
  created_at: string;
  media: unknown;
  meta: unknown;
}

export interface Activity {
  id: string;
  actor: string | null;
  action: string;
  detail: unknown;
  created_at: string;
}

export interface PersonDetail {
  /** The row as the list sees it (from the view, or rebuilt when the view is missing). */
  person: CrmPerson;
  /** The full consultations row, for person rows. */
  consultation: Record<string, unknown> | null;
  /** The matched website enquiry (leads row), if any. */
  siteLead: Record<string, unknown> | null;
  messages: Message[];
  /** Their Leads Central identities (lead_identities): who the reply box can send to. */
  identities: ReplyIdentity[];
  /** last_user_message_at of each WhatsApp identity: the time their last message was sent. */
  whatsappIdentityTimes: (string | null)[];
  /** How many messages exist in all; more than messages.length when capped. */
  messageTotal: number;
  activities: Activity[];
  /** How many activity rows exist in all; more than activities.length when capped. */
  activityTotal: number;
  /** Image URLs signed for this page, by storage path. */
  signed: Map<string, string>;
  problems: string[];
}

// Signed URLs for this person's images, in one call. The bucket is private and
// the paths are checked against this consultation (message-media.ts).
async function signImages(client: Db, messages: Message[], consultationId: string): Promise<Map<string, string>> {
  const paths = signablePaths(messages.flatMap((m) => parseMedia(m.media)), consultationId);
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  try {
    const { data, error } = await client.storage.from(LEAD_MEDIA_BUCKET).createSignedUrls(paths, 600);
    if (error || !data) return out;
    for (const row of data) if (row.path && row.signedUrl && !row.error) out.set(row.path, row.signedUrl);
  } catch {
    // Each image then shows "Image unavailable"; the conversation still renders.
  }
  return out;
}

/**
 * Everything the panel shows for one id.
 *
 * The id is a consultation id for people with a conversation and a leads id
 * for website-only enquiries. Returns null when neither exists.
 */
export async function loadPersonDetail(id: string): Promise<PersonDetail | { problem: string } | null> {
  if (!isUuid(id)) return null;
  const { client, problem } = db();
  if (!client) return { problem: problem ?? "Supabase is not configured." };

  const problems: string[] = [];
  try {
    const [viewRes, consRes] = await Promise.all([
      client.from("crm_people").select("*").eq("id", id).maybeSingle(),
      client.from("consultations").select("*").eq("id", id).maybeSingle(),
    ]);
    if (viewRes.error) problems.push(`crm_people: ${viewRes.error.message}`);
    if (consRes.error) problems.push(`consultations: ${consRes.error.message}`);

    const consultation = (consRes.data as Record<string, unknown> | null) ?? null;
    let person = viewRes.data ? normalisePerson(viewRes.data as Record<string, unknown>) : null;
    let siteLead: Record<string, unknown> | null = null;

    if (!person && consultation) {
      const profile = (consultation.ai_profile ?? {}) as Record<string, unknown>;
      const planner = (profile.planner ?? {}) as Record<string, unknown>;
      person = normalisePerson({
        ...consultation,
        kind: "person",
        planner_band: planner.band,
        already_qualified: profile.already_qualified === true,
      });
    }

    // The website enquiry: the view's match for a person, or the row itself for site-only.
    const leadId = person?.kind === "site_only" ? id : (person?.site_lead_id ?? (!person ? id : null));
    if (leadId && isUuid(leadId)) {
      const lr = await client.from("leads").select("*").eq("id", leadId).maybeSingle();
      if (lr.error) problems.push(`leads: ${lr.error.message}`);
      siteLead = (lr.data as Record<string, unknown> | null) ?? null;
      if (!person && siteLead) {
        person = normalisePerson({
          ...siteLead,
          kind: "site_only",
          setter_status: null,
          site_lead_id: siteLead.id,
          site_intent: siteLead.intent,
          site_page_path: siteLead.page_path,
          site_gym_slug: siteLead.gym_slug,
          site_lead_count: 1,
        });
      }
    }
    if (!person) return problems.length ? { problem: problems.join(" · ") } : null;

    let messages: Message[] = [];
    let messageTotal = 0;
    let signed = new Map<string, string>();
    let identities: ReplyIdentity[] = [];
    let whatsappIdentityTimes: (string | null)[] = [];
    if (person.kind === "person") {
      // Which channels the reply box can offer (read only; Leads Central owns these rows).
      const ir = await client.from("lead_identities").select("channel, external_id, consent_state, created_at, last_user_message_at").eq("consultation_id", id).limit(20);
      if (ir.error) problems.push(`identities: ${ir.error.message}`);
      const s = (v: unknown) => (typeof v === "string" ? v : null);
      const idents = (ir.data ?? []) as Record<string, unknown>[];
      identities = idents
        .filter((r) => typeof r.channel === "string")
        .map((r) => ({ channel: r.channel as string, external_id: s(r.external_id), consent_state: s(r.consent_state), created_at: s(r.created_at) }));
      whatsappIdentityTimes = idents
        .filter((r) => r.channel === "whatsapp")
        .map((r) => (typeof r.last_user_message_at === "string" ? r.last_user_message_at : null));

      // Newest MESSAGE_CAP, then reversed: a long thread keeps its latest
      // messages (the ones that need an answer), not its first.
      const mr = await client
        .from("lead_messages")
        .select("id, channel, direction, body, ai_generated, status, created_at, media, meta", { count: "exact" })
        .eq("consultation_id", id)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_CAP);
      if (mr.error) problems.push(`messages: ${mr.error.message}`);
      messages = ((mr.data ?? []) as Message[]).reverse();
      messageTotal = Math.max(mr.count ?? 0, messages.length);
      signed = await signImages(client, messages, id);
    }

    let activities: Activity[] = [];
    let activityTotal = 0;
    const ors = [person.kind === "person" ? `consultation_id.eq.${id}` : null, siteLead?.id && isUuid(siteLead.id) ? `lead_id.eq.${siteLead.id}` : null]
      .filter(Boolean)
      .join(",");
    if (ors) {
      const ar = await client
        .from("crm_activities")
        .select("id, actor, action, detail, created_at", { count: "exact" })
        .or(ors)
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_CAP);
      if (ar.error) problems.push(`activity: ${ar.error.message}`);
      activities = (ar.data ?? []) as Activity[];
      activityTotal = Math.max(ar.count ?? 0, activities.length);
    }

    return { person, consultation, siteLead, messages, identities, whatsappIdentityTimes, messageTotal, activities, activityTotal, signed, problems };
  } catch (e) {
    return { problem: e instanceof Error ? e.message : "Could not read this person." };
  }
}


/**
 * The next booked call for each person, keyed by consultation id.
 * Degrades to an empty Map if the bookings table is missing or unreadable.
 */
export async function upcomingCallsByConsultation(): Promise<Map<string, { start_at: string; call_type: CallType }>> {
  const out = new Map<string, { start_at: string; call_type: CallType }>();
  try {
    const { client } = db();
    if (!client) return out;
    const { data, error } = await client
      .from("crm_bookings")
      .select("consultation_id, start_at, call_type")
      .eq("status", "booked")
      .gte("start_at", new Date().toISOString())
      .not("consultation_id", "is", null)
      .order("start_at", { ascending: true })
      .limit(1000);
    if (error) return out;
    for (const r of (data ?? []) as { consultation_id: string; start_at: string; call_type: CallType }[]) {
      if (!out.has(r.consultation_id)) out.set(r.consultation_id, { start_at: r.start_at, call_type: r.call_type });
    }
  } catch {
    /* degrade to empty */
  }
  return out;
}
