// Server-only reads for the admin Social calendar. Pure shaping is in socialSchedule.ts.
//
// Carousels: `social_posts` in this site's own Supabase project (the pt-app
// publisher writes to it). Reels: the OpusClip API, with OPUS_CLIP_API set in Vercel.
// Each source fails on its own and reports why, so a broken Opus key shows as
// "couldn't read Opus" rather than as an empty week that looks like nothing is due.
import "server-only";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import {
  carouselEnds, carouselItem, groupOpusTasks, opusEnd,
  type CarouselRow, type OpusTask, type SocialItem,
} from "@/app/lib/socialSchedule";

const PAGE = 1000; // PostgREST's silent row cap: always page past it.
const DAY_MS = 86_400_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function readCarousels(from: string, to: string): Promise<Result<SocialItem[]>> {
  try {
    const db = getSupabaseAdmin();
    const rows: CarouselRow[] = [];
    for (let i = 0; ; i += PAGE) {
      const { data, error } = await db
        .from("social_posts")
        .select("id,series,post_no,title,caption,image_urls,platforms,scheduled_at,status,ig_media_id,fb_post_id,last_error")
        .gte("scheduled_at", from)
        .lt("scheduled_at", to)
        .order("scheduled_at")
        .range(i, i + PAGE - 1);
      if (error) return { ok: false, error: error.message };
      rows.push(...((data ?? []) as CarouselRow[]));
      if (!data || data.length < PAGE) break;
    }
    return { ok: true, data: rows.filter((r) => r.status !== "cancelled").map(carouselItem) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "read failed" };
  }
}

/** Last still-to-post time per carousel series (scheduled or held). */
export async function readCarouselEnds(): Promise<Result<Record<string, string>>> {
  try {
    const db = getSupabaseAdmin();
    const rows: { series: string; scheduled_at: string }[] = [];
    for (let i = 0; ; i += PAGE) {
      const { data, error } = await db
        .from("social_posts")
        .select("series,scheduled_at")
        .in("status", ["scheduled", "held", "publishing"])
        .order("scheduled_at")
        .range(i, i + PAGE - 1);
      if (error) return { ok: false, error: error.message };
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    return { ok: true, data: carouselEnds(rows) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "read failed" };
  }
}

async function opusPage(from: string, to: string): Promise<OpusTask[]> {
  const key = process.env.OPUS_CLIP_API;
  if (!key) throw new Error("OPUS_CLIP_API is not set in this environment");
  const url = `https://api.opus.pro/api/post-tasks?q=findByPeriodPage&size=1000&startAt=${encodeURIComponent(from)}&endAt=${encodeURIComponent(to)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
    // Opus changes slowly; five minutes stale is fine and keeps page loads quick.
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`OpusClip ${res.status}`);
  const json = (await res.json()) as { data?: { data?: OpusTask[] } };
  return json.data?.data ?? [];
}

export async function readReels(from: string, to: string): Promise<Result<SocialItem[]>> {
  try {
    return { ok: true, data: groupOpusTasks(await opusPage(from, to)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "read failed" };
  }
}

/** Last still-scheduled reel, walking forward 60 days at a time (1,000 tasks per call max). */
export async function readReelsEnd(now: number): Promise<Result<string | null>> {
  try {
    const windows: Promise<OpusTask[]>[] = [];
    for (let f = now - DAY_MS; f < now + 365 * DAY_MS; f += 60 * DAY_MS) {
      windows.push(opusPage(new Date(f).toISOString(), new Date(f + 60 * DAY_MS).toISOString()));
    }
    return { ok: true, data: opusEnd((await Promise.all(windows)).flat()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "read failed" };
  }
}
