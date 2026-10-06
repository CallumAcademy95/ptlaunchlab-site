// tests/partnerDemo.test.mts
//
// WHAT THIS PROTECTS
//
// Money, and the number you'd act on.
//
// Northgate Strength is a demo partner. It carries eight learners on
// @example.invalid addresses and £4,000 of commission split across "paid" and
// "accruing" — none of it earned, none of it owed. The learner list used to
// render those rows at 60% opacity with a "(demo)" tag beside the gym name and
// count them like any other sale.
//
// That produced two concrete faults on screen at once:
//
//   1. The page's own stat tile read "11 Learners attributed to a gym" while
//      the list below it was headed "All gyms · 19". Same page, same data,
//      two answers, because the tile excluded demo and the list did not.
//
//   2. Four invented learners sat in the commission column reading "Due now" —
//      the identical wording, in the identical column, that a real payout is
//      read from before someone is paid.
//
// Styling was the only thing separating invented money from real money, which
// makes "did the reader notice the row was faint?" the control. It isn't one.
// These tests make exclusion a rule rather than an appearance.

import { test } from "node:test";
import assert from "node:assert/strict";
import { demoPartnerIds, withoutDemo } from "../app/admin/(shell)/partners/demo.ts";

const PARTNERS = [
  { id: "northgate", is_demo: true },
  { id: "ebor" },
  { id: "superflex", is_demo: false },
];

/** The shape the screenshot showed: 11 real learners, 8 invented ones. */
const SALES = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: `demo-${i}`, partner_id: "northgate" })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `ebor-${i}`, partner_id: "ebor" })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: `sf-${i}`, partner_id: "superflex" })),
];

test("a demo partner is identified, and a real one is not", () => {
  const ids = demoPartnerIds(PARTNERS);
  assert.ok(ids.has("northgate"));
  assert.equal(ids.has("ebor"), false, "is_demo absent must mean real, not unknown");
  assert.equal(ids.has("superflex"), false, "is_demo false must mean real");
});

test("every invented learner leaves the list", () => {
  const kept = withoutDemo(SALES, demoPartnerIds(PARTNERS));
  assert.equal(kept.length, 11, "19 sales minus Northgate's 8");
  assert.equal(
    kept.some((s) => s.partner_id === "northgate"),
    false,
    "a demo row must not survive, however it is styled",
  );
});

test("the count beside 'All gyms' is the count of what the list shows", () => {
  // The fault was a tile saying 11 above a chip saying 19. Both now derive
  // from the same filtered list, so they cannot disagree again.
  const kept = withoutDemo(SALES, demoPartnerIds(PARTNERS));
  assert.equal(kept.length, SALES.filter((s) => s.partner_id !== "northgate").length);
});

test("invented commission cannot reach a money column", () => {
  const rows = [
    { id: "a", partner_id: "northgate", commission_pence: 50_000, commission_status: "due" },
    { id: "b", partner_id: "ebor", commission_pence: 50_000, commission_status: "due" },
  ];
  const kept = withoutDemo(rows, demoPartnerIds(PARTNERS));
  const total = kept.reduce((sum, r) => sum + r.commission_pence, 0);
  assert.equal(total, 50_000, "only the real partner's commission may be totalled");
});

test("payouts are filtered by the same rule as sales", () => {
  // Payouts are a separate table and were a separate oversight. One demo
  // payout was being listed among six real ones.
  const payouts = [
    { id: "p1", partner_id: "northgate", total_pence: 150_000 },
    { id: "p2", partner_id: "ebor", total_pence: 150_000 },
  ];
  assert.deepEqual(
    withoutDemo(payouts, demoPartnerIds(PARTNERS)).map((p) => p.id),
    ["p2"],
  );
});

test("a row whose partner is unknown is kept, not hidden", () => {
  // Deliberate. An unresolvable partner_id is a broken join and should be
  // visible; hiding it would turn a data fault into a missing learner, and a
  // learner nobody can see is the more expensive of the two mistakes.
  const orphan = [{ id: "x", partner_id: "no-such-partner" }];
  assert.equal(withoutDemo(orphan, demoPartnerIds(PARTNERS)).length, 1);
});

test("pre-filtering the partner list would put every demo row back", () => {
  // The trap this guards.
  //
  // The partners INDEX now renders `livePartners` so the table matches the
  // tile. The obvious next tidy-up is to hand that same filtered list to
  // PartnerLearners. It must not happen: with Northgate absent from the list,
  // its eight sales resolve to no partner at all, and the "keep what you
  // cannot resolve" rule above then treats every one of them as a real
  // learner. The fix would quietly undo itself and the list would read 19.
  const preFiltered = PARTNERS.filter((p) => !p.is_demo);
  const kept = withoutDemo(SALES, demoPartnerIds(preFiltered));
  assert.equal(kept.length, 19, "demonstrates the regression, so nobody ships it");
  assert.equal(
    withoutDemo(SALES, demoPartnerIds(PARTNERS)).length,
    11,
    "the complete list is what makes the rule work",
  );
});

test("no demo partners means nothing is removed", () => {
  const realOnly = [{ id: "ebor" }, { id: "superflex", is_demo: false }];
  const ids = demoPartnerIds(realOnly);
  assert.equal(ids.size, 0);
  assert.equal(withoutDemo(SALES, ids).length, SALES.length);
});
