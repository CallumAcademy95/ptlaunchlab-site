// Hand a website lead to the Leads Central setter, which opens a conversation
// with one warm, reply-inviting email (replies then flow into the setter), or,
// for call/prospectus/quiz leads with a mobile, a WhatsApp opener when its
// WEBSITE_WA_OPENER flag is on. Fire-and-forget from the form handlers; the
// setter enqueues + acks fast.

export async function notifySetter(lead: {
  name?: string | null;
  email: string;
  message?: string | null;
  source: string;
  // WhatsApp opener fields (app/lib/leads.ts setterPayloadFor).
  phone?: string;
  intent?: string;
  lead_source?: string;
  question?: string;
  wa_consent_copy?: string;
}): Promise<void> {
  const url = process.env.SETTER_INTAKE_URL;
  const key = process.env.SETTER_INTAKE_KEY;
  if (!url || !key) return; // not configured — no-op
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-key": key },
      body: JSON.stringify(lead),
    });
  } catch (err) {
    console.error("[setter-intake]", err);
  }
}

// Career Planner v2 → Leads Central. Awaited with one retry because this is the
// only route to a WhatsApp first touch; the opener cron's sweep is the backstop.
export async function notifyPlannerIntake(payload: Record<string, unknown>): Promise<boolean> {
  const url = process.env.SETTER_INTAKE_URL;
  const key = process.env.SETTER_INTAKE_KEY;
  if (!url || !key) {
    console.error("[setter-intake] level:lead-lost — SETTER_INTAKE_URL/KEY not set; planner lead not handed over");
    return false;
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-intake-key": key },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
      console.error(`[setter-intake] planner intake HTTP ${res.status} (attempt ${attempt})`);
    } catch (err) {
      console.error(`[setter-intake] planner intake failed (attempt ${attempt})`, err);
    }
  }
  console.error("[setter-intake] level:lead-lost — planner intake failed after retry", payload.email);
  return false;
}
