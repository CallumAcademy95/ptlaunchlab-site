import "server-only";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendOwnerPush, type OwnerPushDb } from "@/app/lib/owner-push";
import { CALL_TYPES } from "./callTypes";
import { longLabel } from "./london";
import type { BookingRow } from "./data";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Push + email to Callum. Never throws; test bookings are labelled. */
export async function alertOwner(kind: "booked" | "moved" | "cancelled", b: BookingRow): Promise<void> {
  const when = longLabel(Date.parse(b.start_at));
  const title = `${b.is_test ? "[TEST] " : ""}Call ${kind}: ${b.name}`;
  const body = `${CALL_TYPES[b.call_type].title}, ${when}. Ring ${b.phone}.`;
  try {
    await sendOwnerPush(getSupabaseAdmin() as unknown as OwnerPushDb, { title, body, url: "/admin/crm/calls", tag: `booking-${b.id}` });
  } catch (e) { console.error("[booking] push failed", e); }
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "PT Launch Lab Alerts <info@ptlaunchlab.co.uk>", to: ADMIN_EMAIL, subject: title,
      html: `<p>${esc(body)}</p><p>${esc(b.email)}</p><p><a href="https://ptlaunchlab.co.uk/admin/crm/calls">Open Calls</a></p>`,
    });
    if (error) console.error("[booking] alert email rejected", error);
  } catch (e) { console.error("[booking] alert email failed", e); }
}
