import { test, expect } from "@playwright/test";
import { PAYMENT_LINKS, PRODUCTION_ORIGIN, envValue, stripeGet } from "./helpers";

// ════════════════════════════════════════════════════════════════════════════
// THE SAFETY NET, CHECKED AGAINST LIVE STRIPE (read-only)
//
// app/lib/stripeCheckout.ts creates Checkout Sessions so success_url lives in
// this repo. But every caller deliberately falls back to the raw Payment Link
// if session creation fails — a buyer must never be blocked from paying.
//
// That fallback is only safe while the Payment Links themselves still redirect
// to /enrol/success. Those redirects live in the Stripe Dashboard, where nothing
// in CI can see them and no code review covers them. They are exactly what
// drifted and cost eight customers.
//
// So: assert them directly, against live Stripe, read-only. Nothing is created
// or modified here — this only ever performs GETs.
//
// Requires STRIPE_SECRET_KEY with "Payment Links → read".
// ════════════════════════════════════════════════════════════════════════════

interface PaymentLink {
  id: string;
  url: string;
  active: boolean;
  after_completion?: {
    type?: string;
    redirect?: { url?: string };
  };
}

const SKIP_FLAG = "PTLL_SKIP_LIVE_REDIRECT_CHECK";

test.describe("live Stripe Payment Links still redirect to the enrolment form", () => {
  test("every in-code Payment Link returns buyers to /enrol/success", async () => {
    if (process.env[SKIP_FLAG] === "1") {
      // A deliberate, visible opt-out. Never skip silently — an unnoticed skip
      // is how the original bug survived for eight months.
      test.skip(true, `${SKIP_FLAG}=1 — live Payment Link redirects were NOT verified.`);
    }

    const key = envValue("STRIPE_SECRET_KEY");
    expect(
      key,
      `STRIPE_SECRET_KEY is not available, so the live Payment Link redirects could not be\n` +
        `checked. These are the fallback path for every buyer and they are what silently\n` +
        `broke before. Provide a live key with "Payment Links → read", or set ${SKIP_FLAG}=1\n` +
        `to consciously accept that this protection is off for this run.`,
    ).toBeTruthy();

    const { status, body } = await stripeGet<{ data?: PaymentLink[]; error?: { message?: string } }>(
      key!,
      "payment_links?limit=100",
    );
    expect(
      status,
      `Stripe refused to list Payment Links (${status}): ${body.error?.message}\n` +
        `The key needs "Payment Links → read".`,
    ).toBe(200);

    const byUrl = new Map((body.data ?? []).map((l) => [l.url, l]));
    const expected = `${PRODUCTION_ORIGIN}/enrol/success?session_id={CHECKOUT_SESSION_ID}`;
    const problems: string[] = [];

    for (const [name, url] of Object.entries(PAYMENT_LINKS)) {
      const link = byUrl.get(url);
      if (!link) {
        problems.push(`  ${name} (${url})\n      NOT FOUND in the live account — is it still the right link?`);
        continue;
      }
      if (!link.active) {
        problems.push(`  ${name} (${link.id})\n      is DEACTIVATED, but the code still points buyers at it.`);
        continue;
      }
      const actual = link.after_completion?.redirect?.url;
      if (actual !== expected) {
        problems.push(
          `  ${name} (${link.id})\n` +
            `      expected redirect: ${expected}\n` +
            `      actual:            ${actual ?? `none — after_completion.type = "${link.after_completion?.type}"`}`,
        );
      }
    }

    expect(
      problems.join("\n"),
      "One or more live Stripe Payment Links no longer return buyers to the enrolment form.\n\n" +
        problems.join("\n") +
        "\n\nWhy this matters: /api/checkout falls back to these raw links whenever a Checkout\n" +
        "Session cannot be created. When that fallback happens AND the link's Dashboard\n" +
        "redirect is wrong, the buyer pays and is never asked to complete their learner\n" +
        "record — silently. That combination cost 8 paying customers between Nov 2025 and\n" +
        "Jul 2026.\n\n" +
        "Fix: Stripe Dashboard → Payment Links → [link] → After payment →\n" +
        `"Redirect customers to your website" → ${expected}\n`,
    ).toBe("");
  });

  // The map in stripeCheckout.ts is what decides whether a buyer gets a
  // code-controlled session at all. A link on an enrol page that is missing
  // from the map silently gets the old Dashboard-controlled behaviour.
  test("no active Payment Link that takes course money is missing from PAYMENT_LINK_PRICES", async () => {
    if (process.env[SKIP_FLAG] === "1") test.skip(true, `${SKIP_FLAG}=1`);
    const key = envValue("STRIPE_SECRET_KEY");
    test.skip(!key, "STRIPE_SECRET_KEY unavailable");

    const { body } = await stripeGet<{ data?: PaymentLink[] }>(key!, "payment_links?limit=100");
    const mapped = new Set(Object.values(PAYMENT_LINKS) as string[]);
    const unmapped = (body.data ?? []).filter((l) => l.active && !mapped.has(l.url));

    // Two legacy links are knowingly kept active because real payments came
    // through them historically; they are not referenced by any enrol page.
    const KNOWN_LEGACY = new Set([
      "https://buy.stripe.com/bJecMZ4Ew6de52q4EifEk09",
      "https://buy.stripe.com/7sY5kxb2UgRSfH45ImfEk0d",
    ]);
    const unexpected = unmapped.filter((l) => !KNOWN_LEGACY.has(l.url));

    expect(
      unexpected.map((l) => `  ${l.id} ${l.url}`).join("\n"),
      "New active Stripe Payment Link(s) exist that app/lib/stripeCheckout.ts knows nothing\n" +
        "about:\n\n" +
        unexpected.map((l) => `  ${l.id} ${l.url}`).join("\n") +
        "\n\nIf any enrol page sends buyers to one of these, those buyers get the old\n" +
        "Dashboard-controlled redirect — the failure mode this whole suite exists to prevent.\n" +
        "Either add it to PAYMENT_LINK_PRICES (with its price ID) or, if it is a legacy link\n" +
        "no page links to, add it to KNOWN_LEGACY in this test with a note explaining why.\n",
    ).toBe("");
  });
});
