import { test } from "node:test";
import assert from "node:assert/strict";
import { switchSignedPartner, termsUpdateFor, describeOutcome } from "../app/lib/partnerTermsSwitch.ts";

type Row = Record<string, unknown>;
function fakeDb(tables: { users: Row[]; partners: Row[] }) {
  const writes: { id: string; values: Row }[] = [];
  const ci = (a: unknown, b: string) => typeof a === "string" && a.toLowerCase() === b.replace(/\\(.)/g, "$1").toLowerCase();
  const db = {
    from(table: string) {
      const rows = table === "pp_partner_users" ? tables.users : tables.partners;
      return {
        select(_cols: string) {
          return {
            ilike: async (col: string, val: string) => ({ data: rows.filter((r) => ci(r[col], val)), error: null }),
            in: async (col: string, vals: string[]) => ({ data: rows.filter((r) => vals.includes(r[col] as string)), error: null }),
          };
        },
        update(values: Row) {
          return { eq: async (_col: string, id: string) => { writes.push({ id, values }); return { error: null }; } };
        },
      };
    },
  };
  return { db, writes };
}

const partner = (id: string, slug: string, extra: Row = {}) => ({
  id, slug, fee_per_learner_pence: 50000, commission_terms: "on_enrolment", agreement_version: null, is_demo: false, contact_email: null, ...extra,
});

test("an existing gym signing with its portal email is switched to £250 + payment_5 + v4.0", async () => {
  const { db, writes } = fakeDb({ users: [{ partner_id: "p1", email: "Owner@Ebor.com" }], partners: [partner("p1", "ebor")] });
  const o = await switchSignedPartner(db as never, "owner@ebor.com", "4.0", new Date("2026-10-12T09:00:00Z"));
  assert.equal(o.kind, "switched");
  assert.deepEqual(writes, [{ id: "p1", values: { agreement_version: "4.0", agreement_signed_at: "2026-10-12T09:00:00.000Z", commission_terms: "payment_5", fee_per_learner_pence: 25000 } }]);
  assert.match(describeOutcome(o, "owner@ebor.com"), /ebor → v4\.0.*£500 → £250/);
});

test("matching on the contact email works too", async () => {
  const { db, writes } = fakeDb({ users: [], partners: [partner("p2", "hitio-orpington", { contact_email: "m@hitiogym.com" })] });
  const o = await switchSignedPartner(db as never, "M@HITIOGYM.COM", "4.0");
  assert.equal(o.kind, "switched");
  assert.equal(writes.length, 1);
});

test("ATP moves to the new terms but keeps its £500 deal fee", async () => {
  const p = partner("p3", "atp-felixstowe", { commission_terms: "instalment_2" });
  assert.equal(termsUpdateFor(p, "4.0", "x").fee_per_learner_pence, undefined);
  const { db, writes } = fakeDb({ users: [{ partner_id: "p3", email: "g@atp.com" }], partners: [p] });
  const o = await switchSignedPartner(db as never, "g@atp.com", "4.0");
  assert.equal(o.kind, "switched");
  assert.equal("fee_per_learner_pence" in writes[0].values, false);
  assert.match(describeOutcome(o, "g@atp.com"), /fee left at £500/);
});

test("an email no partner uses changes nothing (a brand-new gym)", async () => {
  const { db, writes } = fakeDb({ users: [], partners: [partner("p1", "ebor")] });
  assert.equal((await switchSignedPartner(db as never, "new@gym.com", "4.0")).kind, "no-match");
  assert.equal(writes.length, 0);
});

test("an email that matches two partners changes nothing", async () => {
  const { db, writes } = fakeDb({
    users: [{ partner_id: "p1", email: "x@y.com" }, { partner_id: "p2", email: "x@y.com" }],
    partners: [partner("p1", "ebor"), partner("p2", "mof")],
  });
  const o = await switchSignedPartner(db as never, "x@y.com", "4.0");
  assert.equal(o.kind, "ambiguous");
  assert.equal(writes.length, 0);
});

test("the demo partner is never switched", async () => {
  const { db, writes } = fakeDb({ users: [{ partner_id: "d", email: "demo@x.com" }], partners: [partner("d", "demo", { is_demo: true })] });
  assert.equal((await switchSignedPartner(db as never, "demo@x.com", "4.0")).kind, "no-match");
  assert.equal(writes.length, 0);
});

test("a % or _ in the address cannot act as a wildcard", async () => {
  const { db, writes } = fakeDb({ users: [{ partner_id: "p1", email: "ab@c.com" }], partners: [partner("p1", "ebor")] });
  assert.equal((await switchSignedPartner(db as never, "a%@c.com", "4.0")).kind, "no-match");
  assert.equal(writes.length, 0);
});
