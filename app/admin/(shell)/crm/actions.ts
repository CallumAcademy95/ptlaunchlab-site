"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "@/app/lib/admin-auth";
import { validateModeChange, validateSavedView, mergeQualified, modeOf, isUuid, KNOWN_STATUSES } from "./crm";

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
  if (!isUuid(input.id)) return { ok: false, error: "Unknown person." };
  const expected = typeof input.expected === "string" ? input.expected : null;
  if (!expected || !(KNOWN_STATUSES as readonly string[]).includes(expected)) {
    return { ok: false, error: "This person has no conversation to control." };
  }

  try {
    const db = getSupabaseAdmin();
    const cur = await db.from("consultations").select("id, setter_status, unsubscribed").eq("id", input.id).maybeSingle();
    if (cur.error) return { ok: false, error: cur.error.message };
    if (!cur.data) return { ok: false, error: "Unknown person." };
    if (cur.data.setter_status !== expected) {
      return { ok: false, conflict: true, error: "Changed elsewhere, refresh." };
    }

    const v = validateModeChange({
      current: expected,
      target: input.target,
      reason: input.reason,
      note: input.note,
      unsubscribed: cur.data.unsubscribed === true,
    });
    if (!v.ok) return v;

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("consultations")
      .update({ setter_status: v.status, dnc_reason: v.dncReason, mode_changed_at: now, mode_changed_by: ACTOR })
      .eq("id", input.id)
      .eq("setter_status", expected)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, conflict: true, error: "Changed elsewhere, refresh." };

    const warning = await logActivity({
      consultation_id: input.id,
      action: "mode_changed",
      detail: { from: expected, to: v.status, from_mode: modeOf(expected), to_mode: input.target, dnc_reason: v.dncReason },
    });
    done(input.id);
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
  if (!isUuid(input.id)) return { ok: false, error: "Unknown person." };
  if (typeof input.value !== "boolean") return { ok: false, error: "Invalid value." };

  try {
    const db = getSupabaseAdmin();
    const cur = await db.from("consultations").select("ai_profile").eq("id", input.id).maybeSingle();
    if (cur.error) return { ok: false, error: cur.error.message };
    if (!cur.data) return { ok: false, error: "Unknown person." };
    const merged = mergeQualified(cur.data.ai_profile, input.value);
    const { error } = await db.from("consultations").update({ ai_profile: merged }).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    const warning = await logActivity({
      consultation_id: input.id,
      action: "qualified_set",
      detail: { already_qualified: input.value },
    });
    done(input.id);
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
  const viewId = typeof input.id === "number" ? String(input.id) : input.id;
  if (!isUuid(viewId) && !(typeof viewId === "string" && /^\d{1,18}$/.test(viewId))) {
    return { ok: false, error: "Unknown view." };
  }
  try {
    const { error } = await getSupabaseAdmin().from("crm_saved_views").delete().eq("id", viewId).eq("actor", ACTOR);
    if (error) return { ok: false, error: error.message };
    done();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete the view." };
  }
}
