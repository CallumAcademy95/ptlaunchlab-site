// Hand a website lead to the Leads Central setter, which opens a conversation
// with one warm, reply-inviting email (replies then flow into the setter). Fire-
// and-forget from the form handlers; the setter enqueues + acks fast.

export async function notifySetter(lead: {
  name?: string | null;
  email: string;
  message?: string | null;
  source: string;
}): Promise<void> {
  const url = process.env.SETTER_INTAKE_URL;
  const key = process.env.SETTER_INTAKE_KEY;
  if (!url || !key) return; // not configured — no-op
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-key": key },
      body: JSON.stringify(lead),
    });
    // A rejected fetch throws, but a 401 (bad shared secret) or 500 resolves
    // normally — so without this the lead would vanish silently and Leads
    // Central would just look quiet. Log loudly; search `level:lead-lost`.
    if (!res.ok) {
      console.error(
        `[setter-intake] level:lead-lost — intake responded ${res.status} for ${lead.source}; lead not in Leads Central:`,
        lead.email,
      );
    }
  } catch (err) {
    console.error(`[setter-intake] level:lead-lost — ${lead.source}:`, lead.email, err);
  }
}
