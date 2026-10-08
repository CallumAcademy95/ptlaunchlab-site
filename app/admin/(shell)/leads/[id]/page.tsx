import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import {
  AdminPage,
  PageHeader,
  Card,
  SectionTitle,
  Badge,
  EmptyState,
  Notice,
  DefRow,
} from "../../ui/praxel";
import {
  waitingOnUs,
  needsHuman,
  isClosed,
  channelLabel,
  hoursWaiting,
  nudgesSinceTheySpoke,
  type LeadRow,
} from "../pipeline";
import { messageToDisplayText, originalForDisplay, looksLikeHtml } from "@/app/lib/message-display";
import { MessageBody } from "./MessageBody";

// One conversation, in full.
//
// The thread is the point. A summary of what the setter thinks happened is
// useful; what was actually said is what tells you whether to step in, and it
// was previously only readable in the Gmail account or in the database.

export const metadata: Metadata = {
  title: "Lead — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Message {
  id: string;
  channel: string | null;
  direction: string;
  body: string | null;
  ai_generated: boolean | null;
  status: string | null;
  created_at: string;
}

const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  const [leadRes, msgRes] = await Promise.all([
    db
      .from("consultations")
      .select(
        "id, name, email, phone, primary_channel, setter_status, setter_stage, setter_intent, " +
          "ai_summary, ai_unanswered_count, last_inbound_at, last_outbound_at, unsubscribed, " +
          "setter_paused_reason, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("lead_messages")
      .select("id, channel, direction, body, ai_generated, status, created_at")
      .eq("consultation_id", id)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  if (!leadRes.data) notFound();

  const lead = leadRes.data as unknown as LeadRow & {
    phone: string | null;
    ai_summary: string | null;
    setter_paused_reason: string | null;
  };
  const messages = (msgRes.data ?? []) as unknown as Message[];
  const waiting = !isClosed(lead) && waitingOnUs(lead);
  const hrs = hoursWaiting(lead, Date.now());

  return (
    <AdminPage>
      <PageHeader
        title={lead.name || lead.email || "Unnamed lead"}
        subtitle={[channelLabel(lead.primary_channel), lead.email, lead.phone].filter(Boolean).join(" · ")}
        backHref="/admin/leads"
        backLabel="Leads"
        badge={
          <div className="flex flex-wrap gap-1">
            {waiting && <Badge tone="amber">waiting{hrs !== null && hrs >= 1 ? ` ${hrs}h` : ""}</Badge>}
            {!isClosed(lead) && needsHuman(lead) && <Badge tone="red">needs a human</Badge>}
            {lead.unsubscribed && <Badge tone="neutral">unsubscribed</Badge>}
            {isClosed(lead) && !lead.unsubscribed && <Badge tone="neutral">closed</Badge>}
          </div>
        }
      />

      {waiting && (
        <Notice tone="amber" title="They wrote last">
          Nothing has gone back to them since. Replies are sent from the Gmail account, not from
          here — this screen reads the conversation, it does not take part in it.
        </Notice>
      )}

      {lead.setter_paused_reason && (
        <Notice tone="rose" title="The setter paused itself">
          {lead.setter_paused_reason}
        </Notice>
      )}

      <Card className="p-4 sm:p-5">
        <SectionTitle hint="What the setter believes about this conversation.">Summary</SectionTitle>
        {lead.ai_summary ? (
          <p className="text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{lead.ai_summary}</p>
        ) : (
          <p className="text-sm text-slate-500">No summary yet.</p>
        )}
        <dl className="mt-4">
          <DefRow k="Stage" v={lead.setter_stage ?? "—"} />
          <DefRow k="Status" v={lead.setter_status ?? "—"} />
          <DefRow k="Intent" v={lead.setter_intent != null ? `${lead.setter_intent}/100` : "—"} />
          {/*
            Named ai_unanswered_count in the database, which reads as "the AI
            failed to answer" and means nothing of the sort — it counts OUR
            messages since they last spoke. Labelled for what it is.
          */}
          <DefRow
            k="Sent since they last spoke"
            v={
              nudgesSinceTheySpoke(lead) === 0
                ? "nothing — their reply is the newest thing here"
                : String(nudgesSinceTheySpoke(lead))
            }
          />
          <DefRow k="First seen" v={stamp(lead.created_at)} />
        </dl>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionTitle hint={`${messages.length} message${messages.length === 1 ? "" : "s"}, oldest first.`}>
          The conversation
        </SectionTitle>
        {messages.length === 0 ? (
          <EmptyState
            title="No messages recorded"
            hint="The lead exists but nothing was captured against it — worth checking the mailbox directly."
          />
        ) : (
          <ol className="space-y-3">
            {messages.map((m) => {
              const inbound = m.direction === "inbound";
              const shown = messageToDisplayText(m.body);
              const original = originalForDisplay(m.body);
              return (
                <li
                  key={m.id}
                  className={
                    "min-w-0 rounded-xl border p-3 sm:p-3.5 " +
                    (inbound ? "border-slate-200 bg-white" : "border-blue-100 bg-blue-50/50")
                  }
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">
                      {inbound ? lead.name || "Them" : "Us"}
                    </span>
                    <span className="text-slate-400">{stamp(m.created_at)}</span>
                    <span className="text-slate-400">{channelLabel(m.channel)}</span>
                    {/*
                      Worth stating plainly rather than implying. Most outbound
                      here was written by the setter, and someone reading a
                      thread to decide whether to step in needs to know which
                      sentences a person chose.
                    */}
                    {!inbound && m.ai_generated && <Badge tone="violet">written by the setter</Badge>}
                    {m.status && m.status !== "sent" && <Badge tone="amber">{m.status}</Badge>}
                  </div>
                  {/*
                    Many inbound emails were stored as their HTML part, quoted
                    history and all. Shown cleaned; the stored body is untouched
                    and one click away.
                  */}
                  <MessageBody
                    text={shown.text}
                    hadQuote={shown.hadQuote}
                    original={shown.hadQuote || looksLikeHtml(original) ? original : undefined}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </AdminPage>
  );
}
