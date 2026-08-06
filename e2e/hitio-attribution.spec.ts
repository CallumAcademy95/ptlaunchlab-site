import { test, expect, type APIRequestContext } from "@playwright/test";
import { BASE_URL, readTestSession } from "./helpers";

// `StripeSession` in helpers.ts does not declare `mode` — it was written for
// the redirect tests, which never needed it. Widen locally rather than editing
// the shared type, so this spec cannot change what the existing specs see.
type SessionWithMode = { mode?: string; metadata?: Record<string, string> };

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
    const id = await createSession(
      request,
      "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      "pif",
    );

    const { body } = await readTestSession(id);
    expect(body.metadata?.gym_slug).toBe(SLUG);
    expect(body.metadata?.plan).toBe("PIF");
  });

  // WHY THIS ASSERTS A PROXY, AND NOT subscription_data DIRECTLY
  //
  // subscription_data is a CREATE-only parameter. Retrieving a Checkout
  // Session does not return it, and `subscription` is null until the payment
  // actually completes — so there is nothing to read back on an open session.
  //
  // In createCheckoutSession a single flag, `withInstalments`, gates BOTH
  // `mode: "subscription"` and the `subscription_data.metadata` block
  // (app/lib/stripeCheckout.ts:338-365), and `metadata.instalments` is set
  // from the same condition. So a session that comes back with
  // mode === "subscription" AND metadata.instalments set is proof that the
  // subscription_data block was sent with it. Asserting the proxy is honest
  // here; asserting subscription_data directly would be asserting a field
  // Stripe never returns, which passes or fails for the wrong reasons.
  test("deposit checkout takes the instalment-mandate path with the slug attached", async ({ request }) => {
    const id = await createSession(
      request,
      "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
      "deposit",
    );

    const { body } = await readTestSession(id);
    const session = body as unknown as SessionWithMode;

    expect(session.metadata?.gym_slug).toBe(SLUG);
    expect(session.metadata?.plan).toBe("deposit");

    // Both come from `withInstalments`, the same flag that attaches
    // subscription_data.metadata. Without that block the instalment webhook
    // cannot attribute the sale, and the commission released at instalment 2
    // belongs to nobody.
    expect(session.mode, "deposit did not become a subscription — no instalment mandate").toBe(
      "subscription",
    );
    expect(
      session.metadata?.instalments,
      "instalment count absent — subscription_data was not sent",
    ).toBeTruthy();
  });
});
