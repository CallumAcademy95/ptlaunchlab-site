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
 * Save the first-contact copy.
 *
 * NOTE WHAT THIS DOES NOT DO: it does not validate the template.
 *
 * pt-app already owns those rules — it must, because it is the thing that
 * sends, and a template it refuses falls back to the built-in copy whatever
 * this project believes. Re-implementing the checks here would create a second
 * set that drifts from the first, and the drift would be invisible: the editor
 * would say "looks fine" while the sender quietly ignored the row.
 *
 * So the save is unconditional, and the editor asks pt-app for its verdict
 * immediately afterwards by running a dry run and reading `copy`. One set of
 * rules, in the only place that can enforce them.
 */
export async function saveOutreachTemplate(formData: FormData) {
  const subject = String(formData.get("subject") ?? "").trim();
  const subject_fallback = String(formData.get("subject_fallback") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  const { error } = await getSupabaseAdmin()
    .from("outreach_templates")
    .update({
      subject,
      subject_fallback,
      body,
      updated_at: new Date().toISOString(),
      updated_by: "admin",
    })
    .eq("key", "gym-first-contact");

  if (error) {
    redirect(`/admin/outreach/template?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/outreach/template");
  revalidatePath("/admin/outreach");
  redirect("/admin/outreach/template?saved=1");
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
