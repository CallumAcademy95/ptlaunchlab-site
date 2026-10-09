// Writing partner sales into pp_sales.
//
// Source of truth for everything the partner portal shows about enrolments and
// commission. Sits alongside the existing Make → Google Sheet tracker rather
// than replacing it — the Sheet is an ops mirror and stays exactly as it is.
//
// Every write here is idempotent on stripe_session_id, because Stripe webhooks
// are at-least-once and a retried delivery must not create a second sale or pay
// a second commission.

import { getSupabaseAdmin } from "./supabase-admin";
import { contractTotalPence, isDepositSale } from "./coursePlan";
import {
  commissionHeldAtSale,
  commissionReleasedByPayment,
  type SubscriptionPlanKind,
} from "./paymentPlans";

// The deposit-vs-PIF rule lives in ./coursePlan (unit-tested, no dependencies)
// so the portal, the Sheet tracker and every email answer it identically. It
// used to be duplicated, and the copies drifted: the emails kept an
// `amount >= 1300` test long after this file stopped using one, and called a
// settled £1,099 partner pay-in-full a deposit.
export { isDepositSale };

export interface PartnerSaleInput {
  stripeSessionId: string;
  stripeSubscriptionId?: string | null;
  /** Stable slug from metadata.gym_slug or the `gyms` key in client_reference_id. */
  gymSlug?: string | null;
  /** Free-text display name — the only attribution older sales carry. */
  gymDisplayName?: string | null;
  learnerName?: string | null;
  learnerEmail?: string | null;
  amountTotalPence: number;
  /**
   * `metadata.contract_value` in PENCE — what the learner owes in total.
   * £1,599 on the standard deposit plan. Absent on older sales, which are all
   * £1,599 plans, so the fallback is correct rather than merely safe.
   */
  contractValuePence?: number | null;
  /** Stripe checkout mode. "subscription" always means a deposit plan. */
  mode?: string | null;
  /** `metadata.plan` off the session — the deposit-vs-PIF signal a promo code cannot move. */
  metadataPlan?: string | null;
  promoCode?: string | null;
  enrolledAt?: Date;
}

/** What `_gym-template` ships with. A live page carrying this is a mistake. */
export const PLACEHOLDER_SLUG = "GYM-SLUG-HERE";

/**
 * Resolve a partner from the slug, falling back to the legacy display name.
 *
 * The slug is exact and safe. The display-name match exists only for sales made
 * before gym_slug shipped (2026-07-27) and for the backfill — it is why
 * pp_partners.legacy_referral_names exists.
 */
async function resolvePartner(
  gymSlug?: string | null,
  gymDisplayName?: string | null
): Promise<{ id: string; fee_per_learner_pence: number; commission_terms: string; payout_terms_days: number } | null> {
  const admin = getSupabaseAdmin();
  const columns = "id, fee_per_learner_pence, commission_terms, payout_terms_days";

  // A gym page copied from _gym-template without editing its config ships this
  // literal placeholder. Treat it as no attribution rather than letting it
  // reach the lookup and read as a mystery partner.
  if (gymSlug === PLACEHOLDER_SLUG) {
    console.error(
      "[partner-sales] a live enrol page is still using the _gym-template placeholder slug — its sales are unattributed"
    );
    gymSlug = null;
  }

  if (gymSlug) {
    const { data } = await admin.from("pp_partners").select(columns).eq("slug", gymSlug).maybeSingle();
    if (data) return data as never;
  }

  const name = gymDisplayName?.trim();
  if (name) {
    // `cs` = contains, on the text[] of historical display names.
    const { data } = await admin
      .from("pp_partners")
      .select(columns)
      .contains("legacy_referral_names", [name])
      .maybeSingle();
    if (data) return data as never;
  }

  return null;
}

/**
 * When the commission on a sale becomes payable.
 *
 * Grandfathered partners ('on_enrolment') keep the terms they signed: 30 days
 * after enrolment, whatever the plan. Partners on the 2026-07-27 terms
 * ('instalment_2') and the v4.0 terms ('payment_5') get the same for
 * pay-in-full, but a payment-plan sale returns null — it stays held until the
 * 2nd instalment / 5th payment clears, at which point
 * applyInstalmentToPartnerSale stamps the date. See app/lib/paymentPlans.ts.
 */
function commissionReleaseAt(
  terms: string,
  isDeposit: boolean,
  enrolledAt: Date,
  payoutTermsDays: number
): string | null {
  if (commissionHeldAtSale(terms, isDeposit)) return null;
  const release = new Date(enrolledAt);
  release.setUTCDate(release.getUTCDate() + payoutTermsDays);
  return release.toISOString();
}

/**
 * Upsert the sale behind a completed checkout. Returns what happened, for logs.
 *
 * Never throws — a failure here must not take down the webhook and cost us the
 * GA4, Meta CAPI and Sheet writes that run alongside it.
 */
