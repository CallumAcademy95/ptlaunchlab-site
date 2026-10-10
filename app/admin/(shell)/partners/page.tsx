import type { Metadata } from "next";
import { commissionTermsLabel } from "@/app/lib/paymentPlans";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { formatPence } from "@/app/lib/partner-data";
import { buildPartnerTimeline, partnerHealth } from "@/app/lib/partner-timeline";
import { Banknote, Building2, PoundSterling, Users, Wallet } from "lucide-react";
import {
  AdminPage,
  Badge,
  Card,
  Notice,
  PageHeader,
  SectionTitle,
  StatTile,
  TableWrap,
  TBODY,
  TD,
  TH,
  THEAD,
  TR,
} from "../ui/praxel";
import { STANDING_TONE } from "./standing";
import { demoPartnerIds } from "./demo";
import { formatUkPhone, isUkMobile } from "./phone";
import SetContactForm from "./SetContactForm";
import { canBePaid } from "@/app/lib/security/payoutRules";
import { saleMoney } from "@/app/lib/partnerCommission";
import CreateUserForm from "./CreateUserForm";
import MarkPaidForm from "./MarkPaidForm";
import BankReveal from "./BankReveal";
import UploadResourceForm from "./UploadResourceForm";
import ResetPasswordButton from "./ResetPasswordButton";
import AddPlaybookForm from "./AddPlaybookForm";
import SetBankForm from "./SetBankForm";
import PartnerLearners, { type SaleRow, type PayoutRow } from "./PartnerLearners";

