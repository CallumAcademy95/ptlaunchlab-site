"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

// Two separate decisions, deliberately two separate actions.
//
// "Did the person they named enrol?" and "have we paid the referrer their
// £200?" are different facts. Collapsing them into one control is how someone
// ends up marked as paid because they enrolled, or chased for a payment that
// already went out.

const STATUSES = ["new", "contacted", "enrolled", "declined", "duplicate"] as const;
const REWARDS = ["pending", "due", "paid", "void"] as const;

export async function setReferralStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) return;

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  // Enrolling is what makes the money owed. Nothing else does, and this must
  // not silently mark it paid — that stays a separate, deliberate click.
  if (status === "enrolled") patch.reward_status = "due";
  // A referral that went nowhere owes nothing, but never un-pay a paid one.
  if (status === "declined" || status === "duplicate") patch.reward_status = "void";

  const q = getSupabaseAdmin().from("referrals").update(patch).eq("id", id);
  await (status === "declined" || status === "duplicate" ? q.neq("reward_status", "paid") : q);

  revalidatePath("/admin/referrals");
}

export async function setReferralReward(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reward_status = String(formData.get("reward_status") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  if (!id || !REWARDS.includes(reward_status as (typeof REWARDS)[number])) return;

  await getSupabaseAdmin()
    .from("referrals")
    .update({
      reward_status,
      reward_paid_at: reward_status === "paid" ? new Date().toISOString() : null,
      reward_reference: reference || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/referrals");
}
