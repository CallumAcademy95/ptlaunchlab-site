import { test, expect, type APIRequestContext } from "@playwright/test";
import { BASE_URL, PAYMENT_LINKS, readTestSession } from "./helpers";

// ════════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS
//
// Partner commission joins on `gym_slug`. It has to be written into BOTH the
// Checkout Session metadata AND subscription_data.metadata, because a deposit
// plan is a subscription and the instalment webhook only ever sees the latter.
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
  paymentLink: string,
  who: string,
): Promise<string> {
  const res = await request.post(`${BASE_URL}/api/checkout`, {
    data: {
      paymentLink,
      email: `hitio-${who}@example.invalid`,
      name: `HITIO ${who} Test`,
      gymReferral: "HITIO Gym Orpington",
      gymSlug: SLUG,
      promoCode: "HITIOPT",
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
    const id = await createSession(request, PAYMENT_LINKS.pif, "pif");

    const { body } = await readTestSession(id);
    expect(body.metadata?.gym_slug).toBe(SLUG);
    expect(body.metadata?.plan).toBe("PIF");
  });

  // WHAT THIS PROVES, AND WHAT IT DOES NOT
  //
  // subscription_data is a CREATE-only parameter. Retrieving a Checkout
  // Session does not return it, and `subscription` is null until the payment
  // actually completes — so there is nothing to read back on an open session
  // that would show subscription_data.metadata.gym_slug directly.
  //
  // In createCheckoutSession a single flag, `withInstalments`, gates BOTH
  // `mode: "subscription"` and the `subscription_data.metadata` block
  // (app/lib/stripeCheckout.ts:338-365), and `metadata.instalments` is set
  // from the same condition. So mode === "subscription" AND
  // metadata.instalments set together prove the subscription_data block was
  // sent at all — that a real instalment mandate was requested.
  //
  // What this does NOT prove: that gym_slug specifically survived inside
  // that block. subscription_data.metadata.gym_slug (~line 360) and the
  // top-level metadata.gym_slug (~line 381) are two independent
  // object-literal entries, both gated by withInstalments but not linked to
  // each other. A regression that deletes only the nested gym_slug line —
  // leaving instalments_target, buyer_name, mode, and top-level metadata all
  // intact — would pass every assertion below undetected. Closing that gap
  // for real needs a completed test-mode deposit payment plus
  // getSubscription() to read the subscription back post-payment, which is
  // heavier than this task warrants.
  test("deposit checkout takes the instalment-mandate path with the slug attached", async ({ request }) => {
    const id = await createSession(request, PAYMENT_LINKS.deposit, "deposit");

    const { body } = await readTestSession(id);

    expect(body.metadata?.gym_slug).toBe(SLUG);
    expect(body.metadata?.plan).toBe("deposit");

    // Both come from `withInstalments`, the same flag that attaches
    // subscription_data.metadata. Without that block the instalment webhook
    // cannot attribute the sale, and the commission released at instalment 2
    // belongs to nobody.
    expect(body.mode, "deposit did not become a subscription — no instalment mandate").toBe(
      "subscription",
    );
    expect(
      body.metadata?.instalments,
      "instalment count absent — subscription_data was not sent",
    ).toBeTruthy();
  });
});
