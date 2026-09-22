// Hand a website lead to the Leads Central setter, which opens a conversation
// with one warm, reply-inviting email (replies then flow into the setter).
// Called from the form handlers; the setter enqueues + acks fast.
//
// THIS IS THE ONLY ROUTE A WEBSITE LEAD TAKES INTO THE SETTER.
// The setter also polls the info@ mailbox (see app/api/planner-opener/route.ts,
// where REPLY_TO is info@ for exactly that reason), and /api/contact emails an
// enquiry notification to that same mailbox. Those notifications are marked
// `Auto-Submitted: auto-generated` and sent from our own domain so the poll
// skips them — otherwise one enquiry opens two conversations and the prospect
// gets contacted twice. If that marking is ever dropped, or Leads Central stops
// honouring it, that de-duplication goes with it.
//
// Env: SETTER_INTAKE_URL and SETTER_INTAKE_KEY. Both are required for any
// follow-up to happen at all — unset, this is a no-op and no lead from the
// contact form, the quiz or the prospectus is ever worked. That used to fail
// silently in both directions: no response check meant a wrong key (401) or a
// setter outage (500) logged nothing either. Both are loud now, because the
// only symptom otherwise is leads quietly going nowhere.

/**
 * @returns true when the setter accepted the lead. Callers may ignore it —
 *          follow-up is never worth failing a form submission over — but it is
 *          there so a handler can log whether the hand-off actually landed.
 */
export async function notifySetter(lead: {
  name?: string | null;
  email: string;
  message?: string | null;
  source: string;
}): Promise<boolean> {
  const url = process.env.SETTER_INTAKE_URL;
  const key = process.env.SETTER_INTAKE_KEY;
  if (!url || !key) {
    console.error(
      `[setter-intake] level:lead-lost — SETTER_INTAKE_URL/KEY not set, no follow-up for ${lead.source} lead.`
    );
    return false;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-key": key },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.error(
        `[setter-intake] level:lead-lost — setter rejected ${lead.source} lead: ${res.status}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[setter-intake] level:lead-lost — ${lead.source} hand-off failed:`, err);
    return false;
  }
}
