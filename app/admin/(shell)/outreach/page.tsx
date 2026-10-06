import type { Metadata } from "next";
import { Mail, MessageSquare, Clock, Inbox } from "lucide-react";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import {
  AdminPage,
  PageHeader,
  Card,
  SectionTitle,
  StatTile,
  Badge,
  EmptyState,
  Notice,
  TableWrap,
  THEAD,
  TBODY,
  TR,
  TD,
  TH,
} from "../ui/praxel";
import { setOutreachPaused } from "./actions";
import {
  pipelineCounts,
  needsChasing,
  sentToday,
  sendHistory,
  daysSince,
  nextRun,
  finalRun,
  remainingSendDays,
  DAILY_CAP,
  type ProspectRow,
} from "./pipeline";

// Gym cold outreach, on a screen.
//
// It had been running for three weeks with no display of any kind. The only
// way to answer "did it send today?" was to read a cron expression, and the
// cost of that was a Saturday send and a silent Monday that took a day to
// spot. Everything here exists to make a wrong day visible the moment it
// happens rather than when someone thinks to look.

export const metadata: Metadata = {
  title: "Gym outreach — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PROFILE_SLUG = "gym-partnerships";
const CHASE_AFTER_DAYS = 14;

interface ProspectDetail extends ProspectRow {
  id: string;
  name: string | null;
  city: string | null;
  email: string | null;
}

const dateTimeUK = (d: Date) =>
  d.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const dayUK = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default async function OutreachPage() {
  const db = getSupabaseAdmin();

  // Counts come from count-only queries, never from counting rows in hand.
  //
  // gym_prospects holds 3,674 rows and PostgREST silently caps a select at
  // 1,000 with a 200 and no warning. Deriving "queued" from a fetched array
  // would therefore read 1,000 and look entirely plausible. These ask the
  // database to do the counting and transfer no rows at all.
  const countOf = async (apply: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const { count } = await apply(base());
    return count ?? 0;
  };
  function base() {
    return db.from("gym_prospects").select("id", { count: "exact", head: true });
  }

  const [totalCount, queuedCount, contactedCount, repliedCount, profileRes, contactedRes] = await Promise.all([
    countOf((q) => q),
    countOf((q) => q.eq("status", "new")),
    countOf((q) => q.eq("status", "contacted").is("replied_at", null)),
    countOf((q) => q.not("replied_at", "is", null)),
    db.from("setter_profiles").select("kill_switch, active").eq("slug", PROFILE_SLUG).maybeSingle(),
    // Only the rows that have actually been written to, newest first. ~200
    // today and growing by twelve a day, so the explicit limit is what stops
    // this becoming a silent truncation later.
    db
      .from("gym_prospects")
      .select("id, name, city, email, status, last_contacted_at, replied_at")
      .not("last_contacted_at", "is", null)
      .order("last_contacted_at", { ascending: false })
      .limit(1000),
  ]);

  const contacted = (contactedRes.data ?? []) as unknown as ProspectDetail[];
  const paused = Boolean(profileRes.data?.kill_switch) || profileRes.data?.active === false;

  const now = new Date();
  const counts = pipelineCounts(contacted);
  const chase = needsChasing(contacted, CHASE_AFTER_DAYS, now.getTime());
  const repliedRows = contacted.filter((r) => r.replied_at);
  const history = sendHistory(contacted, 10);
  const today = sentToday(contacted, now.getTime());
  const next = nextRun(now);
  const last = finalRun(now.getUTCFullYear());
  const daysLeft = remainingSendDays(now);

  return (
    <AdminPage>
      <PageHeader
        title="Gym outreach"
        subtitle="One email, once, to a gym that has never heard from us."
        badge={paused ? <Badge tone="red">paused</Badge> : <Badge tone="green">running</Badge>}
        action={
          <form action={setOutreachPaused}>
            <input type="hidden" name="paused" value={paused ? "0" : "1"} />
            <button
              type="submit"
              className={
                "rounded-full px-4 py-2 text-sm font-semibold transition " +
                (paused
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400")
              }
            >
              {paused ? "Resume sending" : "Pause sending"}
            </button>
          </form>
        }
      />

      {/*
        The status line. This is the part that would have caught the Saturday
        send and the silent Monday, so it states the next run as a real date
        rather than describing the schedule in words.
      */}
      {paused ? (
        <Notice tone="rose" title="Paused — nothing will send">
          The cron still fires on schedule and will refuse to send while this is paused. Nothing is
          queued up to go out in a burst when you resume; it simply picks up the next weekday.
        </Notice>
      ) : next ? (
        <Notice tone="blue" title={`Next send: ${dateTimeUK(next)}`}>
          {today > 0 ? `${today} sent today. ` : "Nothing sent yet today. "}
          Weekdays only, {DAILY_CAP} a day, capped in pt-app where the caller cannot raise it.{" "}
          <strong>
            {daysLeft} sending {daysLeft === 1 ? "day" : "days"} left this month ({daysLeft * DAILY_CAP} emails)
          </strong>
          , then it stops after {dateTimeUK(last)}.
        </Notice>
      ) : (
        <Notice tone="amber" title="The schedule has run out">
          The cron is pinned to October. Nothing will send again until someone extends it in
          pt-app&apos;s <code>vercel.json</code>. This was deliberate — November is meant to be a
          decision rather than a default — but nothing will remind you except this line.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<Inbox className="h-5 w-5" />} value={queuedCount.toLocaleString()} label="Queued" sublabel={`of ${totalCount.toLocaleString()} gyms`} tone="slate" />
        <StatTile icon={<Mail className="h-5 w-5" />} value={contactedCount.toLocaleString()} label="Awaiting reply" sublabel="emailed, nothing back" tone="blue" />
        <StatTile icon={<MessageSquare className="h-5 w-5" />} value={repliedCount.toLocaleString()} label="Replied" tone={repliedCount > 0 ? "green" : "slate"} />
        <StatTile icon={<Clock className="h-5 w-5" />} value={chase.length.toLocaleString()} label="Could be chased" sublabel={`no reply in ${CHASE_AFTER_DAYS} days`} tone="amber" />
      </div>

      <Card className="p-5">
        <SectionTitle hint="Newest first, by UK day.">Recent sends</SectionTitle>
        {history.length === 0 ? (
          <EmptyState title="Nothing has been sent yet" />
        ) : (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className={TH}>Day</th>
                  <th className={TH}>Sent</th>
                  <th className={TH}></th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {history.map((h) => (
                  <tr key={h.day} className={TR}>
                    <td className={TD}>{dayUK(h.day)}</td>
                    <td className={TD}>{h.count}</td>
                    <td className={TD}>
                      {h.count < DAILY_CAP && (
                        <span className="text-xs text-amber-700">under the daily cap</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle hint="They wrote back. These are the only ones that did.">Replies</SectionTitle>
        {repliedRows.length === 0 ? (
          <EmptyState title="No replies recorded" hint="A reply from a different address at a shared mail host cannot be matched automatically, so check the inbox too." />
        ) : (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className={TH}>Gym</th>
                  <th className={TH}>City</th>
                  <th className={TH}>Emailed</th>
                  <th className={TH}>Replied</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {repliedRows.map((r) => (
                  <tr key={r.id} className={TR}>
                    <td className={TD}>
                      <div className="font-semibold text-slate-900">{r.name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className={TD}>{r.city ?? "—"}</td>
                    <td className={TD}>{daysSince(r.last_contacted_at, now.getTime())}d ago</td>
                    <td className={TD}>{daysSince(r.replied_at, now.getTime())}d ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle
          hint={`Contacted ${CHASE_AFTER_DAYS}+ days ago with no reply recorded. Nothing here sends yet.`}
        >
          Could be chased ({chase.length})
        </SectionTitle>
        {/*
          Read-only on purpose. A follow-up needs a column to record that it
          happened — gym_prospects has none, and last_contacted_at would be
          overwritten — so a send button here would re-select the same gym
          every fortnight, forever. The queue is worth seeing before it is
          worth sending.
        */}
        <p className="mb-3 text-xs text-slate-500">
          &ldquo;No reply recorded&rdquo; is not the same as &ldquo;did not reply&rdquo;: a gym that
          answered from a different address at gmail or hotmail cannot be matched automatically.
          Worth a glance at the inbox before anyone is chased.
        </p>
        {chase.length === 0 ? (
          <EmptyState title="Nobody is overdue a chase" />
        ) : (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className={TH}>Gym</th>
                  <th className={TH}>City</th>
                  <th className={TH}>Emailed</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {chase.slice(0, 50).map((r) => (
                  <tr key={r.id} className={TR}>
                    <td className={TD}>
                      <div className="font-semibold text-slate-900">{r.name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className={TD}>{r.city ?? "—"}</td>
                    <td className={TD}>{daysSince(r.last_contacted_at, now.getTime())} days ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
        {chase.length > 50 && (
          <p className="mt-3 text-xs text-slate-500">Showing the 50 longest waiting.</p>
        )}
      </Card>
    </AdminPage>
  );
}
