"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

// Status triage for /admin/live-questions. The page route is gated by the
// admin auth cookie in middleware (any /admin/* path), so these actions —
// which POST back to that path — are protected by the same gate.

const ALLOWED = new Set(["new", "starred", "answered", "hidden"]);

export async function setQuestionStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !ALLOWED.has(status)) return;

  const { error } = await getSupabaseAdmin()
    .from("live_questions")
    .update({ status })
    .eq("id", id);

  if (error) console.error("[admin/live-questions] status update failed:", error);
  revalidatePath("/admin/live-questions");
}
