// Who may be paid.
//
// The demo tenant exists so a walkthrough looks like a going concern, which
// means it carries invented sales and invented commission. Every figure on
// the admin page already excludes it from the totals — but the "Mark paid"
// button sat on its row like any other, and the action behind it never asked.
// Pressing it would write a real pp_payouts row and flip real pp_sales rows
// to paid against money that was never earned and will never be sent.
//
// Kept pure and dependency-free so the rule can be tested directly and used
// by both the page (to not offer the button) and the action (to refuse it
// even if the form is replayed).

export interface PayeePartner {
  is_demo?: boolean | null;
  status?: string | null;
}

/**
 * Why this partner cannot be paid, or null if they can.
 *
 * Returns the sentence to show, rather than a boolean, so the page and the
 * action give the same reason instead of inventing one each.
 */
export function payoutRefusalReason(partner: PayeePartner): string | null {
  if (partner.is_demo) {
    return "This is the demo tenant. Its commission is invented and must never be paid.";
  }
  return null;
}

/** Convenience for the render path, where only the yes/no matters. */
export function canBePaid(partner: PayeePartner): boolean {
  return payoutRefusalReason(partner) === null;
}
