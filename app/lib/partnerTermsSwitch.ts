// When an EXISTING partner gym signs the current agreement at
// /gym-partnership/sign, move its partner record onto the terms it just signed,
// so nobody has to remember to do it by hand.
//
// Matching is by the email the gym signs with, against the partner's portal
// login (pp_partner_users.email) or its contact email (pp_partners.contact_email).
// Only an unambiguous match (exactly one non-demo partner) is switched. No match
// means a brand-new gym, whose record is created at onboarding with the new
// defaults already. Several matches means a human decides.
//
// What switches: agreement_version, agreement_signed_at, commission_terms and,
// unless the gym has a fee held under a separate deal, fee_per_learner_pence.
// Sales already made keep the commission they were stamped with, and learners on
// pre-October deposit plans keep the 2nd-instalment release rule (see
// commissionReleasedByPayment), so nothing already owed moves.

import { PARTNER_FEE_PENCE } from "./pricing.ts";
import { PARTNERSHIP_AGREEMENT_VERSION } from "./partnershipAgreement.ts";

/**
 * Gyms whose fee is held above the standard rate by a separate written deal.
 * They still move onto the new terms and payment timing; the fee is changed by
 * hand once the deal is used up.
 *
 *   atp-felixstowe — £500 for its first five learners (agreed at onboarding,
 *                    7 Oct 2026). Two used by 10 Oct. From 10 Oct 2026 ATP's
 *                    commission is set per rung of its own ladder
 *                    (app/lib/partnerCommission.ts ATP_LADDER), not by this fee.
 */
export const FEE_HELD_BY_DEAL: ReadonlySet<string> = new Set(["atp-felixstowe"]);

/**
 * The commission terms a gym moves onto when it signs agreement `version`.
 *
 *   4.0        → 'payment_5' (£250, PIF 30 days, monthly at payment 5)
 *   4.1 and up → 'ladder'    (same timing; amount by plan + quarterly volume)
 *
 * Follows the version actually signed, so a gym signing an older text is never
 * moved onto terms it did not sign.
 */
export function signedTermsFor(version: string): string {
  const [maj, min] = String(version).trim().split(".").map((n) => Number(n));
  if (!Number.isFinite(maj)) return "payment_5";
  if (maj > 4 || (maj === 4 && Number.isFinite(min) && min >= 1)) return "ladder";
  return "payment_5";
}

/** The terms the CURRENT agreement switches a signer onto. */
export const SIGNED_TERMS = signedTermsFor(PARTNERSHIP_AGREEMENT_VERSION);

export interface PartnerForSwitch {
  id: string;
  slug: string;
  fee_per_learner_pence: number;
  commission_terms: string | null;
  agreement_version: string | null;
}

export interface TermsUpdate {
  agreement_version: string;
  agreement_signed_at: string;
  commission_terms: string;
  fee_per_learner_pence?: number;
}

/** The fields to write for a partner that has just signed `version`. */
export function termsUpdateFor(partner: PartnerForSwitch, version: string, signedAtIso: string): TermsUpdate {
  const update: TermsUpdate = {
    agreement_version: version,
    agreement_signed_at: signedAtIso,
    commission_terms: signedTermsFor(version),
  };
  if (!FEE_HELD_BY_DEAL.has(partner.slug)) update.fee_per_learner_pence = PARTNER_FEE_PENCE;
  return update;
}

export type SwitchOutcome =
  | { kind: "switched"; slug: string; before: PartnerForSwitch; update: TermsUpdate }
  | { kind: "no-match" }
  | { kind: "ambiguous"; slugs: string[] }
  | { kind: "error"; message: string };

/** One line for the admin email, saying exactly what happened. */
export function describeOutcome(o: SwitchOutcome, repEmail: string): string {
  switch (o.kind) {
    case "switched": {
      const fee = o.update.fee_per_learner_pence === undefined
        ? `fee left at £${o.before.fee_per_learner_pence / 100} (held by a separate deal — change it by hand when that ends)`
        : `fee £${o.before.fee_per_learner_pence / 100} → £${o.update.fee_per_learner_pence / 100}`;
      return `Partner record switched automatically: ${o.slug} → v${o.update.agreement_version} terms (${o.update.commission_terms}), ${fee}. Sales already made are unchanged.`;
    }
    case "no-match":
      return `No existing partner uses ${repEmail}, so no partner record was changed. If this is an existing gym signing with a different email, switch it by hand.`;
    case "ambiguous":
      return `${repEmail} matches more than one partner (${o.slugs.join(", ")}), so nothing was changed. Switch the right one by hand.`;
    case "error":
      return `The automatic partner switch failed (${o.message}). Nothing may have changed: check the partner record by hand.`;
  }
}

// Minimal shape of the Supabase client calls used, so this stays testable.
type Db = {
  from(table: string): {
    select(cols: string): {
      ilike(col: string, val: string): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
      in(col: string, vals: string[]): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
    };
    update(values: Record<string, unknown>): {
      eq(col: string, val: string): PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

/** Find the partner that signed with `repEmail` and move it onto the signed terms. */
export async function switchSignedPartner(db: Db, repEmail: string, version: string, now = new Date()): Promise<SwitchOutcome> {
  try {
    const email = repEmail.trim();
    if (!email.includes("@")) return { kind: "no-match" };
    // ilike with no wildcards = case-insensitive equality; escape the two
    // pattern characters so an address can never act as a wildcard.
    const exact = email.replace(/[%_\\]/g, (c) => `\\${c}`);
    const cols = "id, slug, fee_per_learner_pence, commission_terms, agreement_version, is_demo";

    const users = await db.from("pp_partner_users").select("partner_id").ilike("email", exact);
    if (users.error) return { kind: "error", message: users.error.message };
    const byContact = await db.from("pp_partners").select(cols).ilike("contact_email", exact);
    if (byContact.error) return { kind: "error", message: byContact.error.message };

    const ids = new Set<string>([
      ...((users.data ?? []) as { partner_id: string }[]).map((u) => u.partner_id),
      ...((byContact.data ?? []) as { id: string }[]).map((p) => p.id),
    ]);
    if (ids.size === 0) return { kind: "no-match" };

    const r = await db.from("pp_partners").select(cols).in("id", [...ids]);
    if (r.error) return { kind: "error", message: r.error.message };
    const partners = ((r.data ?? []) as (PartnerForSwitch & { is_demo?: boolean })[]).filter((p) => !p.is_demo);
    if (partners.length === 0) return { kind: "no-match" };
    if (partners.length > 1) return { kind: "ambiguous", slugs: partners.map((p) => p.slug) };

    const before = partners[0];
    const update = termsUpdateFor(before, version, now.toISOString());
    const w = await db.from("pp_partners").update(update as unknown as Record<string, unknown>).eq("id", before.id);
    if (w.error) return { kind: "error", message: w.error.message };
    return { kind: "switched", slug: before.slug, before, update };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
