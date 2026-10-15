import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { loadSettings, type BookingRow } from "@/app/lib/booking/data";
import { AdminPage, PageHeader, Notice } from "../../ui/praxel";
import CallsClient from "./CallsClient";
import SettingsPanel from "./SettingsPanel";

export const metadata: Metadata = {
  title: "Calls — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Explicit columns: the manage-token columns never leave the database here.
const COLS =
  "id, call_type, start_at, end_at, status, name, email, phone, answers, consultation_id, source, is_test, google_event_id, google_sync_error, notes, cancel_reason, created_at, confirm_sent_at, reminder_day_sent_at, reminder_hour_sent_at, send_failures, last_send_error";

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const past = tab === "past";
  const now = new Date().toISOString();
  let data: unknown[] | null = null;
  let errorMsg: string | null = null;
  try {
    const db = getSupabaseAdmin();
    const q = db.from("crm_bookings").select(COLS).order("start_at", { ascending: !past }).limit(300);
    const res = past
      ? await q.lt("start_at", now)
      : await q.gte("end_at", new Date(Date.now() - 2 * 3600_000).toISOString()).eq("status", "booked");
    data = res.data;
    errorMsg = res.error?.message ?? null;
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Could not read calls.";
  }
  const settings = await loadSettings().catch(() => null);
  return (
    <AdminPage>
      <PageHeader title="Calls" subtitle="Booked calls, your hours, and who you're ringing next." />
      {errorMsg && <Notice tone="rose" title="Couldn't read calls">{errorMsg}</Notice>}
      {settings?.row?.google_error ? (
        <Notice tone="amber" title="Google Calendar problem">
          {String(settings.row.google_error).replace(/\.+$/, "")}. The booking page is showing the callback form until this clears.
        </Notice>
      ) : null}
      <CallsClient calls={(data ?? []) as BookingRow[]} past={past} />
      {settings ? (
        <SettingsPanel
          initial={settings.rules}
          typesEnabled={settings.typesEnabled}
          googleCheckedAt={(settings.row?.google_checked_at as string | null) ?? null}
        />
      ) : (
        <Notice tone="amber" title="Settings unavailable">Couldn&apos;t read the booking settings, so the hours form is hidden.</Notice>
      )}
    </AdminPage>
  );
}
