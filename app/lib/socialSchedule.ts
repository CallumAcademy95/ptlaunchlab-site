// What's going out on socials: the shape the admin Social calendar renders.
//
// Two sources feed it. Carousels are rows in `social_posts`, which the pt-app
// publisher cron posts to Instagram and the Facebook Page. Reels are OpusClip
// "post tasks", one per platform per clip, which OpusClip publishes itself.
// This file turns both into one list of SocialItem and works out how many days
// of content each stream has left, the same "runway" the daily reminder email
// reports.
//
// Pure: no env, no fetch, no `@/` imports, so node --test can load it.

export type ItemStatus = "scheduled" | "held" | "publishing" | "published" | "failed" | "cancelled";

export interface PlatformState {
  name: "Instagram" | "Facebook" | "TikTok";
  status: ItemStatus;
  url?: string;
}

export interface SocialItem {
  key: string;
  at: string; // ISO
  kind: "reel" | "carousel";
  stream: string; // "opus" or the carousel series
  title: string;
  status: ItemStatus;
  platforms: PlatformState[];
  image?: string;
  caption?: string;
  error?: string;
}

export const STREAM_LABEL: Record<string, string> = {
  opus: "Opus reels",
  "objections-50": "Objection carousels",
  "ptll-podcast-50": "Podcast carousels",
};
export const streamLabel = (s: string) => {
  const batch = s.match(/-b(\d+)$/)?.[1];
  const base = STREAM_LABEL[s.replace(/-b\d+$/, "")];
  if (base) return batch ? `${base} (batch ${batch})` : base;
  return `Carousels: ${s}`;
};

/** A stream with this many days or fewer left gets flagged, as in the reminder email. */
export const RUNWAY_WARN_DAYS = 7;

// ── Carousels ────────────────────────────────────────────────────────────────

export interface CarouselRow {
  id: string;
  series: string;
  post_no: number;
  title: string;
  caption: string | null;
  image_urls: string[] | null;
  platforms: string[] | null;
  scheduled_at: string;
  status: string;
  ig_media_id: string | null;
  fb_post_id: string | null;
  last_error: string | null;
}

const asStatus = (s: string): ItemStatus =>
  (["scheduled", "held", "publishing", "published", "failed", "cancelled"] as const).includes(s as ItemStatus)
    ? (s as ItemStatus)
    : "scheduled";

export function carouselItem(r: CarouselRow): SocialItem {
  const status = asStatus(r.status);
  const wants = r.platforms?.length ? r.platforms : ["instagram", "facebook"];
  const platforms: PlatformState[] = [];
  // Each platform's id is written as soon as that platform publishes, so a row can
  // be half done: Instagram live, Facebook still to go.
  if (wants.includes("instagram")) {
    platforms.push({
      name: "Instagram",
      status: r.ig_media_id ? "published" : status === "published" ? "published" : status,
      url: r.ig_media_id ? "https://www.instagram.com/pt_launch_lab/" : undefined,
    });
  }
  if (wants.includes("facebook")) {
    platforms.push({
      name: "Facebook",
      status: r.fb_post_id ? "published" : status === "published" ? "published" : status,
      url: r.fb_post_id ? `https://www.facebook.com/${r.fb_post_id}` : undefined,
    });
  }
  return {
    key: `c:${r.id}`,
    at: r.scheduled_at,
    kind: "carousel",
    stream: r.series,
    title: `#${r.post_no} ${r.title}`,
    status,
    platforms,
    image: r.image_urls?.[0],
    caption: r.caption ?? undefined,
    error: r.last_error ?? undefined,
  };
}

// ── Opus reels ───────────────────────────────────────────────────────────────

export interface OpusTask {
  clipId: string;
  projectId?: string;
  platform: string;
  status: string;
  publishAt: string;
  errorMessage?: string | null;
  extVideoLink?: string | null;
  subAccountId?: string | null;
  postDetail?: { title?: string; custom?: { description?: string } } | null;
}

const OPUS_PLATFORM: Record<string, PlatformState["name"]> = {
  TIKTOK_BUSINESS: "TikTok",
  INSTAGRAM_BUSINESS: "Instagram",
  FACEBOOK_PAGE: "Facebook",
};

// The OpusClip account also holds Ultimate Shred's YouTube and the Shred Lifestyle
// Facebook Page (same connection as ours, told apart by subAccountId). Only PTLL's
// own accounts belong on this calendar.
export const PTLL_FB_PAGE = "798389646699303";
export const PTLL_IG_ACCOUNT = "17841404060542559";
export function isPtllOpusTask(t: Pick<OpusTask, "platform" | "subAccountId">): boolean {
  if (t.platform === "FACEBOOK_PAGE") return !t.subAccountId || t.subAccountId === PTLL_FB_PAGE;
  if (t.platform === "INSTAGRAM_BUSINESS") return !t.subAccountId || t.subAccountId === PTLL_IG_ACCOUNT;
  return t.platform === "TIKTOK_BUSINESS";
}