export async function recordPartnerSale(
  input: PartnerSaleInput
): Promise<{ ok: boolean; reason: string }> {
  try {
    const partner = await resolvePartner(input.gymSlug, input.gymDisplayName);
    if (!partner) {
      // A sale with no gym at all is a direct sale — normal, and silent.
      if (!input.gymSlug && !input.gymDisplayName) return { ok: true, reason: "no-gym" };

      // A sale that names a gym we can't resolve is different: someone is owed
      // a partner fee and nothing will show it. Loud, because the fix is a one-line
      // addition to pp_partners.legacy_referral_names and nobody will make it
      // if this only ever appears as a return value.
      console.error(
        `[partner-sales] UNATTRIBUTED SALE ${input.stripeSessionId} — no partner matches ` +
        `slug "${input.gymSlug ?? "-"}" or name "${input.gymDisplayName ?? "-"}". ` +
        `Add it to pp_partners.legacy_referral_names and re-run the backfill.`
      );
      return { ok: true, reason: "unknown-partner" };
    }

    const enrolledAt = input.enrolledAt ?? new Date();

    const isDeposit = isDepositSale(input);

    const row = {
      partner_id: partner.id,
      stripe_session_id: input.stripeSessionId,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      learner_name: input.learnerName || null,
      learner_email: input.learnerEmail || null,
      plan_type: isDeposit ? "deposit" : "PIF",
      amount_paid_pence: input.amountTotalPence,
      amount_due_pence: isDeposit ? contractTotalPence(input) : input.amountTotalPence,
      promo_code: input.promoCode || null,
      status: "confirmed",
      commission_pence: partner.fee_per_learner_pence,
      commission_status: "accruing",
      commission_release_at: commissionReleaseAt(
        partner.commission_terms,
        isDeposit,
        enrolledAt,
        partner.payout_terms_days
      ),
      enrolled_at: enrolledAt.toISOString(),
    };

    // ignoreDuplicates: a redelivered webhook must not reset amount_paid_pence
    // back to the deposit after instalments have already been credited.
    const { error } = await getSupabaseAdmin()
      .from("pp_sales")
      .upsert(row, { onConflict: "stripe_session_id", ignoreDuplicates: true });

    if (error) {
      console.error("[partner-sales] pp_sales upsert failed:", error);
      return { ok: false, reason: error.message };
    }
    return { ok: true, reason: "recorded" };
  } catch (err) {
    console.error("[partner-sales] recordPartnerSale threw:", err);
    return { ok: false, reason: String(err) };
  }
}

/**
 * Credit a payment against a payment-plan sale, and release a held commission
 * when the partner's terms say so ('instalment_2' → 2nd instalment, 'payment_5'
 * → the learner's 5th payment, checkout payment counted as 1).
 *
 * `settled` is the recomputed-from-Stripe count the webhook already derives —
 * legacy instalments (deposit excluded) for kind 'legacy', every payment for
 * kind 'monthly' — deliberately reused rather than incremented here, so a
 * duplicate delivery cannot advance it. `collectedPence` is likewise derived
 * from that count by the webhook (paymentPlans.collectedPence).
 */
export async function applyInstalmentToPartnerSale(args: {
  subscriptionId: string;
  kind: SubscriptionPlanKind;
  settled: number;
  collectedPence: number;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();

    const { data: sale, error } = await admin
      .from("pp_sales")
      .select("id, commission_status, commission_release_at, partner_id, enrolled_at")
      .eq("stripe_subscription_id", args.subscriptionId)
      .maybeSingle();

    if (error) {
      console.error("[partner-sales] instalment lookup failed:", error);
      return;
    }
    // No row is the normal case: most instalment plans are direct sales with no
    // gym behind them.
    if (!sale) return;

    // Recomputed from the payment count rather than added to, so a redelivered
    // invoice.paid cannot inflate what the partner sees as collected. Used to be
    // a hardcoded 59_900 + n × 20_000, wrong for every £99 entry, every £300
    // instalment and the whole monthly plan.
    const update: Record<string, unknown> = { amount_paid_pence: args.collectedPence };

    // Release a held commission once the partner's trigger payment has cleared —
    // but only for a sale still waiting on one. A grandfathered partner, or a
    // sale already released, already has a date and is left alone.
    if (!sale.commission_release_at) {
      const { data: partner } = await admin
        .from("pp_partners")
        .select("payout_terms_days, commission_terms")
        .eq("id", sale.partner_id)
        .maybeSingle();

      const terms = String(partner?.commission_terms ?? "instalment_2");
      if (commissionReleasedByPayment(terms, args.kind, args.settled)) {
        // payment_5 releases on the 5th payment itself — no further wait: the
        // fee is payable from that point. instalment_2 keeps its old rule of
        // payout_terms_days after the trigger.
        const release = new Date();
        if (terms !== "payment_5") {
          release.setUTCDate(release.getUTCDate() + Number(partner?.payout_terms_days ?? 30));
        }
        update.commission_release_at = release.toISOString();

        console.log(
          `[partner-sales] ${terms} trigger reached for ${args.subscriptionId} (${args.kind}, ${args.settled} settled) — commission releases ${release.toISOString().slice(0, 10)}`
        );
      }
    }

    const { error: updateError } = await admin.from("pp_sales").update(update).eq("id", sale.id);
    if (updateError) console.error("[partner-sales] instalment update failed:", updateError);
  } catch (err) {
    console.error("[partner-sales] applyInstalmentToPartnerSale threw:", err);
  }
}
