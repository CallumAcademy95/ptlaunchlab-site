// tests/mentorPortal.test.mts
//
// WHAT THIS PROTECTS
//
// The partner portal for a mentor partner (PT Mentor Hub, Nov 2026), who is
// not a gym:
//   - his payout wording matches his signed Mentor Package agreement (cl. 3.3-
//     3.4): released when the 14-day cooling-off ends, paid within 7 days, and
//     NOT the gym wording ("30 days", monthly payments, "not clawed back");
//   - his playbook is his own folder, keeps to the agreement's marketing rules
//     (cl. 5.2: no finance or instalment wording, no promised results, gym
//     permission before promoting in a gym), and never leaks into the gyms'
//     playbook;
//   - the portal hides the gym-only bits from him (October campaign, shared gym
//     resources) and leaves every gym's portal as it was.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { commissionReleaseRule } from "../app/lib/partnerCommission.ts";
import { isMentorPartner, MENTOR_PARTNERS } from "../app/lib/partnerKind.ts";
import { PAY_IN_FULL_ONLY_PARTNERS } from "../app/lib/pricing.ts";
import { PLAYBOOK_TYPES } from "../app/lib/partner-playbook-types.ts";
import { extractSnippets } from "../app/lib/partner-playbook-snippets.ts";

test("PT Mentor Hub is a mentor partner, and every mentor partner is pay-in-full only", () => {
  assert.equal(isMentorPartner("pt-mentor-hub"), true);
  assert.equal(isMentorPartner("mclub"), false);
  assert.equal(isMentorPartner(null), false);
  for (const slug of MENTOR_PARTNERS) assert.ok(PAY_IN_FULL_ONLY_PARTNERS.includes(slug), slug);
});

test("a mentor's payout wording follows his agreement, not the gym wording", () => {
  const rule = commissionReleaseRule("payment_5", { mentorPackage: true, payoutTermsDays: 14 });
  assert.match(rule, /released 14 days after the learner enrols/);
  assert.match(rule, /cooling-off/);
  assert.match(rule, /within 7 days/);
  assert.doesNotMatch(rule, /30 days|monthly|instal|clawed/i);
});

test("gym partners keep their wording", () => {
  assert.match(commissionReleaseRule("payment_5"), /30 days after they enrol[\s\S]*5th monthly payment/);
  assert.equal(commissionReleaseRule("payment_5", { mentorPackage: false, payoutTermsDays: 14 }), commissionReleaseRule("payment_5"));
});

const DIR = new URL("../partner-playbook/partners/pt-mentor-hub/", import.meta.url);
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".md"));
const read = (f: string) => readFileSync(new URL(f, DIR), "utf8");
const meta = (raw: string) => {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(m, "has frontmatter");
  return Object.fromEntries(
    m[1].split(/\r?\n/).map((l) => l.match(/^([a-z_]+):\s*(.*)$/i)).filter(Boolean).map((kv) => [kv![1], kv![2]])
  );
};

test("his playbook has entries, each with a title, a known section and something to copy", () => {
  assert.ok(FILES.length >= 6, `found ${FILES.length}`);
  for (const f of FILES) {
    const raw = read(f);
    const m = meta(raw);
    assert.ok(m.title, `${f} title`);
    assert.ok(PLAYBOOK_TYPES.some((t) => t.key === m.type), `${f} type ${m.type}`);
    assert.ok(extractSnippets(raw.replace(/^---[\s\S]*?---/, "")).length > 0, `${f} has a copy panel`);
    assert.doesNotMatch(raw, /\{\{/, `${f} has no unfilled tokens`);
  }
});

const ALL = FILES.map(read).join("\n");

test("his playbook never offers finance, instalments or a monthly plan (cl. 5.2)", () => {
  assert.doesNotMatch(ALL, /monthly (plan|payment|instal)|instal?ments?|pay later|pay in 3|interest[- ]free|finance|klarna|payl8r|£99(?!\d)/i);
});

test("the Commitment always says Terms apply and is never money back", () => {
  const commitment = FILES.map(read).filter((r) => /earn back your investment/.test(r));
  assert.ok(commitment.length > 0);
  for (const r of commitment) {
    assert.match(r, /Terms apply/);
    assert.match(r, /\/pt-mentor-hub-academy\/commitment-terms/);
  }
  assert.doesNotMatch(ALL, /money[- ]back|refund|guarantee/i);
});

test("client results always say they are individual", () => {
  const results = FILES.map(read).filter((r) => /£990|£750/.test(r));
  assert.ok(results.length > 0);
  for (const r of results) assert.match(r, /individual results/i);
});

test("promoting in a gym says to get the gym's OK first (cl. 5.2)", () => {
  const gym = FILES.map(read).filter((r) => /poster/i.test(r));
  assert.ok(gym.length > 0);
  for (const r of gym) assert.match(r, /gym manager first|gym's OK|permission/i);
});

test("his playbook is out of the gyms' listing: it lives in a subfolder the gym loader never reads", () => {
  const top = readdirSync(new URL("../partner-playbook/", import.meta.url));
  for (const f of FILES) assert.ok(!top.includes(f), `${f} is not a top-level gym entry`);
  const loader = readFileSync("app/lib/partner-playbook.ts", "utf8");
  assert.match(loader, /readdir\(dir\)\)\.filter\(\(f\) => f\.endsWith\("\.md"\)\)/, "gym listing is top-level .md only");
  assert.match(loader, /if \(isMentorPartner\(opts\.partnerSlug\)\)/);
  const config = readFileSync("next.config.ts", "utf8");
  assert.match(config, /"\/partners\/playbook": \["\.\/partner-playbook\/\*\*\/\*\.md"\]/, "subfolder ships to Vercel");
});

test("wiring: the portal hides the gym-only parts from a mentor", () => {
  const layout = readFileSync("app/partners/(portal)/layout.tsx", "utf8");
  assert.match(layout, /<PartnerNav mentor=\{isMentorPartner\(partner\.slug\)\} \/>/);
  const nav = readFileSync("app/partners/(portal)/PartnerNav.tsx", "utf8");
  assert.match(nav, /mentor \? LINKS\.filter\(\(l\) => l\.href !== "\/partners\/october"\)/);
  const october = readFileSync("app/partners/(portal)/october/page.tsx", "utf8");
  assert.match(october, /if \(isMentorPartner\(partner\.slug\)\) redirect\("\/partners"\)/);
  const resources = readFileSync("app/partners/(portal)/resources/page.tsx", "utf8");
  assert.match(resources, /getPartnerResources\(partner\.id, \{ ownOnly: mentor \}\)/);
  for (const page of ["page.tsx", "payments/page.tsx", "sales/page.tsx"]) {
    const src = readFileSync(`app/partners/(portal)/${page}`, "utf8");
    assert.doesNotMatch(src, /commissionReleaseRule\(partner\.commission_terms\)/, `${page} passes the mentor terms`);
  }
  const auth = readFileSync("app/lib/partner-auth.ts", "utf8");
  assert.match(auth, /commission_terms, payout_terms_days\)/, "the session loads payout_terms_days");
});
