import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Clock, Bot, UserRound, Flame, GraduationCap, RefreshCw, Sparkles, X, Search } from "lucide-react";
import {
  AdminPage,
  PageHeader,
  Card,
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
  type BadgeTone,
} from "../ui/praxel";
import { slotLabel } from "@/app/lib/booking/london";
import { loadPeople, loadSavedViews, upcomingCallsByConsultation } from "./data";
import {
  parseCrmQuery,
  serialiseCrmQuery,
  crmHref,
  filterPeople,
  tileCounts,
  isUuid,
  isWaiting,
  isHandling,
  waitingMinutes,
  waitBand,
  WAIT_DOT,
  formatWait,
  lastActivity,
  channelLabel,
  BAND_LABEL,
  CHANNEL_LABEL,
  MODE_LABEL,
  WAIT_LABEL,
  BUILT_IN_VIEWS,
  MODE_FILTERS,
  BAND_FILTERS,
  CHANNEL_FILTERS,
  WAIT_FILTERS,
  type CrmPerson,
} from "./crm";
import { ModeChip } from "./ModeControls";
import { SaveViewForm, CustomViewChip } from "./ClientBits";
import { PersonPanel } from "./PersonPanel";

// The CRM: everyone who has enquired or is talking to the setter, one row per
// person, with the filters in the URL so any view can be linked or saved.
//
// Rows come from the crm_people view (one per consultation, plus website
// enquiries with no conversation). If the view is missing, conversations are
// read straight from consultations and a Notice says what is missing.

