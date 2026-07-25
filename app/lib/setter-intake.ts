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
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-key": key },
      body: JSON.stringify(lead),
    });
  } catch (err) {
    console.error("[setter-intake]", err);
  }
}
