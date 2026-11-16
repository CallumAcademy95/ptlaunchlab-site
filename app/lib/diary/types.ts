// Shared PA-diary types. Pure: no imports, safe for node --test.
export type Category = "Sales" | "Outreach" | "Scaling" | "Praxel" | "Content" | "Podcast" | "SEO" | "Admin" | "Review" | "Fixed";
export const CATEGORIES: Category[] = ["Sales", "Outreach", "Scaling", "Praxel", "Content", "Podcast", "SEO", "Admin", "Review", "Fixed"];
export type Area = "PTLL" | "Praxel" | "AlbaCo" | "USA" | "Personal";
export const AREAS: Area[] = ["PTLL", "Praxel", "AlbaCo", "USA", "Personal"];
export type TaskStatus = "inbox" | "placed" | "done" | "approved" | "dropped";
export type TemplateRow = { day: 1 | 2 | 3 | 4 | 5; start: string; end: string; category: Category; title: string };
export type Interval = { start: number; end: number };
export type TaskRow = {
  id: string; ref: string; created_at: string; updated_at: string;
  title: string; area: Area; category: Category; estimate_min: number | null; deadline: string | null;
  owner: "Callum" | "Claude"; status: TaskStatus; kind: "task" | "fixed";
  start_at: string | null; end_at: string | null; event_id: string | null;
  source: "typed" | "screenshot" | "claude" | "import"; notes: string | null;
};
export const TASK_COLS =
  "id, ref, created_at, updated_at, title, area, category, estimate_min, deadline, owner, status, kind, start_at, end_at, event_id, source, notes";

/** YYYY-MM-DD that is a real calendar day (rejects 2026-02-31, 2026-13-01). */
export function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}
