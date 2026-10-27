import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clapperboard, GalleryHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  londonDay, londonTime, runway, weekDays, streamLabel,
  type ItemStatus, type SocialItem, type Runway,
} from "@/app/lib/socialSchedule";
import { readCarousels, readCarouselEnds, readReels, readReelsEnd } from "@/app/lib/socialScheduleData";
import { AdminPage, PageHeader, Card, Badge, Notice, StatTile, cn, type BadgeTone } from "../ui/praxel";

// Everything going out on Instagram, Facebook and TikTok, one week at a time.
//
// Read-only. Carousels come from social_posts (posted by the pt-app cron); reels
// come live from OpusClip. The tiles at the top are the same runway numbers the
// daily "PTLL content runway check" email uses, so the two can't disagree.

export const metadata: Metadata = {
  title: "Social calendar — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Server-side request time, outside the component so render stays pure. */
const requestNow = () => Date.now();

const STATUS: Record<ItemStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "blue" },
  held: { label: "Held", tone: "amber" },
  publishing: { label: "Posting", tone: "violet" },
  published: { label: "Posted", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const dayHeading = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

const endLabel = (r: Runway) =>
  r.end
    ? new Date(r.end).toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short" })
    : "nothing scheduled";

function RunwayTile({ r }: { r: Runway }) {
  return (
    <StatTile
      icon={r.stream === "opus" ? <Clapperboard className="h-5 w-5" /> : <GalleryHorizontal className="h-5 w-5" />}
      value={r.daysLeft < 0 ? "Run out" : `${r.daysLeft} days`}
      label={r.label}
      sublabel={`Last post ${endLabel(r)}`}
      tone={r.daysLeft < 0 ? "rose" : r.warn ? "amber" : "green"}
    />
  );
}

function ItemRow({ item }: { item: SocialItem }) {
  const s = STATUS[item.status];
  return (
    <li className="flex gap-3 py-2.5">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase storage, tiny thumb
        <img src={item.image} alt="" loading="lazy" className="h-16 w-[52px] shrink-0 rounded-md border border-slate-200 object-cover" />
      ) : (
        <span className="flex h-16 w-[52px] shrink-0 items-center justify-center rounded-md bg-slate-900 text-[#F5C518]">
          <Clapperboard className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-semibold tabular-nums text-slate-900">{londonTime(item.at)}</span>
          <span className="text-xs text-slate-500">{item.kind === "reel" ? "Reel" : streamLabel(item.stream)}</span>
          <Badge tone={s.tone}>{s.label}</Badge>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-700" title={item.caption}>
          {item.title}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {item.platforms.map((p) => {
            const mark = p.status === "published" ? "✓" : p.status === "failed" ? "✕" : "·";
            const text = `${mark} ${p.name}`;
            return p.url ? (
              <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{text}</a>
            ) : (
              <span key={p.name} className={p.status === "failed" ? "text-rose-600" : undefined}>{text}</span>
            );
          })}
        </p>
        {item.error && <p className="mt-1 text-xs text-rose-600 [overflow-wrap:anywhere]">{item.error}</p>}
      </div>
    </li>
  );
}

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const offset = Math.max(-8, Math.min(26, Number.parseInt((await searchParams).w ?? "0", 10) || 0));
  const now = requestNow();
  const { days, from, to } = weekDays(now, offset);

  const [carousels, reels, carouselEnds, reelsEnd] = await Promise.all([
    readCarousels(from, to),
    readReels(from, to),
    readCarouselEnds(),
    readReelsEnd(now),
  ]);

  const items = [...(carousels.ok ? carousels.data : []), ...(reels.ok ? reels.data : [])]
    .sort((a, b) => a.at.localeCompare(b.at));
  const byDay = new Map(days.map((d) => [d, [] as SocialItem[]]));
  for (const it of items) byDay.get(londonDay(it.at))?.push(it);

  const runways: Runway[] = [
    ...(reelsEnd.ok ? [runway("opus", reelsEnd.data, now)] : []),
    ...(carouselEnds.ok ? Object.entries(carouselEnds.data).map(([s, end]) => runway(s, end, now)) : []),
  ].sort((a, b) => a.daysLeft - b.daysLeft);

  const failed = items.filter((i) => i.status === "failed");
  const held = items.filter((i) => i.status === "held");
  const problems = [
    !carousels.ok && `Carousels: ${carousels.error}`,
    !carouselEnds.ok && `Carousel runway: ${carouselEnds.error}`,
    !reels.ok && `Opus reels: ${reels.error}`,
    !reelsEnd.ok && `Opus runway: ${reelsEnd.error}`,
  ].filter(Boolean) as string[];
  const today = londonDay(now);
  const weekLabel = offset === 0 ? "This week" : offset === 1 ? "Next week" : offset === -1 ? "Last week" : `Week of ${dayHeading(days[0])}`;

  return (
    <AdminPage>
      <PageHeader
        title="Social calendar"
        subtitle="Every reel and carousel going out on Instagram, Facebook and TikTok. Read-only; times are UK."
        badge={<Badge tone="neutral">{items.length} posts this week</Badge>}
      />

      {problems.length > 0 && (
        <Notice tone="rose" title="Part of the schedule couldn't be read">
          <ul className="list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          <p className="mt-1">What&rsquo;s shown below is incomplete, not empty.</p>
        </Notice>
      )}

      {runways.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {runways.map((r) => <RunwayTile key={r.stream} r={r} />)}
        </div>
      )}

      {(failed.length > 0 || held.length > 0) && (
        <Notice tone="amber" title="Needs a look this week">
          {failed.length > 0 && <p>{failed.length} failed: {failed.map((f) => f.title).join(" · ")}</p>}
          {held.length > 0 && <p>{held.length} held (won&rsquo;t post until released): {held.map((h) => h.title).join(" · ")}</p>}
        </Notice>
      )}

      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/social?w=${offset - 1}`} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600">
          <ChevronLeft className="h-4 w-4" /> Previous
        </Link>
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarDays className="h-4 w-4 text-slate-500" /> {weekLabel}
          {offset !== 0 && <Link href="/admin/social" className="text-xs font-medium text-blue-700">Back to today</Link>}
        </p>
        <Link href={`/admin/social?w=${offset + 1}`} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600">
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((d) => {
          const list = byDay.get(d) ?? [];
          return (
            <Card key={d} className={cn("p-4", d === today && "ring-2 ring-[#F5C518]")}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{dayHeading(d)}{d === today && " · today"}</h2>
                <span className="text-xs text-slate-500">{list.length} {list.length === 1 ? "post" : "posts"}</span>
              </div>
              {list.length ? (
                <ul className="mt-1 divide-y divide-slate-100">{list.map((it) => <ItemRow key={it.key} item={it} />)}</ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Nothing scheduled</p>
              )}
            </Card>
          );
        })}
      </div>
    </AdminPage>
  );
}
