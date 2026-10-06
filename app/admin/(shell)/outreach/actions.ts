"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { runOutreach } from "./ptApp";

// Stopping and starting the gym cold outreach, from a screen rather than a deploy.
//
// WHY THIS IS A DATABASE WRITE AND NOT AN API CALL
//
// The sending lives in another project (pt-app) on a Vercel cron, and that
// route already re-reads the gym profile on every single run:
//
//     Honours the profile's kill_switch and active flags — one row in the DB
//     stops everything, with no deploy.
//
// So the switch already existed and had no handle on it. Writing the row here
// is the whole implementation: nothing in pt-app changes, there is no shared
// secret to keep in step across two repos, and the stop takes effect on the
// next run whatever state this project's deploy is in.
//
// It also fails safe in the direction that matters. If this project is broken
// or un-deployed, the outreach carries on as configured; it cannot send MORE
// than its cap because of anything done here.

const PROFILE_SLUG = "gym-partnerships";

/**
 * Stop and start.
 *
 * `kill_switch` rather than `active`, because the two mean different things to
 * pt-app: `active` is whether this profile is in service at all, and
 * `kill_switch` is "stop now, I will turn it back on". Pausing from a screen is
 * always the second one. Flipping `active` here would quietly take the profile
 * out of the inbound reply routing too, and the gyms already written to would
 * stop getting answered.
 */
export async function setOutreachPaused(formData: FormData) {
  const paused = String(formData.get("paused") ?? "") === "1";

  const { error } = await getSupabaseAdmin()
    .from("setter_profiles")
    .update({ kill_switch: paused, updated_at: new Date().toISOString() })
    .eq("slug", PROFILE_SLUG);

  if (error) throw new Error(`could not ${paused ? "pause" : "resume"} outreach: ${error.message}`);

  revalidatePath("/admin/outreach");
}

/**
 * Send today's batch now, by hand.
 *
 * This exists because of Monday 5 October: the cron had no entry for that day,
 * nobody could tell until the morning had gone, and recovering it meant a
 * hand-built curl with a secret in it. One button is the difference between a
 * recoverable day and a lost one.
 *
 * It is NOT a way to send more. It calls the same endpoint the cron calls, so
 * pt-app applies the identical caps: twelve per run, twelve per UK day counted
 * from the data, 09:00-18:00 only, and the profile's kill switch. Pressing it
 * after the morning run has gone sends nothing and says so, which is the
 * correct behaviour rather than a failure.
 *
 * Reached only from the preview screen, so nobody sends a batch they have not
 * first seen the contents of.
 */
export async function sendBatchNow() {
  const outcome = await runOutreach({ send: true });

  if (!outcome.ok) {
    revalidatePath("/admin/outreach");
    redirect(`/admin/outreach?error=${encodeURIComponent(outcome.error)}`);
  }

  const sent = outcome.run.results.filter((r) => r.ok).length;
  const failed = outcome.run.results.filter((r) => r.ok === false);

  revalidatePath("/admin/outreach");

  // pt-app returns 200 with `skipped` when a guard refused — outside hours, cap
  // already spent, kill switch on. That is a real outcome, not an error, and
  // reporting it as success would be the "ok:true is not proof of effect"
  // mistake in its purest form.
  if (outcome.run.skipped) {
    redirect(`/admin/outreach?skipped=${encodeURIComponent(outcome.run.skipped)}`);
  }

  const params = new URLSearchParams({ sent: String(sent) });
  if (failed.length) params.set("failed", String(failed.length));
  redirect(`/admin/outreach?${params}`);
}
