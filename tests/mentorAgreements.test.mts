// tests/mentorAgreements.test.mts
//
// WHAT THIS PROTECTS
//
// The mentor agreements the signing flow issues (app/lib/mentorAgreements.ts):
//   - the Axis mentorship agreement is unchanged by adding a second kind, and
//     is still what an unlabelled signing request gets;
//   - the PT Mentor Hub package agreement carries the commercial terms Callum
//     set on 16 Nov 2026 (pay in full £999.99, £500 per learner released when
//     the 14-day cooling-off ends and paid within 7 days, exclusivity);
//   - the Commitment terms published to learners are Schedule 1 of the signed
//     agreement word for word, so the advertised promise can't drift from the
//     signed one;
//   - every key term shown before signing points at a clause that exists.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MENTOR_AGREEMENTS, parseMentorAgreementKind } from "../app/lib/mentorAgreements.ts";
import { COMMITMENT_TERMS } from "../app/lib/mentorPackageAgreement.ts";

const party = {
  businessName: "PT Mentor Hub",
  companyNumber: "",
  address: "1 Test Street, Cardiff CF10 1AA",
  repName: "Luke Test",
  repEmail: "luke@example.com",
  signedDate: "16 November 2026",
};

const text = (kind: "mentorship" | "package") =>
  MENTOR_AGREEMENTS[kind]
    .buildClauses(party)
    .flatMap((c) => [c.title, ...c.blocks.map((b) => b.text)])
    .join("\n");

test("an unlabelled or unknown request is the original mentorship agreement", () => {
  assert.equal(parseMentorAgreementKind(undefined), "mentorship");
  assert.equal(parseMentorAgreementKind("nonsense"), "mentorship");
  assert.equal(parseMentorAgreementKind("package"), "package");
});

test("the Axis mentorship agreement keeps its terms", () => {
  const a = MENTOR_AGREEMENTS.mentorship;
  assert.equal(a.version, "1.0");
  assert.equal(a.title, "Business Mentorship Partner Agreement");
  assert.match(text("mentorship"), /£40 for the included 1:1 call/);
  assert.doesNotMatch(text("mentorship"), /Package Sale/);
});

test("the package agreement carries the agreed commercial terms", () => {
  const t = text("package");
  assert.match(t, /at £999\.99 paid in full\. No monthly or instalment plan/);
  assert.match(t, /£500 for each learner who buys the Package/);
  assert.match(t, /released when the learner’s 14-day cooling-off period ends/);
  assert.match(t, /within 7 days of release/);
  assert.match(t, /shall not, directly or indirectly, promote, or enter into any partnership/);
  assert.match(t, /never entitles a learner to a refund/);
  assert.match(t, /trading as PT Mentor Hub, of 1 Test Street/);
  assert.match(t, /Mentor Partner at luke@example\.com/);
});

test("the published Commitment terms are Schedule 1, word for word", () => {
  const clauses = MENTOR_AGREEMENTS.package.buildClauses(party);
  const schedule = clauses.find((c) => c.number === "Schedule 1");
  assert.ok(schedule, "Schedule 1 exists");
  assert.deepEqual(
    schedule.blocks.map((b) => b.text),
    COMMITMENT_TERMS.map((t) => `${t.title}: ${t.text}`)
  );
  // The public page renders the same constant rather than its own copy.
  const page = readFileSync("app/pt-mentor-hub-academy/commitment-terms/page.tsx", "utf8");
  assert.match(page, /import \{ COMMITMENT_TERMS \} from "@\/app\/lib\/mentorPackageAgreement"/);
  // And the landing page's "Terms apply" links to it.
  const landing = readFileSync("app/pt-mentor-hub-academy/page.tsx", "utf8");
  assert.match(landing, /href="\/pt-mentor-hub-academy\/commitment-terms"/);
});

test("the Commitment never reads as an income guarantee or a refund", () => {
  const all = COMMITMENT_TERMS.map((t) => t.text).join(" ");
  assert.match(all, /does not guarantee employment, clients or income/);
  assert.match(all, /not a refund/);
  assert.match(all, /14-day cooling-off right/);
});

test("every key term points at a clause that exists", () => {
  for (const kind of ["mentorship", "package"] as const) {
    const numbers = new Set(MENTOR_AGREEMENTS[kind].buildClauses(party).map((c) => c.number));
    for (const k of MENTOR_AGREEMENTS[kind].keyTerms) {
      for (const n of k.clause.match(/\d+/g) ?? []) {
        assert.ok(numbers.has(n), `${kind}: key term "${k.title}" cites Clause ${n}`);
      }
    }
  }
});

test("the signing page sends which agreement it is, and the route reads it", () => {
  const form = readFileSync("app/mentor-partnership/MentorSignForm.tsx", "utf8");
  assert.match(form, /agreement: kind,/);
  assert.match(readFileSync("app/mentor-partnership/package/sign/page.tsx", "utf8"), /kind="package"/);
  assert.match(readFileSync("app/mentor-partnership/sign/page.tsx", "utf8"), /kind="mentorship"/);
  const route = readFileSync("app/api/mentor-partnership/sign/route.ts", "utf8");
  assert.match(route, /parseMentorAgreementKind\(body\.agreement\)/);
});
