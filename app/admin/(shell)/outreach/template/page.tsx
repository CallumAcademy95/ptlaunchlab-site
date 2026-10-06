import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { AdminPage, PageHeader, Card, SectionTitle, Notice, Badge } from "../../ui/praxel";
import { saveOutreachTemplate } from "../actions";
import { runOutreach, missingConfig } from "../ptApp";

// The cold-outreach copy, editable.
//
// The last rewrite needed a deploy, which is the wrong shape for the thing most
// likely to change again. This edits the row that pt-app composes from.
//
// WHO CHECKS THE TEMPLATE
//
// Not this page. pt-app does, because pt-app is what sends — a template it
// refuses falls back to the built-in copy whatever is believed here. A second
// set of rules on this side would drift from the first, and the drift would be
// invisible in the worst way: the editor saying "looks fine" while the sender
// quietly ignored the row.
//
// So the verdict comes from a real dry run after every save, and the banner at
// the top reports what pt-app actually did with it.

export const metadata: Metadata = {
  title: "Outreach copy — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TOKENS: Array<{ token: string; what: string }> = [
  { token: "{{greeting}}", what: "Hi Dave, — or a bare Hi, when the mailbox names nobody" },
  { token: "{{closer}}", what: "Any use to you at Stone? — or Any use to you?" },
  { token: "{{gym}}", what: "Subject only. The gym's short name, or its town." },
  { token: "{{partnership_url}}", what: "The how-it-works link" },
  { token: "{{opt_out}}", what: "The opt-out sentence. Required." },
];

export default async function OutreachTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const { data, error } = await getSupabaseAdmin()
    .from("outreach_templates")
    .select("subject, subject_fallback, body, updated_at, updated_by")
    .eq("key", "gym-first-contact")
    .maybeSingle();

  const tpl = data as
    | { subject: string; subject_fallback: string; body: string; updated_at: string; updated_by: string | null }
    | null;

  // pt-app's verdict, from a real dry run. Only after a save — it takes a few
  // seconds and there is nothing to report on an ordinary visit.
  const configError = missingConfig();
  const verdict = sp.saved && !configError ? await runOutreach({ send: false }) : null;
  const accepted = verdict?.ok ? verdict.run.copy === "template" : null;
  const issues = verdict?.ok ? (verdict.run.templateIssues ?? []) : [];

  return (
    <AdminPage>
      <PageHeader
        title="Outreach copy"
        subtitle="What the first email says. Saved here, sent by pt-app."
        backHref="/admin/outreach"
        backLabel="Gym outreach"
        badge={
          tpl ? (
            <Badge tone={accepted === false ? "red" : "neutral"}>
              {accepted === false ? "not in use" : "live"}
            </Badge>
          ) : undefined
        }
      />

      {/*
        The verdict. This is the whole reason the page runs a dry run after a
        save: a rejected template saves perfectly happily, and without this the
        next batch would go out in the old words with nothing to say so.
      */}
      {sp.saved && accepted === true && (
        <Notice tone="blue" title="Saved, and pt-app is using it">
          A dry run composed the next batch from this copy. The next send will use these words.
        </Notice>
      )}
      {sp.saved && accepted === false && (
        <Notice tone="rose" title="Saved, but pt-app has refused it">
          <p>
            Your changes are stored, and <strong>they are not what will send</strong>. pt-app is
            falling back to the built-in copy until this is fixed:
          </p>
          <ul className="mt-2 list-disc pl-5">
            {issues.length ? (
              issues.map((p) => <li key={p}>{p}</li>)
            ) : (
              <li>No reason given — check the tokens below.</li>
            )}
          </ul>
        </Notice>
      )}
      {sp.saved && verdict && !verdict.ok && (
        <Notice tone="amber" title="Saved, but the check could not run">
          {verdict.error} The copy is stored; whether pt-app accepts it is unconfirmed. Press
          Preview on the outreach page to find out.
        </Notice>
      )}
      {sp.saved && configError && (
        <Notice tone="amber" title="Saved, but unverified">
          {configError} Nothing here can ask pt-app whether it accepted the template.
        </Notice>
      )}
      {sp.error && (
        <Notice tone="rose" title="Could not save">
          {sp.error}
        </Notice>
      )}

      {!tpl ? (
        <Notice tone="amber" title="There is no template row yet">
          The migration that creates <code>outreach_templates</code> has not been applied to this
          database. pt-app is sending its built-in copy, which is correct and unchanged — there is
          simply nothing here to edit yet.
        </Notice>
      ) : (
        <form action={saveOutreachTemplate} className="space-y-4">
          <Card className="p-5">
            <SectionTitle hint="One header line. Keep it under about 40 characters — that is what mobile Gmail shows.">
              Subject
            </SectionTitle>
            <input
              name="subject"
              defaultValue={tpl.subject}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Fallback, used when a gym has neither a usable name nor a town
            </p>
            <input
              name="subject_fallback"
              defaultValue={tpl.subject_fallback}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              The fallback cannot use <code>{"{{gym}}"}</code> — it is what gets used precisely
              because there is no gym name.
            </p>
          </Card>

          <Card className="p-5">
            <SectionTitle hint="Plain text. It is sent exactly as written, so line breaks are real line breaks.">
              Body
            </SectionTitle>
            <textarea
              name="body"
              defaultValue={tpl.body}
              rows={20}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-[13px] leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </Card>

          <Card className="p-5">
            <SectionTitle hint="Everything else is yours to change.">Tokens</SectionTitle>
            <dl className="space-y-1.5">
              {TOKENS.map((t) => (
                <div key={t.token} className="flex flex-wrap gap-x-3 text-sm">
                  <dt className="font-mono text-[12px] text-blue-700">{t.token}</dt>
                  <dd className="text-slate-600">{t.what}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              Who gets greeted by name, and what the gym is called, are decided in code rather than
              here — those rules were measured over 1,141 gyms and are not copy.
            </p>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Save copy
            </button>
            <Link
              href="/admin/outreach?preview=1"
              className="text-sm text-slate-500 underline-offset-2 hover:underline"
            >
              Preview against real gyms
            </Link>
            <span className="text-xs text-slate-500">
              Last edited {new Date(tpl.updated_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}
              {tpl.updated_by ? ` by ${tpl.updated_by}` : ""}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Saving does not send anything. The next scheduled batch uses whatever is stored here, so
            long as pt-app accepts it — and it will tell you above if it does not.
          </p>
        </form>
      )}

      {error && (
        <Notice tone="rose" title="Could not read the template">
          {error.message}
        </Notice>
      )}
    </AdminPage>
  );
}
