// Which partner rows are invented, and how to drop them.
//
// Demo partners exist so a walkthrough looks like a going concern: Northgate
// Strength carries eight learners on @example.invalid addresses and £4,000 of
// commission that nobody earned and nobody will be paid.
//
// The stat tiles on the partners index already excluded them. The learner list
// did not — it dimmed demo rows to 60% opacity and tagged them "(demo)", which
// still counted them ("All gyms · 19" against a tile reading 11) and still put
// "£500 Due now" in the same column a real payout is read from.
//
// Dimming is not excluding. In a money column the reader noticing is not a
// control, so the rule lives here as data rather than as styling, and is tested.

export interface MaybeDemoPartner {
  id: string;
  is_demo?: boolean;
}

export interface BelongsToPartner {
  partner_id: string;
}

/** Ids of the partners whose learners, commission and payouts are invented. */
export function demoPartnerIds(partners: MaybeDemoPartner[]): Set<string> {
  return new Set(partners.filter((p) => p.is_demo).map((p) => p.id));
}

/**
 * The same list with every invented row removed.
 *
 * A row whose partner_id matches no known partner is KEPT. An unknown partner
 * is a data problem worth seeing on screen; silently hiding it would turn a
 * missing join into a missing learner, which is the more expensive mistake.
 */
export function withoutDemo<T extends BelongsToPartner>(rows: T[], demoIds: Set<string>): T[] {
  return rows.filter((r) => !demoIds.has(r.partner_id));
}
