import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import {
  computeLeadScore,
  deriveTags,
  mergeSignals,
  type VisitorSignals,
} from "./scoring";

// ─────────────────────────────────────────────────────────────────────────────
// WS2 Intelligence Layer — server-side profile writer.
//
// Persists a visitor event and folds it into the unified profile (signals →
// score → tags). BEST-EFFORT by design: if Supabase isn't configured, or any
// write fails, it logs and returns without throwing — intelligence must NEVER
// block a user action or an ad. Call this fire-and-forget (`void recordVisitor…`)
// from API routes once an anon_id cookie is being issued client-side.
//
// Requires the 20260702_visitor_intelligence migration to be applied.
// ─────────────────────────────────────────────────────────────────────────────

/** Map a raw event type to the signal counters it contributes. */
export function signalDeltaForEvent(type: string, meta: Record<string, unknown> = {}): Partial<VisitorSignals> {
  switch (type) {
    case "page_view": return { pageViews: 1 };
    case "guide_view": return { guideViews: 1, pageViews: 1 };
    case "video_progress": return { maxVideoPct: Number(meta.pct) || 0 };
    case "quiz_complete": return { quizCompleted: 1, quizScore: Number(meta.score) || 0 };
    case "career_planner_complete": return { careerPlannerCompleted: 1 };
    case "salary_calc": return { salaryCalcUsed: 1 };
    case "download": return { downloads: 1 };
    case "live_register": return { liveRegistered: 1 };
    case "live_attend": return { liveAttended: 1 };
    case "book_call_start": return { bookCallStarted: 1 };
    case "checkout_start": return { checkoutStarted: 1 };
    case "objection": return { objectionLogged: 1 };
    case "whatsapp_reply": return { whatsappReplied: 1 };
    default: return {};
  }
}

export interface RecordEventInput {
  anonId: string;
  type: string;
  meta?: Record<string, unknown>;
  email?: string;
  name?: string;
  phone?: string;
  inferredAvatar?: string;
  objectionReason?: string;
  /** Overrides the derived signal delta if provided. */
  signalDelta?: Partial<VisitorSignals>;
  /** First/last-touch attribution snapshot (utm, referrer, landing). */
  touch?: Record<string, unknown>;
}

type ProfileRow = {
  signals: VisitorSignals | null;
  email: string | null;
  first_touch: Record<string, unknown> | null;
};

/**
 * Record an event and update the visitor's profile. Never throws.
 * Returns the new lead score on success, or null if it was a no-op.
 */
export async function recordVisitorEvent(input: RecordEventInput): Promise<number | null> {
  const { anonId, type, meta = {}, email, name, phone, inferredAvatar, objectionReason, touch } = input;
  if (!anonId || !type) return null;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    // Supabase not configured (e.g. local without env) — degrade silently.
    return null;
  }

  try {
    // Append the raw event.
    await supabase.from("visitor_events").insert({
      anon_id: anonId,
      email: email ?? null,
      type,
      meta,
    });

    // Load the existing profile (if any) to merge signals.
    const { data: existing } = await supabase
      .from("visitor_profiles")
      .select("signals, email, first_touch")
      .eq("anon_id", anonId)
      .maybeSingle<ProfileRow>();

    const delta = input.signalDelta ?? signalDeltaForEvent(type, meta);
    const prevSignals: VisitorSignals = existing?.signals ?? {};
    const signals = mergeSignals(prevSignals, delta);
    const lead_score = computeLeadScore(signals);
    const tags = deriveTags(signals, objectionReason);
    const now = new Date().toISOString();

    const row: Record<string, unknown> = {
      anon_id: anonId,
      signals,
      lead_score,
      tags,
      updated_at: now,
    };
    if (email) row.email = email;
    if (name) row.name = name;
    if (phone) row.phone = phone;
    if (inferredAvatar) row.inferred_avatar = inferredAvatar;
    if (touch) row.last_touch = touch;
    // Only set first_touch on first sight.
    if (!existing) row.first_touch = touch ?? {};

    await supabase.from("visitor_profiles").upsert(row, { onConflict: "anon_id" });
    return lead_score;
  } catch (err) {
    console.error("[intelligence] recordVisitorEvent failed (non-blocking):", err);
    return null;
  }
}
