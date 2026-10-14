import "server-only";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { parseMedia, signablePaths, LEAD_MEDIA_BUCKET } from "@/app/lib/message-media";
import { normalisePerson, isUuid, type CrmPerson } from "./crm";

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
  if (!client) return { people: [], problem, fallback: false };

  try {
    const { data, error } = await client
      .from("crm_people")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (!error) {
      const people = (data ?? [])
        .map((r) => normalisePerson(r as Record<string, unknown>))
        .filter((p): p is CrmPerson => p !== null);
      return { people, problem: null, fallback: false };
    }
    const viewError = error.message;
    const fb = await client
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (fb.error) return { people: [], problem: `${viewError} (fallback also failed: ${fb.error.message})`, fallback: false };
    const people = (fb.data ?? [])
      .map((r) => {
        const row = r as Record<string, unknown>;
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
    return { people, problem: viewError, fallback: true };
  } catch (e) {
    return { people: [], problem: e instanceof Error ? e.message : "Could not read the CRM.", fallback: false };
  }
}

export interface SavedView {
  id: string;
  name: string;
  query: string;
}

export async function loadSavedViews(actor: string): Promise<{ views: SavedView[]; problem: string | null }> {
  const { client, problem } = db();
  if (!client) return { views: [], problem };
  try {
    const { data, error } = await client
      .from("crm_saved_views")
      .select("id, name, query")
      .eq("actor", actor)
      .order("name", { ascending: true })
      .limit(50);
    if (error) return { views: [], problem: error.message };
    const views = (data ?? []).map((r) => ({ id: String(r.id), name: String(r.name), query: String(r.query ?? "") }));
    return { views, problem: null };
  } catch (e) {
    return { views: [], problem: e instanceof Error ? e.message : "Could not read saved views." };
  }
}

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
  activities: Activity[];
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
    let signed = new Map<string, string>();
    if (person.kind === "person") {
      const mr = await client
        .from("lead_messages")
        .select("id, channel, direction, body, ai_generated, status, created_at, media, meta")
        .eq("consultation_id", id)
        .order("created_at", { ascending: true })
        .limit(500);
      if (mr.error) problems.push(`messages: ${mr.error.message}`);
      messages = (mr.data ?? []) as Message[];
      signed = await signImages(client, messages, id);
    }

    let activities: Activity[] = [];
    const ors = [person.kind === "person" ? `consultation_id.eq.${id}` : null, siteLead?.id && isUuid(siteLead.id) ? `lead_id.eq.${siteLead.id}` : null]
      .filter(Boolean)
      .join(",");
    if (ors) {
      const ar = await client
        .from("crm_activities")
        .select("id, actor, action, detail, created_at")
        .or(ors)
        .order("created_at", { ascending: false })
        .limit(50);
      if (ar.error) problems.push(`activity: ${ar.error.message}`);
      activities = (ar.data ?? []) as Activity[];
    }

    return { person, consultation, siteLead, messages, activities, signed, problems };
  } catch (e) {
    return { problem: e instanceof Error ? e.message : "Could not read this person." };
  }
}

