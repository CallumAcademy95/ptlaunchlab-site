"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "@/app/lib/admin-auth";
import { planModeChange, validateSavedView, validateQualifiedInput, mergeQualified, viewIdOf } from "./crm";

// The CRM's writes.
//
// - Admin only: the middleware gates /admin, and every action re-checks the
//   signed cookie itself so a matcher change can't open these up.
// - Service role, server side only.
// - Inputs are validated against fixed enums (crm.ts) before anything is written.
// - Nothing here sends a message. Changing a mode only changes what the setter
//   is allowed to do next.

/** Who did it. One login today; stored on every write so a second one can be told apart later. */
const ACTOR = "callum";

export type ActionResult = { ok: true; warning?: string } | { ok: false; error: string; conflict?: boolean };

async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyAuthCookieValue(jar.get(ADMIN_AUTH_COOKIE)?.value).catch(() => false);
}

const DENIED: ActionResult = { ok: false, error: "Not signed in. Sign in at /admin/login." };

function done(id?: string) {
  revalidatePath("/admin/crm");
  if (id) revalidatePath(`/admin/crm/${id}`);
}

async function logActivity(entry: {
  consultation_id?: string | null;
  lead_id?: string | null;
  action: string;
  detail: Record<string, unknown>;
}): Promise<string | undefined> {
  try {
    const { error } = await getSupabaseAdmin()
      .from("crm_activities")
      .insert({ consultation_id: entry.consultation_id ?? null, lead_id: entry.lead_id ?? null, actor: ACTOR, action: entry.action, detail: entry.detail });
    return error ? `Saved, but the activity log could not be written (${error.message}).` : undefined;
  } catch (e) {
    return `Saved, but the activity log could not be written (${e instanceof Error ? e.message : "unknown error"}).`;
  }
}

/**
 * Change who is in charge of a conversation.
 *
 * `expected` is the setter_status the panel was showing. The update only
 * matches a row still in that status, so a stale panel can't stomp on a change
 * made elsewhere (by the setter itself, Leads Central, or another tab).
 */
export async function changeMode(input: {
  id: unknown;
  expected: unknown;
  target: unknown;
  reason?: unknown;
  note?: unknown;
}): Promise<ActionResult> {
  if (!(await isAdmin())) return DENIED;
  // Cheap checks first, so a malformed request never reaches the database.
  const pre = planModeChange(input, { setter_status: input.expected, unsubscribed: false }, "", ACTOR);
  if (!pre.ok) return pre;

  try {
    const db = getSupabaseAdmin();
    const id = input.id as string;
    const cur = await db.from("consultations").select("id, setter_status, unsubscribed").eq("id", id).maybeSingle();
    if (cur.error) return { ok: false, error: cur.error.message };

    const plan = planModeChange(input, cur.data, new Date().toISOString(), ACTOR);
    if (!plan.ok) return plan;

    // Conditional on the status the panel showed: a stale panel can't stomp a newer change.
    const { data, error } = await db
      .from("consultations")
      .update(plan.update)
      .eq("id", id)
      .eq("setter_status", input.expected as string)
      .select("id");
    // Before the CRM migration is applied this is where it fails (reply_only is
    // not in the CHECK yet, dnc_reason/mode_changed_* don't exist): say so plainly.
    if (error) return { ok: false, error: `The database refused the change: ${error.message}` };
    if (!data || data.length === 0) return { ok: false, conflict: true, error: "Changed elsewhere, refresh." };

    const warning = await logActivity({ consultation_id: id, action: "mode_changed", detail: plan.activity });
    done(id);
    return { ok: true, warning };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not change the mode." };
  }
}

/**
 * The coach's "Already a qualified PT" choice.
 *
 * Read, merge, write: every other ai_profile key (planner answers, the
 * setter's notes) is kept. Recorded with already_qualified_set_by:"coach", the
 * same marker Leads Central uses, so the setter never overrides it.
 */
export async function setQualified(input: { id: unknown; value: unknown }): Promise<ActionResult> {
  if (!(await isAdmin())) return DENIED;
  const q = validateQualifiedInput(input);
  if (!q.ok) return q;

  try {
    const db = getSupabaseAdmin();
    const cur = await db.from("consultations").select("ai_profile").eq("id", q.id).maybeSingle();
    if (cur.error) return { ok: false, error: cur.error.message };
    if (!cur.data) return { ok: false, error: "Unknown person." };
    const merged = mergeQualified(cur.data.ai_profile, q.value);
    const { error } = await db.from("consultations").update({ ai_profile: merged }).eq("id", q.id);
    if (error) return { ok: false, error: error.message };
    const warning = await logActivity({
      consultation_id: q.id,
      action: "qualified_set",
      detail: { already_qualified: q.value },
    });
    done(q.id);
    return { ok: true, warning };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
}

/** Save the current filters as a named view (replacing one with the same name). */
export async function saveView(input: { name: unknown; query: unknown }): Promise<ActionResult> {
  if (!(await isAdmin())) return DENIED;
  const v = validateSavedView(input.name, input.query);
  if (!v.ok) return v;
  try {
    const { error } = await getSupabaseAdmin()
      .from("crm_saved_views")
      .upsert({ actor: ACTOR, name: v.name, query: v.query }, { onConflict: "actor,name" });
    if (error) return { ok: false, error: error.message };
    done();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save the view." };
  }
}

export async function deleteView(input: { id: unknown }): Promise<ActionResult> {
  if (!(await isAdmin())) return DENIED;
  const viewId = viewIdOf(input.id);
  if (!viewId) return { ok: false, error: "Unknown view." };
  try {
    const { error } = await getSupabaseAdmin().from("crm_saved_views").delete().eq("id", viewId).eq("actor", ACTOR);
    if (error) return { ok: false, error: error.message };
    done();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete the view." };
  }
}
