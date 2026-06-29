// ─────────────────────────────────────────────────────────────────────────────
// MailerLite (Connect API) — minimal server-side helper.
//
// Used to add registrants straight into a group (e.g. the "Live Sessions" list)
// without going through Zapier. Requires MAILERLITE_TOKEN in the environment.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://connect.mailerlite.com/api';

/**
 * Create/update a subscriber and assign them to a group. Idempotent on email —
 * MailerLite upserts by email and adds the group if not already present.
 */
export async function mlAddSubscriber(params: {
  email: string;
  name?: string;
  phone?: string;
  groupId: string;
}): Promise<void> {
  const token = process.env.MAILERLITE_TOKEN;
  if (!token) throw new Error('MAILERLITE_TOKEN not set');

  const fields: Record<string, string> = {};
  if (params.name) fields.name = params.name;
  if (params.phone) fields.phone = params.phone;

  const res = await fetch(`${BASE}/subscribers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      fields,
      groups: [params.groupId],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MailerLite ${res.status}: ${body}`);
  }
}
