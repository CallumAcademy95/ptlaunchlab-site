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

/**
 * Unsubscribe an email from everything. Sets BOTH:
 *
 *  - `status: "unsubscribed"` — stops MailerLite's own automations (the 52-week
 *    nurture, the quiz/prospectus/book-a-call sequences).
 *  - `fields.ptll_status: "unsubscribed"` — stops the self-hosted Render drip
 *    engine, which gates every send on this custom field (scheduler.js).
 *
 * Both are required. The Render service's own /unsubscribe endpoint sets only the
 * custom field, so a person who unsubscribed there is still enrolled in MailerLite's
 * native automations. Setting only `status` would leave the Render drip running.
 *
 * Idempotent: unsubscribing an already-unsubscribed or unknown address is not an error.
 */
export async function mlUnsubscribe(email: string): Promise<void> {
  const token = process.env.MAILERLITE_TOKEN;
  if (!token) throw new Error('MAILERLITE_TOKEN not set');

  const res = await fetch(`${BASE}/subscribers/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      status: 'unsubscribed',
      fields: { ptll_status: 'unsubscribed' },
    }),
  });

  // 404 = not on the list. From the subscriber's point of view that is success:
  // they are not going to receive anything. Do not surface it as a failure.
  if (res.status === 404) return;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MailerLite unsubscribe ${res.status}: ${body}`);
  }
}
