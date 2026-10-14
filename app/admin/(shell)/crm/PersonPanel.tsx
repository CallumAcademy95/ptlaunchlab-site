import Link from "next/link";
import { Phone, Mail, MessageCircle, ExternalLink } from "lucide-react";
import { INTENT_LABEL } from "@/app/lib/leads";
import { QUESTIONS } from "@/app/lib/careerPlannerV2";
import { messageToDisplayText, originalForDisplay, looksLikeHtml } from "@/app/lib/message-display";
import { parseMedia, mediaViews } from "@/app/lib/message-media";
import { Card, SectionTitle, Badge, EmptyState, Notice, DefRow, type BadgeTone } from "../ui/praxel";
import { loadPersonDetail, type Activity } from "./data";
import {
  AUTHOR_LABEL,
  BAND_LABEL,
  MODE_LABEL,
  channelLabel,
  gmailUrl,
  latestThreadId,
  messageAuthor,
  modeOf,
  isManualTakeover,
  isHandling,
  waNumber,
  waitingMinutes,
  waitBand,
  WAIT_DOT,
  formatWait,
  replyChannels,
  defaultReplyChannel,
  lastInboundOn,
  willUseTemplate,
  whatsappLastMessageAt,
  type Author,
  type CrmMode,
  type CrmPerson,
} from "./crm";
import { ModeControls, ModeChip } from "./ModeControls";
import { QualifiedToggle } from "./ClientBits";
import { ReplyBox } from "./ReplyBox";
import { MessageBody } from "./MessageBody";
import { MessageMedia } from "./MessageMedia";

// One person: who they are, who is in charge of the conversation, what was
// said, and what we know about them.
//
// Shared by the desktop drawer (/admin/crm?open=<id>) and the phone page
// (/admin/crm/<id>). It reads everything itself, so both routes stay thin.

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

/** Server-side request time, outside the component so render stays pure. */
function requestTime(): number {
  return Date.now();
}

const BAND_TONE: Record<string, BadgeTone> = { prime: "green", strong: "blue", nurture: "neutral" };

const AUTHOR_SKIN: Record<Author, string> = {
  lead: "border-slate-200 bg-white",
  ai: "border-blue-100 bg-blue-50/50",
  template: "border-slate-200 bg-slate-50",
  human: "border-amber-200 bg-amber-50/60",
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

function plannerRows(profile: unknown): { k: string; v: string }[] {
  const planner = profile && typeof profile === "object" ? (profile as Record<string, unknown>).planner : null;
  const answers = planner && typeof planner === "object" ? (planner as Record<string, unknown>).answers : null;
  if (!answers || typeof answers !== "object") return [];
  const a = answers as Record<string, unknown>;
  const rows: { k: string; v: string }[] = [];
  for (const [key, q] of Object.entries(QUESTIONS)) {
    const val = str(a[key]);
    if (!val) continue;
    const label = (q.options as readonly (readonly [string, string])[]).find(([v]) => v === val)?.[1] ?? val;
    rows.push({ k: q.title, v: label });
    if (key === "blocker" && str(a.blockerNote)) rows.push({ k: "In their words", v: String(a.blockerNote) });
  }
  const where = [str(a.town), str(a.region)].filter(Boolean).join(", ");
  if (where) rows.push({ k: "Where", v: where });
  return rows;
}

function activityText(a: Activity): string {
  const d = (a.detail && typeof a.detail === "object" ? a.detail : {}) as Record<string, unknown>;
  if (a.action === "mode_changed") {
    const from = modeOf(str(d.from));
    const to = modeOf(str(d.to));
    const arrow = `${from ? MODE_LABEL[from] : (str(d.from) ?? "?")} → ${to ? MODE_LABEL[to] : (str(d.to) ?? "?")}`;
    return str(d.dnc_reason) ? `${arrow} (${d.dnc_reason})` : arrow;
  }
  if (a.action === "qualified_set") return d.already_qualified ? "Marked as a qualified PT" : "Unmarked as a qualified PT";
  if (a.action === "owner_message_sent" || a.action === "owner_message_failed") {
    const how = `${channelLabel(str(d.channel))}${d.template === true || str(d.template) ? " template" : ""}`;
    return a.action === "owner_message_sent"
      ? `Sent a ${how} message`
      : `${how} message failed${str(d.error) ? `: ${d.error}` : ""}`;
  }
  return a.action.replace(/_/g, " ");
}

function PersonBadges({ p }: { p: CrmPerson }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {p.planner_band && <Badge tone={BAND_TONE[p.planner_band]}>{BAND_LABEL[p.planner_band]}</Badge>}
      {p.already_qualified && <Badge tone="violet">Qualified PT</Badge>}
      {p.setter_profile_id && <Badge tone="orange">Gym owner</Badge>}
      {p.utm_content && <Badge tone="neutral">Ad: {p.utm_content}</Badge>}
      {p.kind === "site_only" ? <Badge tone="neutral">Website enquiry</Badge> : <ModeChip status={p.setter_status} />}
      {p.unsubscribed && <Badge tone="neutral">unsubscribed</Badge>}
    </div>
  );
}

