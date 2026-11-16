import type { Metadata } from "next";
import { AdminPage, PageHeader, Notice } from "../../ui/praxel";
import { loadWeek, mondayOf, busyClashMoves } from "@/app/lib/diary/week-data";
import { londonDate } from "@/app/lib/booking/london";
import WeekClient from "./WeekClient";

export const metadata: Metadata = { title: "Week — PT Launch Lab admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const todayLondon = () => londonDate(Date.now());

export default async function WeekPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams;
  const base = w && /^\d{4}-\d{2}-\d{2}$/.test(w) ? w : todayLondon();
  const data = await loadWeek(mondayOf(base));
  const clashMoves = await busyClashMoves().catch((e) => { data.errors.push(`Clash check: ${e instanceof Error ? e.message : e}`); return []; });
  return (
    <AdminPage>
      <PageHeader title="Week" subtitle="Your diary: today, this week, and what to fit in." />
      {data.errors.length > 0 && <Notice tone="rose" title="Some of the week couldn't load">{data.errors.join(" · ")}</Notice>}
      <WeekClient data={data} clashMoves={clashMoves} />
    </AdminPage>
  );
}
