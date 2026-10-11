import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { INTENT_LABEL } from "@/app/lib/leads";
import {
  AdminPage, PageHeader, Card, Badge, EmptyState, Notice,
  TableWrap, THEAD, TBODY, TR, TD, TH,
} from "../ui/praxel";

export const metadata: Metadata = {
  title: "Site leads — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Row = {
  id: string; created_at: string; name: string | null; phone: string | null;
  intent: string; source: string | null; page_path: string | null;
  push_status: string | null; is_test: boolean; is_spam: boolean;
};

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        timeZone: "Europe/London", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit", hour12: false,
      })
    : "—";

const intentLabel = (i: string) => (INTENT_LABEL as Record<string, string>)[i] ?? i;

function PushBadge({ s }: { s: string | null }) {
  const tone = s === "sent" ? "green" : s === "failed" ? "red" : "neutral";
  return <Badge tone={tone}>{s ?? "—"}</Badge>;
}

export default async function SiteLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const showAll = (await searchParams).all === "1";

  const { data, error } = await getSupabaseAdmin()
    .from("leads")
    .select("id,created_at,name,phone,intent,source,page_path,push_status,is_test,is_spam")
    .order("created_at", { ascending: false })
    .limit(100);

  const all = (error ? [] : (data ?? [])) as unknown as Row[];
  const rows = showAll ? all : all.filter((r) => !r.is_test && !r.is_spam);

  return (
    <AdminPage>
      <PageHeader
        title="Site leads"
        subtitle="Enquiries from the website, newest first."
        action={
          <Link
            href={showAll ? "/admin/site-leads" : "/admin/site-leads?all=1"}
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-semibold text-slate-600"
          >
            {showAll ? "Hide test and spam" : "Show test and spam"}
          </Link>
        }
      />

      {error && (
        <Notice tone="rose" title="Could not read site leads">
          {error.message}
        </Notice>
      )}

      <Card className="p-4 sm:p-5">
        {rows.length === 0 ? (
          <EmptyState title="No leads yet" hint="New website enquiries will appear here." />
        ) : (
          <>
            <ul className="space-y-2.5 md:hidden">
              {rows.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/site-leads/${l.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{l.name || "Unnamed"}</p>
                      <span className="shrink-0 text-xs text-slate-500">{when(l.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{l.phone ?? "no phone"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{intentLabel(l.intent)}</span>
                      <PushBadge s={l.push_status} />
                      {l.is_test && <Badge tone="amber">test</Badge>}
                      {l.is_spam && <Badge tone="red">spam</Badge>}
                    </div>
                    {l.page_path && <p className="mt-1.5 truncate text-xs text-slate-400">{l.page_path}</p>}
                  </Link>
                </li>
              ))}
            </ul>

            <TableWrap className="hidden md:block">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Time</th>
                    <th className={TH}>Name</th>
                    <th className={TH}>Phone</th>
                    <th className={TH}>Intent</th>
                    <th className={TH}>Page</th>
                    <th className={TH}>Push</th>
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {rows.map((l) => (
                    <tr key={l.id} className={TR}>
                      <td className={TD}>{when(l.created_at)}</td>
                      <td className={TD}>
                        <Link href={`/admin/site-leads/${l.id}`} className="font-semibold text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline">
                          {l.name || "Unnamed"}
                        </Link>
                        {l.is_test && <span className="ml-2"><Badge tone="amber">test</Badge></span>}
                        {l.is_spam && <span className="ml-2"><Badge tone="red">spam</Badge></span>}
                      </td>
                      <td className={TD}>
                        {l.phone ? <a href={`tel:${l.phone}`} className="text-blue-700 hover:underline">{l.phone}</a> : "—"}
                      </td>
                      <td className={TD}>{intentLabel(l.intent)}</td>
                      <td className={TD}>{l.page_path ?? "—"}</td>
                      <td className={TD}><PushBadge s={l.push_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </>
        )}
      </Card>
    </AdminPage>
  );
}
