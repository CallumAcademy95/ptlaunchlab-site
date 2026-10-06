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
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
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

      <Card className="p-5">
        <SectionTitle hint="Waiting on us first, then needing a human, then by recency.">
          Conversations
        </SectionTitle>

        <div className="mb-3 flex flex-wrap gap-2">
          {tab("live", "Live", counts.live)}
          {tab("waiting", "Waiting on us", counts.waiting)}
          {tab("human", "Needs a human", counts.needsHuman)}
          {tab("closed", "Closed", counts.closed)}
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Nothing here" hint="Try another tab." />
        ) : (
          <TableWrap>
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
        )}
      </Card>
    </AdminPage>
  );
}
