// tests/playbookTokens.test.mts
//
// WHAT THIS PROTECTS
//
// Ad copy is only worth shipping if it arrives with the gym's own name, town
// and promo code already in it — a gym owner will not do find-and-replace, and
// a placeholder left in a live Meta ad is worse than no ad at all.
//
// This substitution runs over ALL 48 existing playbook entries, so it must be
// inert on any entry that contains no tokens.

import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPlaybookTokens, tokensForGym } from "../app/lib/partner-playbook-tokens.ts";

const EBOR = {
  gymName: "Ebor Fitness",
  adTown: "York",
  promoCode: null,
  canonicalPath: "/ebor-fitness",
};
const HITIO = {
  gymName: "HITIO Gym Orpington",
  adTown: "Orpington",
  promoCode: "HITIOPT",
  canonicalPath: "/hitio-orpington-academy",
};

test("tokens are built from the gym's own brand entry", () => {
  assert.deepEqual(tokensForGym(HITIO, "https://ptlaunchlab.co.uk"), {
    gymName: "HITIO Gym Orpington",
    town: "Orpington",
    promoCode: "HITIOPT",
    academyUrl: "https://ptlaunchlab.co.uk/hitio-orpington-academy",
  });
});

test("every token is replaced, including repeats", () => {
  const out = applyPlaybookTokens(
    "Train at {{gymName}}. {{gymName}} is in {{town}}. Go to {{academyUrl}}.",
    tokensForGym(EBOR, "https://ptlaunchlab.co.uk"),
  );
  assert.equal(
    out,
    "Train at Ebor Fitness. Ebor Fitness is in York. Go to https://ptlaunchlab.co.uk/ebor-fitness.",
  );
});

test("a gym with no promo code drops the sentence rather than printing null", () => {
  // Ebor is grandfathered and has no code. "Use code null" would be shipped copy.
  const out = applyPlaybookTokens(
    "Places are open.{{#promoCode}} Use code {{promoCode}}.{{/promoCode}} See you there.",
    tokensForGym(EBOR, "https://ptlaunchlab.co.uk"),
  );
  assert.equal(out, "Places are open. See you there.");
});

test("a gym with a promo code keeps the sentence", () => {
  const out = applyPlaybookTokens(
    "Places are open.{{#promoCode}} Use code {{promoCode}}.{{/promoCode}} See you there.",
    tokensForGym(HITIO, "https://ptlaunchlab.co.uk"),
  );
  assert.equal(out, "Places are open. Use code HITIOPT. See you there.");
});

test("an entry with no tokens is returned byte-for-byte", () => {
  // 48 existing playbook entries go through this. It must be inert on them.
  const body = "## The week\n\n- Guest passes for members to bring someone\n";
  assert.equal(applyPlaybookTokens(body, tokensForGym(EBOR, "https://ptlaunchlab.co.uk")), body);
});

test("an unknown token is left alone rather than blanked", () => {
  // Better a visible {{whatever}} in review than a silently empty sentence live.
  const body = "Ask {{someoneElse}} about it.";
  assert.equal(applyPlaybookTokens(body, tokensForGym(EBOR, "https://ptlaunchlab.co.uk")), body);
});
