import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { EVENT } from "@/app/live/event";
import { setQuestionStatus } from "./actions";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/live-questions
//
// Private viewer for audience questions submitted via /ask. Protected by the
// admin auth cookie (middleware gates every /admin/* path). Server-rendered,
// no client JS — triage buttons are <form> server actions.
//
// Pull questions for the panel, star the best, mark them answered on the night.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type QuestionRow = {
  id: string;
  name: string | null;
  email: string;
  question: string;
  event: string | null;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-500 border-slate-200",
  starred: "bg-blue-100 text-blue-700 border-blue-300",
  answered: "bg-green-500/15 text-green-300 border-green-500/40",
  hidden: "bg-slate-50 text-slate-400 border-slate-200",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: string;
  label: string;
}) {
  return (
    <form action={setQuestionStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 text-[13px] sm:text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-700 transition-colors"
      >
        {label}
      </button>
    </form>
  );
}

function QuestionCard({ q }: { q: QuestionRow }) {
  const badge = STATUS_STYLES[q.status] ?? STATUS_STYLES.new;
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        q.status === "starred"
          ? "border-blue-300 bg-blue-50"
          : "border-white/[0.08] bg-white"
      } ${q.status === "hidden" || q.status === "answered" ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`shrink-0 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${badge}`}
        >
          {q.status}
        </span>
        <span className="text-slate-400 text-xs whitespace-nowrap">{fmt(q.created_at)}</span>
      </div>

      <p className="text-slate-900 text-[17px] sm:text-lg leading-relaxed mb-3 whitespace-pre-wrap [overflow-wrap:anywhere]">{q.question}</p>

      <p className="text-slate-500 text-sm mb-4 [overflow-wrap:anywhere]">
        {q.name ? <span className="text-slate-500">{q.name}</span> : <span className="italic">No name</span>}
        {" · "}
        <a href={`mailto:${q.email}`} className="hover:text-blue-700">
          {q.email}
        </a>
      </p>

      <div className="flex flex-wrap gap-2">
        {q.status !== "starred" && <StatusButton id={q.id} status="starred" label="★ Star" />}
        {q.status === "starred" && <StatusButton id={q.id} status="new" label="☆ Unstar" />}
        {q.status !== "answered" && <StatusButton id={q.id} status="answered" label="✓ Answered" />}
        {q.status !== "hidden" && <StatusButton id={q.id} status="hidden" label="Hide" />}
        {(q.status === "hidden" || q.status === "answered") && (
          <StatusButton id={q.id} status="new" label="↺ Reopen" />
        )}
      </div>
    </div>
  );
}

export default async function LiveQuestionsPage() {
  let rows: QuestionRow[] = [];
  let loadError: string | null = null;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("live_questions")
      .select("id,name,email,question,event,status,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    rows = (data ?? []) as QuestionRow[];
  } catch (err) {
    loadError =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Failed to load questions.";
  }

  // Starred first, then everything else (each block already newest-first),
  // hidden sinks to the bottom.
  const rank = (s: string) => (s === "starred" ? 0 : s === "hidden" ? 2 : 1);
  const sorted = [...rows].sort((a, b) => rank(a.status) - rank(b.status));

  const visible = sorted.filter((q) => q.status !== "hidden");
  const starred = rows.filter((q) => q.status === "starred").length;
  const answered = rows.filter((q) => q.status === "answered").length;
  const hidden = rows.filter((q) => q.status === "hidden").length;

  return (
    <main className="max-w-3xl mx-auto md:px-5 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-blue-700 text-[11px] font-bold tracking-widest uppercase mb-1">
            PT Launch Lab LIVE
          </p>
          <h1 className="font-display font-extrabold text-[28px] leading-tight md:text-4xl">Audience questions</h1>
        </div>
        {/* The shell's top bar has sign-out on a phone; this one is for desktop. */}
        <form action="/api/admin-logout" method="post" className="hidden md:block">
          <button type="submit" className="text-slate-500 text-xs hover:text-blue-700">
            Sign out
          </button>
        </form>
      </div>

      <p className="text-slate-500 text-sm mb-1">
        Current event: <span className="text-slate-500">#{EVENT.number} — {EVENT.title}</span>
      </p>
      <p className="text-slate-400 text-xs mb-8">
        {rows.length} total · {starred} starred · {answered} answered · {hidden} hidden
      </p>

      {loadError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          <p className="font-bold mb-1">Couldn&apos;t load questions</p>
          <p className="text-sm text-red-200/80 mb-3">{loadError}</p>
          <p className="text-sm text-red-200/70">
            If this says the table is missing, apply the migration{" "}
            <code className="text-red-100">supabase/migrations/20260630_live_questions.sql</code> in the
            Supabase SQL editor, then refresh.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white p-10 text-center">
          <p className="text-slate-900 font-bold text-lg mb-2">No questions yet</p>
          <p className="text-slate-500 text-sm">
            They&apos;ll appear here the moment someone submits one at{" "}
            <span className="text-slate-500">ptlaunchlab.co.uk/ask</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </div>
      )}
    </main>
  );
}