export const metadata: Metadata = {
  title: "CRM — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ACTOR = "callum";

const BAND_TONE: Record<string, BadgeTone> = { prime: "green", strong: "blue", nurture: "neutral" };

const when = (ms: number) =>
  ms
    ? new Date(ms).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

/** Server-side request time, outside the component so render stays pure. */
function requestTime(): number {
  return Date.now();
}

function intentText(p: CrmPerson): string | null {
  if (p.setter_intent !== null) return `intent ${p.setter_intent}`;
  return null;
}

function CallPill({ call }: { call: { start_at: string } | undefined }) {
  if (!call) return null;
  return <Badge tone="blue">Call {slotLabel(Date.parse(call.start_at))}</Badge>;
}

function BandChips({ p }: { p: CrmPerson }) {
  return (
    <>
      {p.planner_band && <Badge tone={BAND_TONE[p.planner_band]}>{BAND_LABEL[p.planner_band]}</Badge>}
      {p.already_qualified && <Badge tone="violet">Qualified PT</Badge>}
      {p.reactivated && <Badge tone="amber">Reactivated</Badge>}
      {p.setter_profile_id && <Badge tone="orange">Gym owner</Badge>}
    </>
  );
}

function Mode({ p }: { p: CrmPerson }) {
  return p.kind === "site_only" ? <Badge tone="neutral">Website enquiry</Badge> : <ModeChip status={p.setter_status} />;
}

function Wait({ p, now }: { p: CrmPerson; now: number }) {
  if (isHandling(p)) {
    return (
      <span className="whitespace-nowrap text-xs font-semibold text-amber-800" title="Human mode: you reply outside the CRM">
        👤 You&apos;re handling
      </span>
    );
  }
  const m = waitingMinutes(p, now);
  if (m === null) return null;
  return (
    <span className="whitespace-nowrap text-xs font-semibold text-slate-800" title="Waiting on us">
      {WAIT_DOT[waitBand(m)]} {formatWait(m)}
    </span>
  );
}

function source(p: CrmPerson): string | null {
  return [p.utm_source, p.utm_content].filter(Boolean).join(" · ") || null;
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseCrmQuery(params);
  const openRaw = Array.isArray(params.open) ? params.open[0] : params.open;
  const openId = isUuid(openRaw) ? openRaw : null;
  const canonical = serialiseCrmQuery(query);

  const [{ people, problem, fallback, incomplete }, saved, calls] = await Promise.all([loadPeople(), loadSavedViews(ACTOR), upcomingCallsByConsultation()]);
  const now = requestTime();
  const rows = filterPeople(people, query, now);
  const tiles = tileCounts(people, now);

  const sources = [...new Set(people.map((p) => p.utm_source).filter((s): s is string => !!s))].sort();
  const ads = [...new Set(people.map((p) => p.utm_content).filter((s): s is string => !!s))].sort();

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href + label}
      href={href}
      className={
        "inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition " +
        (active ? "border-blue-600 bg-blue-700 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300")
      }
    >
      {label}
    </Link>
  );

  const rowHref = (p: CrmPerson) => crmHref(query, { open: p.id });
  const closeHref = crmHref(query);
  const filtersOn = canonical !== "";

  return (
    <AdminPage>
      <PageHeader
        title="CRM"
        subtitle="Everyone who has enquired or is talking to the setter, one row per person."
      />

      {problem && (
        <Notice tone="amber" title={fallback ? "Showing conversations only" : "Could not read the CRM"}>
          {fallback
            ? "The crm_people view isn't available yet, so this list is read from conversations directly. Website enquiries with no conversation are missing until it is. "
            : ""}
          <span className="text-xs opacity-80">({problem})</span>
        </Notice>
      )}

      {incomplete && (
        <Notice tone="amber" title="List may be incomplete">
          {incomplete}
        </Notice>
      )}

      {/* Headline tiles: each one is a filter. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        <StatTile href={crmHref({ view: "new" })} icon={<Sparkles className="h-5 w-5" />} value={tiles.newToday} label="New today" tone="sky" />
        <StatTile
          href={crmHref({ view: "waiting" })}
          icon={<Clock className="h-5 w-5" />}
          value={tiles.waiting}
          label="Waiting on us"
          sublabel={tiles.oldestWaitMinutes !== null ? `oldest ${formatWait(tiles.oldestWaitMinutes)}` : undefined}
          tone={tiles.waiting ? "amber" : "slate"}
        />
        <StatTile href={crmHref({ mode: "ai" })} icon={<Bot className="h-5 w-5" />} value={tiles.aiActive} label="AI active" tone="blue" />
        <StatTile href={crmHref({ mode: "human" })} icon={<UserRound className="h-5 w-5" />} value={tiles.human} label="Human" tone={tiles.human ? "rose" : "slate"} />
        <StatTile href={crmHref({ view: "prime7d" })} icon={<Flame className="h-5 w-5" />} value={tiles.hot7d} label="Prime/Strong (7d)" tone="green" />
        <StatTile href={crmHref({ band: "qualified" })} icon={<GraduationCap className="h-5 w-5" />} value={tiles.qualified} label="Qualified PTs" tone="violet" />
        <StatTile href={crmHref({ band: "reactivated" })} icon={<RefreshCw className="h-5 w-5" />} value={tiles.reactivated} label="Reactivated" tone="amber" />
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        {/* Saved views: one scrolling row on a phone. */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {chip("/admin/crm", "Everyone", !filtersOn)}
          {BUILT_IN_VIEWS.map((v) => chip(crmHref(v.query), v.name, serialiseCrmQuery(v.query) === canonical))}
          {saved.views.map((v) => (
            <CustomViewChip key={v.id} id={v.id} name={v.name} href={v.query ? `/admin/crm?${v.query}` : "/admin/crm"} active={v.query === canonical} />
          ))}
          <SaveViewForm query={canonical} />
        </div>
        {saved.incomplete && <p className="text-xs text-amber-700">Saved views: {saved.incomplete}</p>}
        {saved.problem && <p className="text-xs text-slate-500">Custom views aren&apos;t available yet ({saved.problem}).</p>}

        {/* Search + filters: a plain GET form, so it works without JavaScript and the URL is the state. */}
        <form method="get" action="/admin/crm" className="space-y-3">
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search name, email or phone</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Search name, email or phone"
                className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-8 pr-2 text-sm"
              />
            </label>
            <button type="submit" className="h-10 shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
              Go
            </button>
          </div>
          {query.view && <input type="hidden" name="view" value={query.view} />}
          <details className="group" open={Boolean(query.mode || query.band || query.channel || query.source || query.ad || query.wait || query.from || query.to)}>
            <summary className="inline-flex min-h-9 cursor-pointer items-center text-sm font-semibold text-slate-700">Filters</summary>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <Select name="mode" label="Mode" value={query.mode} options={MODE_FILTERS.map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
              <Select name="band" label="Band" value={query.band} options={BAND_FILTERS.map((b) => ({ value: b, label: BAND_LABEL[b] }))} />
              <Select name="channel" label="Channel" value={query.channel} options={CHANNEL_FILTERS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))} />
              <Select name="wait" label="Waiting" value={query.wait} options={WAIT_FILTERS.map((w) => ({ value: w, label: WAIT_LABEL[w] }))} />
              <Select name="source" label="Source" value={query.source} options={sources.map((s) => ({ value: s, label: s }))} />
              <Select name="ad" label="Ad" value={query.ad} options={ads.map((s) => ({ value: s, label: s }))} />
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-500">
                From
                <input type="date" name="from" defaultValue={query.from ?? ""} className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800" />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-500">
                To
                <input type="date" name="to" defaultValue={query.to ?? ""} className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800" />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
                Apply
              </button>
            </div>
          </details>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>
            {rows.length} of {people.length} {people.length === 1 ? "person" : "people"}
          </span>
          {filtersOn && (
            <Link href="/admin/crm" className="inline-flex min-h-9 items-center gap-1 font-semibold text-blue-700 hover:underline">
              <X className="h-3.5 w-3.5" /> Clear filters
            </Link>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState title={people.length ? "Nobody matches" : "Nobody here yet"} hint={people.length ? "Try clearing a filter." : undefined} />
        ) : (
          <>
            {/* Phone: cards, each opening the full-screen page. */}
            <ul className="space-y-2.5 md:hidden">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/crm/${p.id}`}
                    className={
                      "block rounded-xl border bg-white p-3.5 shadow-sm transition active:bg-slate-50 " +
                      (isWaiting(p) ? "border-amber-300" : "border-slate-200")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-slate-900">{p.name || p.email || "Unnamed"}</p>
                        {p.name && p.email && <p className="truncate text-xs text-slate-500">{p.email}</p>}
                      </div>
                      <Wait p={p} now={now} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Mode p={p} />
                      <BandChips p={p} />
                      <CallPill call={calls.get(p.id)} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>{p.kind === "site_only" ? "Website" : channelLabel(p.primary_channel)}</span>
                      <span>{when(lastActivity(p))}</span>
                      {intentText(p) && <span>{intentText(p)}</span>}
                      {source(p) && <span className="min-w-0 truncate">{source(p)}</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: a table; clicking a row opens the drawer and keeps the filters. */}
            <TableWrap className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Who</th>
                    <th className={TH}>Band</th>
                    <th className={TH}>Mode</th>
                    <th className={TH}>Source / ad</th>
                    <th className={TH}>Last activity</th>
                    <th className={TH}>Waiting</th>
                    <th className={TH}>Channel</th>
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {rows.map((p) => (
                    <tr key={p.id} className={`${TR} ${p.id === openId ? "bg-blue-50/60" : ""}`}>
                      <td className={TD}>
                        <Link
                          href={rowHref(p)}
                          scroll={false}
                          className="font-semibold text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline"
                        >
                          {p.name || p.email || "Unnamed"}
                        </Link>
                        {p.name && p.email && <div className="max-w-[16rem] truncate text-xs text-slate-500">{p.email}</div>}
                        <CallPill call={calls.get(p.id)} />
                      </td>
                      <td className={TD}>
                        <div className="flex flex-wrap gap-1">
                          <BandChips p={p} />
                        </div>
                        {intentText(p) && <div className="mt-0.5 text-xs text-slate-500">{intentText(p)}</div>}
                      </td>
                      <td className={TD}>
                        <Mode p={p} />
                      </td>
                      <td className={`${TD} max-w-[12rem] truncate text-xs text-slate-600`}>{source(p) ?? "—"}</td>
                      <td className={`${TD} whitespace-nowrap text-xs text-slate-600`}>{when(lastActivity(p))}</td>
                      <td className={TD}>
                        <Wait p={p} now={now} />
                      </td>
                      <td className={`${TD} text-xs text-slate-600`}>{p.kind === "site_only" ? "Website" : channelLabel(p.primary_channel)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </>
        )}

        <p className="text-xs text-slate-500">
          Test and spam enquiries are left out.{" "}
          <Link href="/admin/site-leads?all=1" className="font-semibold text-blue-700 hover:underline">
            Check them
          </Link>
        </p>
      </Card>

      {openId && <Drawer id={openId} closeHref={closeHref} />}
    </AdminPage>
  );
}

/**
 * The side panel. A right-hand drawer on desktop; full screen on a phone, so a
 * pushed /admin/crm?open=<id> link still opens the person there too.
 */
function Drawer({ id, closeHref }: { id: string; closeHref: string }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <Link href={closeHref} scroll={false} aria-label="Close panel" className="absolute inset-0 hidden bg-slate-900/30 md:block" />
      <aside
        aria-label="Person"
        className="relative flex h-full w-full flex-col bg-[#f6f8fb] shadow-2xl md:max-w-2xl md:border-l md:border-slate-200"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <Link href={`/admin/crm/${id}`} className="inline-flex min-h-9 items-center text-xs font-semibold text-slate-500 hover:text-slate-800">
            Open full page
          </Link>
          <Link
            href={closeHref}
            scroll={false}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:h-9 md:w-9"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <PersonPanel id={id} />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}