function opusStatus(s: string): ItemStatus {
  if (s === "posted") return "published";
  if (s === "scheduled") return "scheduled";
  if (s === "failed" || s === "error") return "failed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return "publishing";
}

/** The worst state across a clip's platforms wins, so one failed platform is never hidden. */
function combine(states: ItemStatus[]): ItemStatus {
  for (const s of ["failed", "publishing", "scheduled", "held", "published", "cancelled"] as const) {
    if (states.includes(s)) return s;
  }
  return "scheduled";
}

/** One SocialItem per clip per time slot, with a line per platform. */
export function groupOpusTasks(tasks: OpusTask[]): SocialItem[] {
  const groups = new Map<string, OpusTask[]>();
  for (const t of tasks) {
    if (!isPtllOpusTask(t)) continue;
    const k = `${t.publishAt}|${t.clipId}`;
    const g = groups.get(k);
    if (g) g.push(t);
    else groups.set(k, [t]);
  }
  const items: SocialItem[] = [];
  for (const [k, g] of groups) {
    const caption = g.find((t) => t.postDetail?.custom?.description)?.postDetail?.custom?.description;
    const firstLine = (caption ?? g[0].postDetail?.title ?? "Reel").split("\n")[0].replace(/^"|"$/g, "");
    const platforms = g
      .map((t): PlatformState => ({
        name: OPUS_PLATFORM[t.platform],
        status: opusStatus(t.status),
        url: t.extVideoLink ?? undefined,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const live = platforms.filter((p) => p.status !== "cancelled");
    items.push({
      key: `o:${k}`,
      at: g[0].publishAt,
      kind: "reel",
      stream: "opus",
      title: firstLine,
      status: combine((live.length ? live : platforms).map((p) => p.status)),
      platforms,
      caption,
      error: g.map((t) => t.errorMessage).filter(Boolean).join(" · ") || undefined,
    });
  }
  return items;
}

// ── Dates (Europe/London) ────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

/** "2026-10-27" for an instant, in UK time. */
export function londonDay(iso: string | number | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(iso));
}

/** "13:00" for an instant, in UK time. */
export function londonTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date(iso));
}

/**
 * The seven UK dates (Mon..Sun) of the week `offset` weeks from the one containing
 * `now`, plus a UTC window that safely covers them (a day of slack each side, so a
 * BST/GMT change never drops a post off the edge; items are filtered by day after).
 */
export function weekDays(now: number, offset: number): { days: string[]; from: string; to: string } {
  const today = londonDay(now);
  // Noon UTC on today's UK date is always that same date in London.
  const noon = Date.parse(`${today}T12:00:00Z`);
  const dow = (new Date(noon).getUTCDay() + 6) % 7; // Monday = 0
  const monday = noon - dow * DAY_MS + offset * 7 * DAY_MS;
  const days = Array.from({ length: 7 }, (_, i) => londonDay(monday + i * DAY_MS));
  return {
    days,
    from: new Date(monday - 1.5 * DAY_MS).toISOString(),
    to: new Date(monday + 7.5 * DAY_MS).toISOString(),
  };
}

// ── Runway ───────────────────────────────────────────────────────────────────

export interface Runway {
  stream: string;
  label: string;
  end: string | null;
  daysLeft: number; // -1 = nothing left
  warn: boolean;
}

export function runway(stream: string, end: string | null, now: number): Runway {
  const daysLeft = end ? Math.floor((Date.parse(end) - now) / DAY_MS) : -1;
  return { stream, label: streamLabel(stream), end, daysLeft, warn: daysLeft <= RUNWAY_WARN_DAYS };
}

/** "objections-50-b2" continues "objections-50": one stream, one runway. */
export const streamOf = (series: string) => series.replace(/-b\d+$/, "");

/**
 * Last still-to-post time per carousel stream. Follow-on batches fold into their
 * stream, so batch 1 ending isn't flagged as running out while batch 2 is queued.
 */
export function carouselEnds(rows: { series: string; scheduled_at: string }[]): Record<string, string> {
  const ends: Record<string, string> = {};
  for (const r of rows) {
    const s = streamOf(r.series);
    if (!ends[s] || r.scheduled_at > ends[s]) ends[s] = r.scheduled_at;
  }
  return ends;
}

/** Last still-scheduled Opus post. */
export function opusEnd(tasks: OpusTask[]): string | null {
  let end: string | null = null;
  for (const t of tasks) if (isPtllOpusTask(t) && t.status === "scheduled" && (!end || t.publishAt > end)) end = t.publishAt;
  return end;
}
