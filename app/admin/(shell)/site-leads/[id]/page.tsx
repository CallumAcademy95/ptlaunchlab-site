import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { INTENT_LABEL } from "@/app/lib/leads";
import { AdminPage, PageHeader, Card, SectionTitle, Badge, Notice, DefRow } from "../../ui/praxel";

export const metadata: Metadata = {
  title: "Site lead — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Lead = {
  id: string; created_at: string; name: string | null; phone: string | null; email: string | null;
  question: string | null; intent: string; source: string | null; page_path: string | null;
  gym_slug: string | null; extra: unknown; utm: unknown; referrer: string | null;
  is_test: boolean; is_spam: boolean;
  push_status: string | null; setter_status: string | null; zapier_status: string | null;
  mailerlite_status: string | null; capi_status: string | null;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });

export default async function SiteLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin().from("leads").select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <AdminPage>
        <PageHeader title="Site lead" backHref="/admin/crm" backLabel="CRM" />
        <Notice tone="rose" title="Could not read this lead">{error.message}</Notice>
      </AdminPage>
    );
  }
  if (!data) notFound();
  const l = data as unknown as Lead;
  const utm = l.utm && typeof l.utm === "object" && Object.keys(l.utm as object).length > 0 ? l.utm : null;
  const intent = (INTENT_LABEL as Record<string, string>)[l.intent] ?? l.intent;

  const btn =
    "flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-4 text-xl font-bold shadow-sm active:opacity-90";

  return (
    <AdminPage>
      <PageHeader
        title={l.name || "Unnamed"}
        subtitle={when(l.created_at)}
        backHref="/admin/crm"
        backLabel="CRM"
        badge={
          <>
            {l.is_test && <Badge tone="amber">test</Badge>}
            {l.is_spam && <Badge tone="red">spam</Badge>}
          </>
        }
      />

      <div className="space-y-3">
        {l.phone ? (
          <a href={`tel:${l.phone}`} className={`${btn} bg-green-600 text-white`}>
            <Phone className="h-6 w-6" /> Call {l.phone}
          </a>
        ) : (
          <Notice tone="amber" title="No phone number">This lead did not leave a number.</Notice>
        )}
        {l.email && (
          <a href={`mailto:${l.email}`} className={`${btn} min-h-12 border border-slate-300 bg-white text-base font-semibold text-slate-800`}>
            <Mail className="h-5 w-5" /> {l.email}
          </a>
        )}
      </div>

      {l.question && (
        <Card className="p-4 sm:p-5">
          <SectionTitle>Their question</SectionTitle>
          <p className="mt-2 whitespace-pre-wrap text-[15px] text-slate-800 [overflow-wrap:anywhere]">{l.question}</p>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <SectionTitle>Details</SectionTitle>
        <dl className="mt-2">
          <DefRow k="Intent" v={intent} />
          <DefRow k="Source" v={l.source ?? "—"} />
          <DefRow k="Page" v={l.page_path ?? "—"} />
          <DefRow k="Gym" v={l.gym_slug ?? "—"} />
          <DefRow k="Referrer" v={l.referrer ?? "—"} />
          <DefRow k="Created" v={when(l.created_at)} />
        </dl>
        {utm !== null && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(utm, null, 2)}</pre>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionTitle>Delivery status</SectionTitle>
        <dl className="mt-2">
          <DefRow k="Push" v={l.push_status ?? "—"} />
          <DefRow k="Setter" v={l.setter_status ?? "—"} />
          <DefRow k="Zapier" v={l.zapier_status ?? "—"} />
          <DefRow k="MailerLite" v={l.mailerlite_status ?? "—"} />
          <DefRow k="Meta CAPI" v={l.capi_status ?? "—"} />
        </dl>
      </Card>
    </AdminPage>
  );
}
