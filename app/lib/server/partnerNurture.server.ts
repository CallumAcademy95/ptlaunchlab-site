// Sends partner-page enquiry follow-up emails. The sequences and the "what is
// due" rule are in app/lib/partnerNurture.ts; this file does the database and
// Resend work.
//
// Called two ways:
//   - by /api/lead right after an enquiry is saved (leadId set), so email 1
//     goes straight away;
//   - by the hourly cron, /api/partner-nurture, for everything else.
//
// At most once per email: a lead's step is CLAIMED (conditional update on the
// step it was read at) before sending, so two overlapping runs can't both send
// it. If the send then fails, the claim is released and the next run retries.

import { Resend } from "resend";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { dueStep, renderEmail, sequenceFor, type NurtureLead } from "@/app/lib/partnerNurture";

const FROM_ADDRESS = "enrolments@ptlaunchlab.co.uk";
const REPLY_TO = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

type Row = NurtureLead & { id: string; name: string; email: string };

export type NurtureRunResult = { checked: number; sent: number; enrolled: number; done: number; failed: string[] };

/** Escape a value for an exact-match ilike (case-insensitive equality). */
const ilikeExact = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function runPartnerNurture(opts: { leadId?: string; now?: Date } = {}): Promise<NurtureRunResult> {
  const now = opts.now ?? new Date();
  const out: NurtureRunResult = { checked: 0, sent: 0, enrolled: 0, done: 0, failed: [] };
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    out.failed.push("RESEND_API_KEY not set");
    return out;
  }
  const db = getSupabaseAdmin();
  const resend = new Resend(key);

  let q = db
    .from("leads")
    .select("id,name,email,created_at,nurture_step,nurture_stopped,is_spam,is_test,gym_slug")
    .eq("intent", "partner_enquiry")
    .is("nurture_stopped", null)
    .eq("is_spam", false)
    .eq("is_test", false)
    .order("created_at", { ascending: true })
    .limit(200);
  if (opts.leadId) q = q.eq("id", opts.leadId);
  const { data, error } = await q;
  if (error) {
    out.failed.push(`select: ${error.message}`);
    return out;
  }

  for (const lead of (data ?? []) as Row[]) {
    out.checked++;
    const seq = sequenceFor(lead.gym_slug);
    if (!seq) continue;
    if (lead.nurture_step >= seq.emails.length) {
      await db.from("leads").update({ nurture_stopped: "done" }).eq("id", lead.id);
      out.done++;
      continue;
    }
    const step = dueStep(lead, now);
    if (step === null) continue;

    // Enrolled since enquiring? Stop: they don't need selling to.
    const { data: sale } = await db.from("pp_sales").select("id").ilike("learner_email", ilikeExact(lead.email)).limit(1);
    if (sale && sale.length > 0) {
      await db.from("leads").update({ nurture_stopped: "enrolled" }).eq("id", lead.id).is("nurture_stopped", null);
      out.enrolled++;
      continue;
    }

    // Claim the step.
    const last = step + 1 >= seq.emails.length;
    const { data: claimed } = await db
      .from("leads")
      .update({ nurture_step: step + 1, nurture_last_sent_at: now.toISOString(), ...(last ? { nurture_stopped: "done" } : {}) })
      .eq("id", lead.id)
      .eq("nurture_step", step)
      .is("nurture_stopped", null)
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    const mail = renderEmail(seq, step, lead);
    const oneClick = `https://ptlaunchlab.co.uk/api/unsubscribe?email=${encodeURIComponent(lead.email)}`;
    let sendError: string | null = null;
    try {
      const { error: e } = await resend.emails.send({
        from: `${seq.fromName} <${FROM_ADDRESS}>`,
        to: lead.email,
        replyTo: REPLY_TO,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      if (e) sendError = JSON.stringify(e).slice(0, 200);
    } catch (e) {
      sendError = e instanceof Error ? e.message : String(e);
    }

    if (sendError) {
      // Release the claim so the next run tries again.
      await db
        .from("leads")
        .update({ nurture_step: step, nurture_last_sent_at: null, nurture_stopped: null })
        .eq("id", lead.id)
        .eq("nurture_step", step + 1);
      out.failed.push(`${lead.id} step ${step + 1}: ${sendError}`);
      console.error(`[partner-nurture] send failed for lead ${lead.id} step ${step + 1}: ${sendError}`);
      continue;
    }
    out.sent++;
    if (last) out.done++;
  }
  return out;
}

/** Unsubscribe: stop every running partner sequence for this address. */
export async function stopPartnerNurtureByEmail(email: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("leads")
    .update({ nurture_stopped: "unsubscribed" })
    .eq("intent", "partner_enquiry")
    .ilike("email", ilikeExact(email))
    .is("nurture_stopped", null);
  if (error) throw new Error(`partner nurture stop: ${error.message}`);
}
