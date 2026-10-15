// tests/checkoutHeardAbout.test.mts
//
// WHAT THIS PROTECTS
//
// Non-gym checkouts ask "How did you hear about us?" (a required Stripe
// dropdown) so sales with no gym and no ad tag still record a source. Gym
// checkouts never ask: they're already attributed by gym_slug and the partner
// portal. Stripe only accepts alphanumeric option values, so a stray "_" here
// would take checkout down.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSessionParams, COURSE_PLANS, HEARD_ABOUT_FIELD } from "../app/lib/stripeCheckout.ts";

const opts = { cancelPath: "/enrol" };
type Field = { key: string; optional: boolean; type: string; label: { custom: string }; dropdown: { options: { value: string; label: string }[] } };

test("a non-gym checkout carries the required heard-about dropdown (pay in full and monthly)", () => {
  for (const [plan, cfg] of [["pif", COURSE_PLANS.pif], ["monthly", COURSE_PLANS.monthly]] as const) {
    const p = buildSessionParams({ plan, email: "a@b.com" }, cfg, opts) as { custom_fields?: Field[] };
    assert.equal(p.custom_fields?.length, 1, plan);
    const f = p.custom_fields![0];
    assert.equal(f.key, "heardabout");
    assert.equal(f.type, "dropdown");
    assert.equal(f.optional, false);
    assert.equal(f.label.custom, "How did you hear about us?");
  }
});

test("a gym checkout never asks (already attributed by gym_slug)", () => {
  const p = buildSessionParams({ plan: "pif", email: "a@b.com", gymSlug: "6fit" }, COURSE_PLANS.pif, opts) as { custom_fields?: unknown };
  assert.equal(p.custom_fields, undefined);
});

test("options are Stripe-valid: alphanumeric values, labels set, partner gym first", () => {
  const opts2 = HEARD_ABOUT_FIELD.dropdown.options;
  assert.ok(opts2.length >= 2 && opts2.length <= 200);
  for (const o of opts2) {
    assert.match(o.value, /^[a-zA-Z0-9]{1,100}$/);
    assert.ok(o.label.length > 0 && o.label.length <= 100);
  }
  assert.equal(opts2[0].value, "partnergym");
  assert.ok(HEARD_ABOUT_FIELD.label.custom.length <= 50);
});