const ACTION_BTN =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold shadow-sm sm:flex-none md:min-h-9";

export async function PersonPanel({ id }: { id: string }) {
  const detail = await loadPersonDetail(id);

  if (!detail) {
    return <EmptyState title="Nobody with that id" hint="They may have been removed, or the link is wrong." />;
  }
  if ("problem" in detail) {
    return (
      <Notice tone="rose" title="Could not read this person">
        {detail.problem}
      </Notice>
    );
  }

  const { person: p, consultation, siteLead, messages, identities, whatsappIdentityTimes, messageTotal, activities, activityTotal, signed, problems } = detail;
  const profile = consultation?.ai_profile;
  const planner = plannerRows(profile);
  const threadId = latestThreadId(messages);
  const gmail = gmailUrl(p.email, threadId);
  const wa = waNumber(p.phone);
  const now = requestTime();
  const mins = waitingMinutes(p, now);
  const channels = replyChannels(p, identities);
  const waLast = whatsappLastMessageAt(lastInboundOn(messages, "whatsapp"), whatsappIdentityTimes);
  const summary = str(consultation?.ai_summary);
  const pausedReason = str(consultation?.setter_paused_reason);
  const modeChangedAt = str(consultation?.mode_changed_at);
  const modeChangedBy = str(consultation?.mode_changed_by);
  const mode: CrmMode | null = modeOf(p.setter_status);
  const intentLabel = (i: string | null) => (i ? ((INTENT_LABEL as Record<string, string>)[i] ?? i) : "—");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 [overflow-wrap:anywhere] sm:text-2xl">
          {p.name || p.email || "Unnamed"}
        </h2>
        <div className="mt-2">
          <PersonBadges p={p} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {p.phone && (
            <a href={`tel:${p.phone}`} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-blue-700 hover:underline">
              <Phone className="h-4 w-4" /> {p.phone}
            </a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className="inline-flex min-h-9 min-w-0 items-center gap-1.5 text-slate-700 hover:underline [overflow-wrap:anywhere]">
              <Mail className="h-4 w-4 shrink-0" /> {p.email}
            </a>
          )}
        </div>
        {isHandling(p) && (
          <p className="mt-1 text-sm font-medium text-amber-800">
            👤 You&apos;re handling this. They wrote last; your own replies aren&apos;t recorded here.
          </p>
        )}
        {mins !== null && (
          <p className="mt-1 text-sm font-medium text-amber-800">
            {WAIT_DOT[waitBand(mins)]} Waiting on us for {formatWait(mins)}
          </p>
        )}
      </div>

      {problems.length > 0 && (
        <Notice tone="amber" title="Some of this record could not be read">
          {problems.join(" · ")}
        </Notice>
      )}

      {/* Control bar */}
      <Card className="space-y-3 p-4">
        {p.kind === "person" && p.setter_status && mode ? (
          <ModeControls id={p.id} setterStatus={p.setter_status} unsubscribed={p.unsubscribed} />
        ) : (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">No conversation yet.</span> This is a website enquiry the setter
            has not picked up, so there is nothing to hand over or stop.
          </p>
        )}
        {p.dnc_reason && mode === "dnc" && <p className="text-sm text-rose-800">Do not contact: {p.dnc_reason}</p>}
        {pausedReason &&
          (isManualTakeover(pausedReason) ? (
            mode === "human" && <p className="text-sm text-slate-600">You took over. The setter stays silent until you hand back.</p>
          ) : (
            <p className="text-sm text-slate-600">The setter paused itself: {pausedReason}</p>
          ))}
        {modeChangedAt && (
          <p className="text-xs text-slate-500">
            Mode last changed {stamp(modeChangedAt)}
            {modeChangedBy ? ` by ${modeChangedBy}` : ""}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {gmail && (
            <a href={gmail} target="_blank" rel="noreferrer" className={`${ACTION_BTN} border border-slate-300 bg-white text-slate-800`}>
              <Mail className="h-4 w-4" /> Reply in Gmail
            </a>
          )}
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className={`${ACTION_BTN} bg-green-600 text-white`}>
              <MessageCircle className="h-4 w-4" /> Reply on WhatsApp
            </a>
          )}
        </div>
        {mode && mode !== "human" && (gmail || wa) && (
          <p className="text-xs text-slate-500">
            Replying from Gmail or WhatsApp yourself? Take over first, or the setter may answer too.
          </p>
        )}
      </Card>

      {/* Conversation */}
      {p.kind === "person" && (
        <Card className="p-4">
          <SectionTitle
            hint={
              messageTotal > messages.length
                ? `Showing the latest ${messages.length} of ${messageTotal} messages, all channels, oldest first.`
                : `${messages.length} message${messages.length === 1 ? "" : "s"}, all channels, oldest first.`
            }
          >
            Conversation
          </SectionTitle>
          {messages.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No messages recorded" />
            </div>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {messages.map((m) => {
                const author = messageAuthor(m);
                const shown = messageToDisplayText(m.body);
                const original = originalForDisplay(m.body);
                const views = mediaViews(parseMedia(m.media), signed, p.id);
                return (
                  <li key={m.id} className={`min-w-0 rounded-xl border p-3 ${AUTHOR_SKIN[author]}`}>
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-semibold text-slate-800">{AUTHOR_LABEL[author]}</span>
                      <span className="text-slate-400">{stamp(m.created_at)}</span>
                      <span className="text-slate-400">{channelLabel(m.channel)}</span>
                      {m.status && m.status !== "sent" && m.status !== "received" && <Badge tone="amber">{m.status}</Badge>}
                    </div>
                    <MessageBody
                      text={shown.text}
                      hadQuote={shown.hadQuote}
                      original={shown.hadQuote || looksLikeHtml(original) ? original : undefined}
                      hasMedia={views.length > 0}
                    />
                    <MessageMedia views={views} />
                  </li>
                );
              })}
            </ol>
          )}
          {p.setter_status && mode && (
            <ReplyBox
              key={p.id}
              consultationId={p.id}
              setterStatus={p.setter_status}
              unsubscribed={p.unsubscribed}
              channels={channels}
              defaultChannel={defaultReplyChannel(channels, p.primary_channel)}
              lastWhatsAppInbound={waLast.at}
              windowExact={waLast.exact}
              templateAtRender={willUseTemplate("whatsapp", waLast.at, now)}
            />
          )}
        </Card>
      )}

      {/* Details */}
      <Card className="p-4">
        <SectionTitle>Details</SectionTitle>
        {p.kind === "person" && (
          <div className="mt-3 border-b border-slate-100 pb-3">
            <QualifiedToggle key={String(p.already_qualified)} id={p.id} value={p.already_qualified} />
          </div>
        )}
        {summary && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">The setter&apos;s summary</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{summary}</p>
          </div>
        )}
        <dl className="mt-2">
          {p.kind === "person" && <DefRow k="Channel" v={channelLabel(p.primary_channel)} />}
          {p.setter_stage && <DefRow k="Stage" v={p.setter_stage} />}
          {p.setter_intent !== null && <DefRow k="Intent" v={`${p.setter_intent}/100`} />}
          <DefRow k="Source" v={p.utm_source ?? "—"} />
          <DefRow k="Campaign" v={p.utm_campaign ?? "—"} />
          <DefRow k="Ad" v={p.utm_content ?? "—"} />
          <DefRow k="First seen" v={stamp(p.created_at)} />
        </dl>

        {planner.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Career planner answers</p>
            <dl className="mt-1">
              {planner.map((r) => (
                <DefRow key={r.k} k={r.k} v={r.v} />
              ))}
            </dl>
          </div>
        )}
      </Card>

      {(siteLead || p.site_lead_id) && (
        <Card className="p-4">
          <SectionTitle hint={p.site_lead_count > 1 ? `${p.site_lead_count} website enquiries match; the newest is shown.` : undefined}>
            Website enquiry
          </SectionTitle>
          {siteLead && str(siteLead.question) && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 [overflow-wrap:anywhere]">{String(siteLead.question)}</p>
          )}
          <dl className="mt-2">
            <DefRow k="Intent" v={intentLabel(str(siteLead?.intent) ?? p.site_intent)} />
            <DefRow k="Page" v={str(siteLead?.page_path) ?? p.site_page_path ?? "—"} />
            <DefRow k="Gym" v={str(siteLead?.gym_slug) ?? p.site_gym_slug ?? "—"} />
            {siteLead && str(siteLead.created_at) && <DefRow k="Sent" v={stamp(String(siteLead.created_at))} />}
          </dl>
          {(str(siteLead?.id) ?? p.site_lead_id) && (
            <Link
              href={`/admin/site-leads/${str(siteLead?.id) ?? p.site_lead_id}`}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
            >
              Open the enquiry <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </Card>
      )}

      <Card className="p-4">
        <SectionTitle
          hint={
            activityTotal > activities.length
              ? `Changes made in the CRM, newest first: the latest ${activities.length} of ${activityTotal}.`
              : "Changes made in the CRM, newest first."
          }
        >
          Activity
        </SectionTitle>
        {activities.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing yet.</p>
        ) : (
          <ol className="mt-2 divide-y divide-slate-100">
            {activities.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2 text-sm">
                <span className="min-w-0 text-slate-800 [overflow-wrap:anywhere]">{activityText(a)}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {stamp(a.created_at)}
                  {a.actor ? ` · ${a.actor}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