export const metadata: Metadata = {
  title: "Partners — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PartnerRow {
  id: string;
  slug: string;
  gym_name: string;
  status: string;
  landing_page_path: string | null;
  commission_terms: string;
  is_demo?: boolean;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_mobile?: string | null;
  contact_instagram?: string | null;
  agreement_signed_at: string | null;
  agreement_version: string | null;
  created_at: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  bank_details_updated_at: string | null;
  pp_partner_users: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    must_change_password: boolean;
    last_login_at: string | null;
    created_at: string | null;
  }[];
}

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ gym?: string }>;
}) {
  const selectedSlug = ((await searchParams).gym ?? "").trim();
  const { data, error } = await getSupabaseAdmin()
    .from("pp_partners")
    .select(
      "id, slug, gym_name, status, landing_page_path, commission_terms, is_demo, " +
      "contact_name, contact_email, contact_phone, contact_mobile, contact_instagram, " +
      "agreement_signed_at, agreement_version, created_at, " +
      "bank_account_name, bank_sort_code, bank_account_number, bank_details_updated_at, " +
      "pp_partner_users(id, email, full_name, role, must_change_password, last_login_at, created_at)"
    )
    .order("gym_name");

  const partners = (data ?? []) as unknown as PartnerRow[];

  // What each partner is owed right now: commission that has released and
  // hasn't been paid. Derived from the release date rather than a status
  // column, same rule the partner-facing pages use.
  const nowIso = new Date().toISOString();
  // Paid sales are read too: a quarterly volume bonus can land on a sale whose
  // commission was already paid, and is owed on its own. saleMoney() is the
  // same rule markCommissionPaid settles by, so the two cannot disagree.
  const { data: payableRows } = await getSupabaseAdmin()
    .from("pp_sales")
    .select("partner_id, status, commission_pence, commission_status, commission_release_at, volume_bonus_pence, volume_bonus_payout_id")
    .eq("status", "confirmed")
    .neq("commission_status", "voided")
    .not("commission_release_at", "is", null)
    .lte("commission_release_at", nowIso);

  const payable = new Map<string, { total: number; count: number }>();
  const nowMs = Date.parse(nowIso);
  for (const row of (payableRows ?? []) as unknown as ({ partner_id: string } & Parameters<typeof saleMoney>[0])[]) {
    const owed = saleMoney(row, nowMs).payable;
    if (owed <= 0) continue;
    const entry = payable.get(row.partner_id) ?? { total: 0, count: 0 };
    entry.total += owed;
    entry.count += 1;
    payable.set(row.partner_id, entry);
  }

  // Everything a gym has produced and everything we've paid them. Both tables
  // already existed; neither was on screen, so "which learners did this gym
  // send?" could only be answered by querying the database by hand.
  const [{ data: saleRows }, { data: payoutRows }] = await Promise.all([
    getSupabaseAdmin()
      .from("pp_sales")
      .select(
        "id, partner_id, learner_name, learner_email, plan_type, amount_paid_pence, " +
        "promo_code, status, commission_pence, commission_status, commission_release_at, " +
        "volume_bonus_pence, enrolled_at, created_at"
      )
      .order("created_at", { ascending: false }),
    getSupabaseAdmin()
      .from("pp_payouts")
      .select("id, partner_id, period_label, total_pence, status, invoice_number, paid_at, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const sales = (saleRows ?? []) as unknown as SaleRow[];
  const payouts = (payoutRows ?? []) as unknown as PayoutRow[];

  const today = nowIso.slice(0, 10);
  // Demo accounts carry invented commission so a walkthrough looks like a going
  // concern. It must never reach a number anyone acts on.
  const demoIds = demoPartnerIds(partners);
  // The one list the table renders and every partner tile counts.
  //
  // These used to be computed separately: the tiles filtered out demo rows and
  // the table did not, so the page said "9 Partners" above a table of ten. Both
  // now come off `livePartners`, which is the only way they cannot drift again.
  //
  // `partners` itself stays complete on purpose — see where it is handed to
  // PartnerLearners below.
  const livePartners = partners.filter((p) => !demoIds.has(p.id));
  // Per-gym rollups. Demo partners carry invented commission, so they are
  // excluded from every total — the same rule the owed figure already used.
  const learnersFor = new Map<string, number>();
  const earnedFor = new Map<string, number>();
  for (const s of sales) {
    if (s.status === "voided") continue;
    learnersFor.set(s.partner_id, (learnersFor.get(s.partner_id) ?? 0) + 1);
    const earnedOnSale = (s.commission_pence ?? 0) + (s.volume_bonus_pence ?? 0);
    if (earnedOnSale) earnedFor.set(s.partner_id, (earnedFor.get(s.partner_id) ?? 0) + earnedOnSale);
  }
  const paidFor = new Map<string, number>();
  for (const p of payouts) {
    if (p.status !== "paid") continue;
    paidFor.set(p.partner_id, (paidFor.get(p.partner_id) ?? 0) + p.total_pence);
  }

  const real = (id: string) => !demoIds.has(id);
  const totalLearners = [...learnersFor.entries()].filter(([id]) => real(id)).reduce((t, [, n]) => t + n, 0);
  const totalEarned = [...earnedFor.entries()].filter(([id]) => real(id)).reduce((t, [, n]) => t + n, 0);
  const totalPaid = [...paidFor.entries()].filter(([id]) => real(id)).reduce((t, [, n]) => t + n, 0);
  const producing = livePartners.filter((p) => (learnersFor.get(p.id) ?? 0) > 0).length;
  const realPartners = livePartners.length;
  const neverLoggedIn = livePartners.filter(
    (p) => !p.pp_partner_users.some((u) => u.last_login_at)
  ).length;

  const owedTotal = [...payable.entries()]
    .filter(([id]) => !demoIds.has(id))
    .reduce((t, [, e]) => t + e.total, 0);
  // The same derivation the detail page runs, so the list and the page can
  // never disagree about whether a gym is doing anything. It also stops a
  // payout WE sent from reading as the gym being active, which is what had
  // MoF and Musclebound showing as producing.
  const salesFor = new Map<string, typeof sales>();
  for (const s of sales) {
    const bucket = salesFor.get(s.partner_id) ?? [];
    bucket.push(s);
    salesFor.set(s.partner_id, bucket);
  }
  const payoutsFor = new Map<string, typeof payouts>();
  for (const p of payouts) {
    const bucket = payoutsFor.get(p.partner_id) ?? [];
    bucket.push(p);
    payoutsFor.set(p.partner_id, bucket);
  }
  const healthFor = new Map<string, ReturnType<typeof partnerHealth>>();
  for (const p of partners) {
    const events = buildPartnerTimeline({
      partner: p,
      users: p.pp_partner_users,
      sales: salesFor.get(p.id) ?? [],
      payouts: payoutsFor.get(p.id) ?? [],
    });
    healthFor.set(
      p.id,
      partnerHealth({
        events,
        hasEverLoggedIn: p.pp_partner_users.some((u) => u.last_login_at),
        learners: learnersFor.get(p.id) ?? 0,
        logins: p.pp_partner_users.length,
      }),
    );
  }

  // Read the clock once, outside the render, so the rows stay pure.
  const recentChangeCutoff = Date.parse(nowIso) - 7 * 86400000;

  return (
    <AdminPage>
      <div className="space-y-8">
        <PageHeader
          title="Gym partners"
          subtitle={
            owedTotal > 0
              ? `${formatPence(owedTotal)} in commission is released and unpaid across all partners.`
              : "All released commission has been paid."
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatTile
            icon={<Building2 className="h-5 w-5" />}
            value={realPartners}
            label="Partners"
            sublabel={`${producing} producing`}
            tone="slate"
          />
          <StatTile
            icon={<Users className="h-5 w-5" />}
            value={totalLearners}
            label="Learners"
            sublabel="attributed to a gym"
            tone="blue"
          />
          <StatTile
            icon={<PoundSterling className="h-5 w-5" />}
            value={formatPence(totalEarned)}
            label="Commission earned"
            sublabel="lifetime"
            tone="slate"
          />
          <StatTile
            icon={<Banknote className="h-5 w-5" />}
            value={formatPence(totalPaid)}
            label="Paid out"
            sublabel="left the bank"
            tone="green"
          />
          <StatTile
            icon={<Wallet className="h-5 w-5" />}
            value={formatPence(owedTotal)}
            label="Owed now"
            sublabel="released, unpaid"
            tone={owedTotal > 0 ? "amber" : "slate"}
          />
        </div>

        {neverLoggedIn > 0 && (
          <Notice tone="amber">
            <strong>{neverLoggedIn}</strong> of {realPartners} partners have never logged in. An
            asset library nobody opens is not a distribution channel.
          </Notice>
        )}

        {error && (
          <Notice tone="rose">
            Could not load partners: {error.message}
            {error.message.includes("pp_partners") && (
              <> — has <code>supabase/migrations/20260727_partner_platform.sql</code> been applied?</>
            )}
          </Notice>
        )}


        {/*
          How to reach them. Added because the question "do we have the gym
          partners' mobile numbers?" could not be answered from this page at
          all — pp_partners held a name and an email and nothing else, and the
          answer had to be reconstructed from scraped prospect rows.
        */}
        <Card className="p-5">
          <SectionTitle hint="Only a mobile can take a WhatsApp. Fill gaps in 'Record contact details' below.">
            Reaching them
          </SectionTitle>
          <TableWrap>
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className={TH}>Gym</th>
                  <th className={TH}>Mobile</th>
                  <th className={TH}>Phone</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Instagram</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {livePartners.map((p) => {
                  const loginEmail = p.pp_partner_users?.[0]?.email ?? null;
                  return (
                    <tr key={p.id} className={TR}>
                      <td className={TD}>{p.gym_name}</td>
                      <td className={TD}>
                        {isUkMobile(p.contact_mobile) ? (
                          <span className="text-slate-900">{formatUkPhone(p.contact_mobile)}</span>
                        ) : (
                          <span className="text-amber-700">none</span>
                        )}
                      </td>
                      <td className={TD}>{formatUkPhone(p.contact_phone) ?? <span className="text-slate-400">&mdash;</span>}</td>
                      <td className={TD}>
                        {p.contact_email ?? (loginEmail ? (
                          <span className="text-slate-500" title="This is their login, not a contact address">
                            {loginEmail} <span className="text-[10px]">(login)</span>
                          </span>
                        ) : <span className="text-amber-700">none</span>)}
                      </td>
                      <td className={TD}>
                        {p.contact_instagram ? `@${p.contact_instagram}` : <span className="text-slate-400">&mdash;</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <TableWrap>
          <table className="w-full min-w-[68rem] text-left text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={TH}>Gym</th>
                <th className={TH}>Slug</th>
                <th className={TH}>Standing</th>
                <th className={TH}>Terms</th>
                <th className={TH}>Learners</th>
                <th className={TH}>Earned</th>
                <th className={TH}>Paid</th>
                <th className={TH}>Logins</th>
                <th className={TH}>Bank</th>
                <th className={TH}>Owed now</th>
              </tr>
            </thead>
            <tbody className={TBODY}>
              {livePartners.map((p) => (
                <tr key={p.id} className={TR}>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/partners/${p.slug}`}
                      className="font-semibold text-slate-900 underline-offset-2 hover:text-blue-700 hover:underline"
                    >
                      {p.gym_name}
                    </a>
                    {p.is_demo && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                        demo
                      </span>
                    )}
                    {p.status !== "active" && (
                      <span className="ml-2 text-amber-700 text-xs">({p.status})</span>
                    )}
                    {p.landing_page_path && (
                      <div className="text-slate-500 text-xs mt-0.5">{p.landing_page_path}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STANDING_TONE[healthFor.get(p.id)?.health ?? "quiet"]}>
                      {healthFor.get(p.id)?.health}
                    </Badge>
                    <div className="mt-1 max-w-[15rem] text-[11px] text-slate-500">
                      {healthFor.get(p.id)?.why}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {commissionTermsLabel(p.commission_terms)}
                  </td>
                  <td className="px-4 py-3">
                    {(learnersFor.get(p.id) ?? 0) > 0 ? (
                      <a href={`/admin/partners?gym=${encodeURIComponent(p.slug)}`} className="text-blue-700 font-semibold">
                        {learnersFor.get(p.id)}
                      </a>
                    ) : (
                      <span className="text-slate-500 text-xs">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {earnedFor.get(p.id) ? formatPence(earnedFor.get(p.id)!) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {paidFor.get(p.id) ? formatPence(paidFor.get(p.id)!) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.pp_partner_users.length === 0 ? (
                      <span className="text-slate-500 text-xs">No login yet</span>
                    ) : (
                      p.pp_partner_users.map((u) => (
                        <div key={u.email} className="text-slate-500 text-xs mb-1.5">
                          <div>
                            {u.email}
                            {u.must_change_password && (
                              <span className="text-amber-700"> · not signed in yet</span>
                            )}
                          </div>
                          <div className={u.last_login_at ? "text-slate-500" : "text-amber-700"}>
                            {u.last_login_at
                              ? `last in ${new Date(u.last_login_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                              : "never logged in"}
                          </div>
                          <ResetPasswordButton userId={u.id} />
                        </div>
                      ))
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <BankReveal
                      partnerId={p.id}
                      masked={
                        p.bank_sort_code && p.bank_account_number
                          ? `••-••-${p.bank_sort_code.slice(4)} · ••••${p.bank_account_number.slice(-4)}`
                          : null
                      }
                      changedRecently={
                        Boolean(p.bank_details_updated_at) &&
                        Date.parse(p.bank_details_updated_at!) > recentChangeCutoff
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    {!payable.has(p.id) ? (
                      <span className="text-xs text-slate-500">Nothing due</span>
                    ) : canBePaid(p) ? (
                      <MarkPaidForm
                        partnerId={p.id}
                        amount={formatPence(payable.get(p.id)!.total)}
                        count={payable.get(p.id)!.count}
                        today={today}
                      />
                    ) : (
                      <span className="text-xs text-slate-500">
                        {formatPence(payable.get(p.id)!.total)} — demo, not payable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {partners.length === 0 && !error && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-slate-500 text-sm text-center">
                    No partners yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>

        {/* Admin tools live below the record and start closed. They are how
            you change things; the table is why you came. */}
        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-900 marker:content-none">
            <span className="inline-flex items-center gap-2">
              <span className="text-slate-400 transition group-open:rotate-90">›</span>
              Admin tools
            </span>
            <span className="ml-2 font-normal text-slate-500">
              create a login, upload a resource, record bank details, add a playbook entry
            </span>
          </summary>
          <div className="space-y-6 border-t border-slate-100 p-5">
        <CreateUserForm partners={partners.map((p) => ({ id: p.id, gym_name: p.gym_name, slug: p.slug }))} />

        <UploadResourceForm partners={partners.map((p) => ({ id: p.id, gym_name: p.gym_name }))} />

        <SetContactForm
          partners={livePartners.map((p) => ({
            id: p.id,
            gym_name: p.gym_name,
            hasMobile: isUkMobile(p.contact_mobile),
          }))}
        />

        <SetBankForm
          partners={partners.map((p) => ({
            id: p.id,
            gym_name: p.gym_name,
            hasBank: Boolean(p.bank_sort_code && p.bank_account_number),
          }))}
        />

        <AddPlaybookForm />
          </div>
        </details>

        {/*
          `partners`, not `livePartners`, and it has to stay that way.

          PartnerLearners filters demo sales by looking their partner_id up in
          this list. It deliberately KEEPS a row whose partner it cannot resolve,
          because an unresolvable partner_id is a broken join worth seeing.
          Hand it a pre-filtered list and every demo sale becomes unresolvable,
          so the rule that is meant to hide them would put all eight back.
        */}
        <PartnerLearners
          partners={partners.map((p) => ({ id: p.id, slug: p.slug, gym_name: p.gym_name, is_demo: p.is_demo }))}
          sales={sales}
          payouts={payouts}
          selectedSlug={selectedSlug}
        />
      </div>
    </AdminPage>
  );
}
