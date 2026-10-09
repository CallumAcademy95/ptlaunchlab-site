import { test, expect, type APIRequestContext } from "@playwright/test";
import { BASE_URL, readTestSession, type Plan } from "./helpers";

// ════════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS
//
// Partner commission joins on `gym_slug`. It has to be written into BOTH the
// Checkout Session metadata AND subscription_data.metadata, because the monthly
// plan is a subscription and the instalment webhook only ever sees the latter.
// Attribution is the gym's own enrol page (gymSlug) — there are no codes.
//
// A slug written to session metadata alone looks completely fine — the sale
// lands, the partner is credited, the portal shows it — right up until the
// second instalment clears and the commission that should have been released
// belongs to nobody.
// ════════════════════════════════════════════════════════════════════════════

const SLUG = "hitio-orpington";

/**
 * Create a session and return its id.
 *
 * /api/checkout fails SOFT by design — a fallback returns HTTP 200 with
 * `{ url: null, reason }` so that a buyer is never blocked from paying. That
 * means res.ok() proves nothing at all here. The `id` is the only thing that
 * tells you a real Checkout Session was created rather than the caller being
 * quietly handed the raw Payment Link.
 */
async function createSession(
  request: APIRequestContext,
  plan: Plan,
  who: string,
): Promise<string> {
  const res = await request.post(`${BASE_URL}/api/checkout`, {
    data: {
      plan,
      email: `hitio-${who}@example.invalid`,
      name: `HITIO ${who} Test`,
      gymReferral: "HITIO Gym Orpington",
      gymSlug: SLUG,
    },
  });
  expect(res.ok()).toBe(true);
  const checkout = await res.json();
  expect(
    checkout.id,
    `checkout fell back to the raw Payment Link (reason: ${checkout.reason ?? "none given"})`,
  ).toBeTruthy();
  return checkout.id as string;
}

test.describe("HITIO Orpington attribution", () => {
  test("pay-in-full checkout carries gym_slug in session metadata", async ({ request }) => {
    const id = await createSession(request, "pif", "pif");

    const { body } = await readTestSession(id);
    expect(body.metadata?.gym_slug).toBe(SLUG);
    expect(body.metadata?.plan).toBe("PIF");
  });

  // subscription_data is a CREATE-only parameter, so an open session cannot
  // show subscription_data.metadata.gym_slug directly. mode === "subscription"
  // and metadata.payments === "10" are set from the same `monthly` branch of
  // buildSessionParams that writes subscription_data, so together they prove
  // the block was sent. They do NOT prove gym_slug specifically survived inside
  // it — tests/checkoutPlans.test.mts asserts that on the built params.
  test("monthly checkout is a 10-payment subscription with the slug attached", async ({ request }) => {
    const id = await createSession(request, "monthly", "monthly");

    const { body } = await readTestSession(id);

    expect(body.metadata?.gym_slug).toBe(SLUG);
    expect(body.metadata?.plan).toBe("monthly");
    expect(body.mode, "monthly did not become a subscription").toBe("subscription");
    expect(body.metadata?.payments, "payment count absent — subscription_data was not sent").toBe("10");
  });
});
