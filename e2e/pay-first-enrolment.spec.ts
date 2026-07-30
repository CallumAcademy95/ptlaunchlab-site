import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  PAYMENT_LINKS,
  PRODUCTION_ORIGIN,
  expectedTestPrices,
  fieldInput,
  fieldSelect,
  payWithTestCard,
  readTestSession,
  tickConsent,
} from "./helpers";

// ════════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS
//
// A Stripe Payment Link's post-payment redirect lives in the Stripe Dashboard,
// not in this repo. Two of the three links used by the enrolment flow were left
// on Stripe's default landing page, so buyers paid and were dumped on
// stripe.com instead of /enrol/success — the page that collects the NCFE learner
// record and the signed learner agreement.
//
// Nothing broke visibly. Money still arrived. It ran for eight months and cost
// eight paying customers (Nov 2025 – Jul 2026), each of whom had to be chased
// by hand.
//
// The fix moved success_url into code (app/lib/stripeCheckout.ts). These tests
// exist so that if it ever moves back out, drifts, or silently falls back to a
// raw Payment Link, a test goes red instead of a customer going missing.
// ════════════════════════════════════════════════════════════════════════════

const SUCCESS_PATH = "/enrol/success";

test.describe("pay-first enrolment: the return redirect", () => {
  // Warm every route the pay click touches, before the browser journey.
  //
  // The pay step fires /api/capi-initiate-checkout and /api/enrolment-pending
  // fire-and-forget, then awaits /api/checkout with a 5-second abort. Under
  // `next dev` all three compile on first request, and that contention alone can
  // push /api/checkout past 5s — at which point EnrolmentFlow correctly falls
  // back to the raw Payment Link and the journey can no longer verify anything.
  //
  // This is purely a dev-server artifact, so warm it away rather than let the
  // suite flake for a reason unrelated to the redirect it protects.
  test.beforeAll(async ({ request }) => {
    const warm = (path: string, data: Record<string, unknown>) =>
      request.post(path, { data, timeout: 60_000 }).catch(() => {});

    await Promise.all([
      warm("/api/capi-initiate-checkout", {}),
      warm("/api/enrolment-pending", {}),
    ]);
    // Twice: the first primes the module, the second the TLS pool to Stripe.
    for (let i = 0; i < 2; i++) {
      await warm("/api/checkout", {
        paymentLink: PAYMENT_LINKS.pif,
        email: "warmup@ptlaunchlab-test.invalid",
        name: "Warm Up",
      });
    }
  });

  // ── The contract, asserted directly on real Stripe sessions ───────────────
  // This is the cheapest and most important check. It does not need a browser
  // or a payment: it asks the real /api/checkout for a real Stripe session for
  // every Payment Link the site can send a buyer to, and inspects where Stripe
  // has been told to return them.
  for (const [name, paymentLink] of Object.entries(PAYMENT_LINKS)) {
    test(`${name}: the Checkout Session returns the buyer to ${SUCCESS_PATH}`, async ({ request }) => {
      const res = await request.post("/api/checkout", {
        data: {
          paymentLink,
          email: `e2e-${name}@ptlaunchlab-test.invalid`,
          name: "E2E Redirect Contract",
          cancelPath: "/enrol",
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = (await res.json()) as { url?: string | null; id?: string; reason?: string };

      // A null url means /api/checkout fell back to the raw Payment Link. That
      // is the pre-fix behaviour: the buyer's return journey is then governed by
      // a Dashboard setting nobody reviews. Treat it as a hard failure.
      expect(
        body.url,
        `/api/checkout returned no session for the ${name} link (reason: ${body.reason ?? "none"}).\n` +
          "Buyers are being sent to the raw Stripe Payment Link instead, which means the\n" +
          "post-payment redirect is once again controlled by the Stripe Dashboard rather\n" +
          "than by this repo. Most likely causes: STRIPE_SECRET_KEY lost its\n" +
          '"Checkout Sessions → write" permission, or a price ID no longer exists.',
      ).toBeTruthy();

      const { body: session } = await readTestSession(body.id!);

      expect(session.livemode, "test run created a LIVE Stripe session").toBe(false);
      expect(
        session.success_url,
        `The ${name} Checkout Session would not return the buyer to the enrolment form.\n` +
          `  expected: ${BASE_URL}${SUCCESS_PATH}?session_id={CHECKOUT_SESSION_ID}\n` +
          `  actual:   ${session.success_url}\n` +
          "A buyer completing this payment would pay in full and never create a learner\n" +
          "record or sign the learner agreement — exactly the failure that lost 8 customers.",
      ).toBe(`${BASE_URL}${SUCCESS_PATH}?session_id={CHECKOUT_SESSION_ID}`);

      // The session id must be passed through, or /enrol/success cannot tie the
      // learner record to the payment (and the recovery email link is useless).
      expect(session.success_url).toContain("{CHECKOUT_SESSION_ID}");
      expect(session.metadata.source).toBe("api-checkout-session");

      // Guards against a stale reused dev server silently passing this suite:
      // if the server was booted with different prices than this run provisioned,
      // it is not the code under test and its success_url proves nothing.
      const expectedPrice = expectedTestPrices()[name];
      expect(
        session.line_items?.data[0]?.price.id,
        `The server under test charged price ${session.line_items?.data[0]?.price.id} for the\n` +
          `${name} link, but this run provisioned ${expectedPrice}. The dev server on\n` +
          "this port was almost certainly started with a different environment — restart it\n" +
          "(or run with CI=1) so the suite is testing what you think it is.",
      ).toBe(expectedPrice);
    });
  }

  // ── The override must never leak into production ──────────────────────────
  // PTLL_E2E_BASE_URL exists only so this suite can point Stripe's redirect at
  // a local server. If it were ever set in production, live buyers would be
  // redirected off-site after paying.
  test("SITE_URL falls back to the production origin when the test override is absent", async () => {
    const { PRODUCTION_SITE_URL, resolveSiteUrl } = await import("../app/lib/stripeCheckout");

    expect(PRODUCTION_SITE_URL).toBe(PRODUCTION_ORIGIN);
    expect(
      resolveSiteUrl({}),
      "With PTLL_E2E_BASE_URL unset, live checkout must return buyers to ptlaunchlab.co.uk.\n" +
        "If this fails, production buyers are being redirected somewhere else after paying.",
    ).toBe(PRODUCTION_ORIGIN);
    expect(resolveSiteUrl({ PTLL_E2E_BASE_URL: "" })).toBe(PRODUCTION_ORIGIN);

    // And the override does work, or this suite would be testing nothing.
    expect(resolveSiteUrl({ PTLL_E2E_BASE_URL: BASE_URL })).toBe(BASE_URL);
  });

  // ── The whole journey, in a real browser, with a real card ────────────────
  test("a paying buyer lands on the enrolment form and creates an enrolment record", async ({ page }) => {
    const learner = {
      name: "E2E Regression Learner",
      email: `e2e-${Date.now()}@ptlaunchlab-test.invalid`,
    };

    // Capture the enrolment submission so we can assert on what was recorded.
    const enrolmentPost = page.waitForRequest(
      (r) => r.url().includes("/api/enrolments") && r.method() === "POST",
      { timeout: 150_000 },
    );

    // ── 1. The pay step: name + email + plan, nothing else ──
    await page.goto("/enrol");
    await page.getByPlaceholder("e.g. Jane Smith").fill(learner.name);
    await page.getByPlaceholder("your@email.com").fill(learner.email);

    // Leave the honeypot ("Leave this field empty") untouched — filling it would
    // trip the anti-spam gate and the failure would look like a redirect bug.

    await page.getByRole("button", { name: /Pay in Full/ }).click();

    // ── 2. Stripe's real hosted checkout ──
    // EnrolmentFlow aborts /api/checkout after 5s and redirects to the raw
    // Payment Link rather than block the buyer. That is deliberate, but it means
    // a slow response lands us on buy.stripe.com — which locally cannot complete
    // the journey, because the raw link's redirect points at production.
    // Distinguish that from an actual redirect regression so the failure is
    // diagnostic rather than just red.
    await page
      .waitForURL(/checkout\.stripe\.com|buy\.stripe\.com/, { timeout: 60_000 })
      .catch(() => {
        throw new Error(`Clicking Pay never reached Stripe at all. Ended up at: ${page.url()}`);
      });

    if (page.url().includes("buy.stripe.com")) {
      throw new Error(
        "The buyer was sent to the RAW Stripe Payment Link instead of a server-created\n" +
          "Checkout Session, so this run could not verify the return redirect.\n\n" +
          `URL: ${page.url()}\n\n` +
          "EnrolmentFlow.tsx aborts /api/checkout after 5s and falls back to the raw link.\n" +
          "On a cold dev server the first Stripe call sometimes exceeds that; re-run and it\n" +
          "will usually pass. If it happens consistently, /api/checkout is genuinely too slow\n" +
          "and PRODUCTION buyers are silently getting the Dashboard-controlled redirect —\n" +
          "which is only safe while payment-link-redirects.spec.ts is also green.",
      );
    }
    expect(page.url()).toContain("cs_test_"); // never a live session
    await payWithTestCard(page, learner.name);

    // ── 3. THE REGRESSION: does Stripe bring the buyer back to us? ──
    await page.waitForURL(new RegExp(`${SUCCESS_PATH}\\?.*session_id=cs_test_`), { timeout: 90_000 }).catch(() => {
      throw new Error(
        `After paying, the buyer was NOT returned to ${SUCCESS_PATH}.\n` +
          `They ended up at: ${page.url()}\n\n` +
          "This is the exact failure that silently cost 8 paying customers: the payment\n" +
          "succeeds, the money arrives, and no learner record or signed agreement is ever\n" +
          "created. Check success_url in app/lib/stripeCheckout.ts and the Dashboard\n" +
          "redirect on the Payment Links (see payment-link-redirects.spec.ts).",
      );
    });

    const sessionId = new URL(page.url()).searchParams.get("session_id")!;
    expect(sessionId).toMatch(/^cs_test_/);

    // The payment must actually have settled, not just redirected.
    const { body: session } = await readTestSession(sessionId);
    expect(session.payment_status).toBe("paid");
    expect(session.amount_total).toBe(159900);

    // ── 4. The form is reachable and prefilled from the paid session ──
    await expect(page.getByText("Payment received")).toBeVisible();
    await expect(fieldInput(page, "Full Legal Name")).toHaveValue(learner.name);
    await expect(fieldInput(page, "Email Address")).toHaveValue(learner.email);

    // ── 5. Step 1 — personal details ──
    await fieldSelect(page, "Title").selectOption("Ms");
    await fieldInput(page, "Date of Birth").fill("1995-06-15");
    await fieldSelect(page, "Gender").selectOption("Prefer not to say");
    await fieldInput(page, "National Insurance Number").fill("QQ123456C");
    await fieldInput(page, "Mobile Number").fill("07700 900000");
    await fieldInput(page, "Address Line 1").fill("1 Regression Street");
    await fieldInput(page, "Town / City").fill("Pontefract");
    await fieldInput(page, "Postcode").fill("WF8 4AH");
    await page.getByRole("button", { name: /Continue/ }).click();

    // ── 6. Step 2 — learning info ──
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    const heardAbout = fieldSelect(page, "How did you hear about PT Launch Lab");
    if (await heardAbout.count()) await heardAbout.selectOption("Google / Online Search");
    await fieldSelect(page, "Highest qualification achieved").selectOption("A-Level / AS-Level");
    await fieldSelect(page, "Current employment status").selectOption("Employed full-time");
    await page.getByRole("button", { name: /Continue/ }).click();

    // ── 7. Step 3 — agreement + signature ──
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    for (const consent of [
      "I confirm that all information I have provided",
      "I understand that this is a self-funded course",
      "I have read and understood the cooling off",
      "I commit to engaging with the learning process",
      "I have read and agree to the",
    ]) {
      await tickConsent(page, consent);
    }

    // Typed signature rather than drawing on the canvas — same code path for
    // the payload, far less brittle than synthesising pointer events.
    await page.getByRole("button", { name: "Type Name" }).click();
    await page.getByPlaceholder("Type your full legal name").fill(learner.name);

    await page.getByRole("button", { name: /Confirm Enrolment/ }).click();

    // ── 8. The record exists, and it is tied to the payment ──
    const submitted = await enrolmentPost;
    const payload = submitted.postDataJSON() as Record<string, unknown>;

    expect(
      payload.stripeSessionId,
      "The enrolment record was submitted without a Stripe session id, so there is no\n" +
        "way to reconcile this learner against the payment they made.",
    ).toBe(sessionId);
    expect(payload).toMatchObject({ stripeSessionId: sessionId });

    const response = await submitted.response();
    expect(response?.status(), "POST /api/enrolments did not succeed").toBe(200);

    // And the buyer is told they are done.
    await expect(page.getByRole("heading", { name: /You're in|You’re in/ })).toBeVisible({ timeout: 30_000 });
  });
});
