import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { formatPence } from "@/app/lib/partner-data";
import { setReferralStatus, setReferralReward } from "./actions";

// Where referrals land.
//
// A referral is a payment promise — £200 once the person named enrols — so the
// thing that matters here is that nothing quietly goes cold. Two counts are
// therefore on top and impossible to miss: how many nobody has contacted, and
// how much we owe and haven't paid.

export const metadata: Metadata = {
  title: "Referrals — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Referral {
  id: string;
  referrer_email: string;
  referrer_name: string | null;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  note: string | null;
  status: string;
  reward_pence: number;
  reward_status: string;
  reward_paid_at: string | null;
  reward_reference: string | null;
  source: string;
  created_at: string;
}

const STATUSES = ["new", "contacted", "enrolled", "declined", "duplicate"];
const REWARDS = ["pending", "due", "paid", "void"];

const dateUK = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusTone: Record<string, string> = {
  new: "text-amber-700",
  contacted: "text-sky-700",
  enrolled: "text-emerald-700",
  declined: "text-slate-500",
  duplicate: "text-slate-500",
};

export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const filter = ((await searchParams).status ?? "").trim();

  const { data, error } = await getSupabaseAdmin()
    .from("referrals")
    .select(
      "id, referrer_email, referrer_name, referred_name, referred_email, referred_phone, " +
      "note, status, reward_pence, reward_status, reward_paid_at, reward_reference, source, created_at"
    )
    .order("created_at", { ascending: false });

  const all = (data ?? []) as unknown as Referral[];
  const rows = filter ? all.filter((r) => r.status === filter) : all;

  const untouched = all.filter((r) => r.status === "new").length;
  const owed = all.filter((r) => r.reward_status === "due").reduce((t, r) => t + r.reward_pence, 0);
  const paid = all.filter((r) => r.reward_status === "paid").reduce((t, r) => t + r.reward_pence, 0);
  const enrolled = all.filter((r) => r.status === "enrolled").length;

  const countFor = (s: string) => all.filter((r) => r.status === s).length;
  const select = "rounded-md bg-[#f6f8fb] border border-slate-200 text-slate-900 px-2 py-1.5 text-xs";

  const tab = (href: string, label: string, active: boolean, n: number) => (
    <Link
      key={href}
      href={href}
      className={
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition " +
        (active ? "bg-blue-700 text-slate-900 border-blue-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300")
      }
    >
      {label}
      <span className="opacity-70"> · {n}</span>
    </Link>
  );

  return (
    <div className="bg-[#f6f8fb] md:min-h-screen">
      {/* The shell already pads the page on a phone; this padding is for desktop. */}
      <div className="mx-auto max-w-5xl space-y-6 md:space-y-8 md:px-6 md:py-10">
        <div>
          <p className="text-blue-700 text-[10px] font-bold tracking-widest uppercase mb-1">
            PT Launch Lab admin
          </p>
          <h1 className="text-slate-900 font-bold text-2xl">Referrals</h1>
          <p className="text-slate-500 text-sm mt-1">
            £200 to the referrer once the person they named enrols.{" "}
            <Link href="/admin/partners" className="text-blue-700">Gym partners →</Link>
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
            Could not load referrals: {error.message}
            {error.message.includes("referrals") && (
              <> — has <code>supabase/migrations/20260930_referrals.sql</code> been applied?</>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Not contacted", value: String(untouched), note: untouched > 0 ? "chase these" : "all picked up" },
            { label: "Enrolled", value: String(enrolled), note: "referral converted" },
            { label: "Owed", value: formatPence(owed), note: "due, not paid" },
            { label: "Paid out", value: formatPence(paid), note: "lifetime" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white border border-slate-200 px-4 py-3">
              <div className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{s.label}</div>
              <div className="text-slate-900 font-bold text-xl mt-1">{s.value}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {tab("/admin/referrals", "All", !filter, all.length)}
          {STATUSES.map((s) => tab(`/admin/referrals?status=${s}`, s, filter === s, countFor(s)))}
        </div>

        <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
              <div>
                <div className="text-slate-900 font-semibold">
                  {r.referred_name}
                  <span className={"ml-2 text-xs font-normal " + (statusTone[r.status] ?? "text-slate-500")}>
                    {r.status}
                  </span>
                </div>
                <div className="text-slate-500 text-xs mt-0.5 [overflow-wrap:anywhere]">
                  {[r.referred_email, r.referred_phone].filter(Boolean).join(" · ") || "no contact details"}
                </div>
                <div className="text-slate-500 text-xs mt-2">
                  Referred by{" "}
                  <span className="text-slate-900">{r.referrer_name || r.referrer_email}</span>
                  {r.referrer_name && <span> &lt;{r.referrer_email}&gt;</span>}
                  {" · "}
                  {dateUK(r.created_at)}
                  {r.source !== "nurture-email" && <span> · {r.source}</span>}
                </div>
                {r.note && <div className="text-slate-500 text-xs mt-2 italic">“{r.note}”</div>}
              </div>

              <div className="flex flex-col gap-2 lg:items-end">
                <form action={setReferralStatus} className="flex flex-wrap items-center gap-1.5">
                  <input type="hidden" name="id" value={r.id} />
                  <span className="text-slate-500 text-xs">Status</span>
                  <select aria-label={`Status for ${r.referred_name}`} name="status" defaultValue={r.status} className={select}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="rounded-full bg-blue-700 text-slate-900 font-bold text-xs px-3 py-1.5">Save</button>
                </form>

                <form action={setReferralReward} className="flex flex-wrap items-center gap-1.5">
                  <input type="hidden" name="id" value={r.id} />
                  <span className="text-slate-500 text-xs">{formatPence(r.reward_pence)}</span>
                  <select aria-label={`Reward for ${r.referred_name}`} name="reward_status" defaultValue={r.reward_status} className={select}>
                    {REWARDS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input
                    name="reference"
                    defaultValue={r.reward_reference ?? ""}
                    placeholder="payment ref"
                    aria-label={`Payment reference for ${r.referred_name}`}
                    className="rounded-md bg-[#f6f8fb] border border-slate-200 text-slate-900 px-2 py-1.5 text-xs w-28"
                  />
                  <button className="rounded-full bg-slate-100 text-slate-900 font-bold text-xs px-3 py-1.5 border border-slate-200">
                    Save
                  </button>
                </form>
                {r.reward_paid_at && (
                  <div className="text-emerald-700 text-[11px]">paid {dateUK(r.reward_paid_at)}</div>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && !error && (
            <div className="px-4 py-8 text-slate-500 text-sm text-center">
              {filter ? `No referrals with status “${filter}”.` : "No referrals yet."}
            </div>
          )}
        </div>

        <p className="text-slate-500 text-xs">
          Marking someone <strong>enrolled</strong> sets the reward to <strong>due</strong>. Paying is a
          separate click, so nothing is ever recorded as paid just because it converted.
        </p>
      </div>
    </div>
  );
}
