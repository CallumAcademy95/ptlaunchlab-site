import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Clock, UserRound, Inbox } from "lucide-react";
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
import {
  leadCounts,
  byUrgency,
  waitingOnUs,
  needsHuman,
  isClosed,
  hoursWaiting,
  channelLabel,
  type LeadRow,
} from "./pipeline";

// Every conversation the setter is having, in one place.
//
// It was answering replies on four channels with nothing on screen showing it.
// The cost of that was measured on 2026-10-05: PFP Exeter replied to a cold
// email twelve minutes after it landed, and because they write from a gmail
// address the reply could not be linked back to the prospect — so the outreach
// screen said one reply out of twelve and nothing, anywhere, showed the other.

export const metadata: Metadata = {
  title: "Leads — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const show = (await searchParams).show ?? "live";

  const { data, error } = await getSupabaseAdmin()
    .from("consultations")
    .select(
      "id, name, email, primary_channel, setter_status, setter_stage, setter_intent, " +
        "last_inbound_at, last_outbound_at, ai_unanswered_count, unsubscribed, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  const leads = (data ?? []) as unknown as LeadRow[];
  const counts = leadCounts(leads);
  const now = Date.now();

  const filtered =
    show === "waiting"
      ? leads.filter((l) => !isClosed(l) && waitingOnUs(l))
      : show === "human"
        ? leads.filter((l) => !isClosed(l) && needsHuman(l))
        : show === "closed"
          ? leads.filter(isClosed)
          : leads.filter((l) => !isClosed(l));

  const rows = byUrgency(filtered);

  const tab = (key: string, label: string, n: number) => (
    <Link
      key={key}
      href={`/admin/leads?show=${key}`}
      className={
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition md:px-3 md:py-1.5 md:text-xs " +
        (show === key
          ? "border-blue-600 bg-blue-700 text-white"
          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300")
      }
    >
      {label} <span className="opacity-70">· {n}</span>
    </Link>
  );

  return (
    <AdminPage>
      <PageHeader
        title="Leads"
        subtitle="Every conversation the setter is having, across email, WhatsApp, Messenger and Instagram."
      />

      {error && (
        <Notice tone="rose" title="Could not read the conversations">
          {error.message}
        </Notice>
      )}

      {counts.waiting > 0 && (
        <Notice tone="amber" title={`${counts.waiting} waiting on a reply`}>
          Someone wrote more recently than we did. This is computed from the conversation itself, so
          it includes replies that could not be linked back to a gym — which is most of the reason
          this screen exists.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<MessageSquare className="h-5 w-5" />} value={counts.live} label="Live conversations" tone="blue" />
        <StatTile icon={<Clock className="h-5 w-5" />} value={counts.waiting} label="Waiting on us" tone={counts.waiting ? "amber" : "slate"} />
        <StatTile icon={<UserRound className="h-5 w-5" />} value={counts.needsHuman} label="Needs a human" sublabel="escalated or paused" tone={counts.needsHuman ? "rose" : "slate"} />
        <StatTile icon={<Inbox className="h-5 w-5" />} value={counts.closed} label="Closed" tone="slate" />
      </div>

      <Card className="p-4 sm:p-5">
        <SectionTitle hint="Waiting on us first, then needing a human, then by recency.">
          Conversations
        </SectionTitle>

        {/* One scrolling row on a phone rather than two wrapped ones. */}
        <div className="-mx-4 mb-3 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 md:mx-0 md:mt-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          {tab("live", "Live", counts.live)}
          {tab("waiting", "Waiting on us", counts.waiting)}
          {tab("human", "Needs a human", counts.needsHuman)}
          {tab("closed", "Closed", counts.closed)}
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Nothing here" hint="Try another tab." />
        ) : (
          <>
          {/* Phone: one card per conversation. A six-column table at 390px
              showed two columns and hid the rest off to the right. */}
          <ul className="space-y-2.5 md:hidden">
            {rows.map((l) => {
              const waiting = !isClosed(l) && waitingOnUs(l);
              const hrs = hoursWaiting(l, now);
              return (
                <li key={l.id}>
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className={
                      "block rounded-xl border bg-white p-3.5 shadow-sm transition active:bg-slate-50 " +
                      (waiting ? "border-amber-200" : "border-slate-200")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-slate-900">
                          {l.name || l.email || "Unnamed"}
                        </p>
                        {l.name && l.email && (
                          <p className="truncate text-xs text-slate-500">{l.email}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {channelLabel(l.primary_channel)}
                      </span>
                    </div>
                    <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div className="min-w-0">
                        <dt className="text-slate-400">They said</dt>
                        <dd className="font-medium text-slate-700">{when(l.last_inbound_at)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-slate-400">We said</dt>
                        <dd className="font-medium text-slate-700">{when(l.last_outbound_at)}</dd>
                      </div>
                    </dl>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1">
                      {l.setter_stage && (
                        <span className="mr-1 text-xs text-slate-500">{l.setter_stage}</span>
                      )}
                      {waiting && (
                        <Badge tone="amber">
                          waiting{hrs !== null && hrs >= 1 ? ` ${hrs}h` : ""}
                        </Badge>
                      )}
                      {!isClosed(l) && needsHuman(l) && <Badge tone="red">needs a human</Badge>}
                      {l.unsubscribed && <Badge tone="neutral">unsubscribed</Badge>}
                      {isClosed(l) && !l.unsubscribed && <Badge tone="neutral">closed</Badge>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <TableWrap className="hidden md:block">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className={TH}>Who</th>
                  <th className={TH}>Channel</th>
                  <th className={TH}>Stage</th>
                  <th className={TH}>They said</th>
                  <th className={TH}>We said</th>
                  <th className={TH}>State</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {rows.map((l) => {
                  const waiting = !isClosed(l) && waitingOnUs(l);
                  const hrs = hoursWaiting(l, now);
                  return (
                    <tr key={l.id} className={TR}>
                      <td className={TD}>
                        <Link
                          href={`/admin/leads/${l.id}`}
                          className="font-semibold text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline"
                        >
                          {l.name || l.email || "Unnamed"}
                        </Link>
                        {l.name && l.email && <div className="text-xs text-slate-500">{l.email}</div>}
                      </td>
                      <td className={TD}>{channelLabel(l.primary_channel)}</td>
                      <td className={TD}>{l.setter_stage ?? "—"}</td>
                      <td className={TD}>{when(l.last_inbound_at)}</td>
                      <td className={TD}>{when(l.last_outbound_at)}</td>
                      <td className={TD}>
                        <div className="flex flex-wrap gap-1">
                          {waiting && (
                            <Badge tone="amber">
                              waiting{hrs !== null && hrs >= 1 ? ` ${hrs}h` : ""}
                            </Badge>
                          )}
                          {!isClosed(l) && needsHuman(l) && <Badge tone="red">needs a human</Badge>}
                          {l.unsubscribed && <Badge tone="neutral">unsubscribed</Badge>}
                          {isClosed(l) && !l.unsubscribed && <Badge tone="neutral">closed</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          </>
        )}
      </Card>
    </AdminPage>
  );
}
