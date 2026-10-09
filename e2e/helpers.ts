import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { RETIRED_PAYMENT_LINKS } from "../app/lib/paymentLinks";

export const REPO_ROOT = join(__dirname, "..");
export const PORT = Number(process.env.PTLL_E2E_PORT || 3100);
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * The two plans the site sells (October 2026 change-over), by the name
 * /api/checkout takes. Each is driven individually by the specs.
 */
export const PLANS = ["pif", "monthly"] as const;
export type Plan = (typeof PLANS)[number];

/**
 * The raw fallback Payment Links the app is configured with, if any.
 *
 * Read from the same env the app reads (NEXT_PUBLIC_STRIPE_LINK_*_999). There
 * is deliberately no hardcoded default: when unset the enrol page shows a
 * contact error instead of falling back to a retired price.
 */
export function configuredFallbackLinks(): Record<Plan, string | undefined> {
  return {
    pif: envValue("NEXT_PUBLIC_STRIPE_LINK_PIF_999") || undefined,
    monthly: envValue("NEXT_PUBLIC_STRIPE_LINK_MONTHLY_999") || undefined,
  };
}

/** Every Payment Link the site has retired. They should be deactivated in Stripe. */
export const RETIRED_LINK_URLS: ReadonlySet<string> = new Set(RETIRED_PAYMENT_LINKS);

/** The origin live checkout must always return buyers to. */
export const PRODUCTION_ORIGIN = "https://ptlaunchlab.co.uk";

function readEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

export function envValue(name: string): string | undefined {
  return process.env[name] || readEnvFile(join(REPO_ROOT, ".env.local"))[name];
}

export function testKey(): string {
  const key = envValue("STRIPE_TEST_SECRET_KEY");
  if (!key || !/^(rk|sk)_test_/.test(key)) {
    throw new Error("STRIPE_TEST_SECRET_KEY missing or not a test key — refusing to run.");
  }
  return key;
}

/** Read-only call against Stripe with an explicit key. */
export async function stripeGet<T>(key: string, path: string): Promise<{ status: number; body: T }> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  return { status: res.status, body: (await res.json()) as T };
}

export interface StripeSession {
  id: string;
  livemode: boolean;
  mode: string;
  amount_total: number;
  success_url: string;
  cancel_url: string;
  metadata: Record<string, string>;
  payment_status: string;
  line_items?: { data: Array<{ price: { id: string } }> };
}

export function readTestSession(id: string) {
  return stripeGet<StripeSession>(testKey(), `checkout/sessions/${id}?expand[]=line_items`);
}

/**
 * The Stripe TEST-mode price ids this run expects, written by
 * `npm run e2e:prices`.
 *
 * Asserting against these is what stops a STALE dev server quietly making the
 * suite pass: playwright.config.ts reuses an already-running server outside CI,
 * and that server holds whatever prices it was booted with. Comparing the price
 * on the created session against this file catches that immediately.
 */
export function expectedTestPrices(): Record<string, string> {
  const path = join(__dirname, ".test-prices.json");
  if (!existsSync(path)) {
    throw new Error(`Missing ${path} — run: npm run e2e:prices`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

// ─── Form driving ────────────────────────────────────────────────────────────
// app/enrol/shared.tsx renders <label>Text</label> followed by the control as a
// sibling (no htmlFor), so getByLabel cannot be used. The control is always the
// element immediately after its label.
export const fieldInput = (page: Page, label: string) =>
  page.locator(`label:has-text("${label}") + input`);
export const fieldSelect = (page: Page, label: string) =>
  page.locator(`label:has-text("${label}") + select`);

/**
 * A Check from shared.tsx. The real <input> is sr-only inside the label, so it
 * must be checked with force. Do NOT click the label instead: the terms consent
 * contains an <a> that calls stopPropagation(), so a click landing on the link
 * text silently fails to toggle the box.
 */
export const consentCheck = (page: Page, name: string) =>
  page.getByRole("checkbox", { name: new RegExp(name, "i") });

/**
 * Ticks a consent box and confirms it stuck.
 *
 * Retried as a unit because step 3 renders and hydrates at the same moment the
 * test reaches it: a click that lands before React has attached its onChange is
 * simply swallowed, and the box stays unticked. Retrying the click-then-verify
 * pair absorbs that race without hiding a genuinely broken checkbox — if it
 * never ticks, this still fails.
 */
export async function tickConsent(page: Page, name: string) {
  const box = consentCheck(page, name).first();
  await expect(async () => {
    await box.check({ force: true });
    await expect(box).toBeChecked({ timeout: 1_000 });
  }, `consent checkbox never ticked: "${name}"`).toPass({ timeout: 15_000 });
}

/** Stripe's hosted checkout card form. Test card 4242 always succeeds. */
export async function payWithTestCard(page: Page, cardholder: string) {
  // Opening the card form is the one genuinely awkward step. Stripe renders the
  // "Pay with card" control as a hidden button layered over the accordion row,
  // which swallows synthetic clicks and is invisible to Playwright's actionability
  // checks — so wait only for it to be ATTACHED and click it through the DOM.
  const cardNumber = page.locator("input#cardNumber");
  await page.waitForSelector('button[data-testid="card-accordion-item-button"], input#cardNumber', {
    state: "attached",
    timeout: 60_000,
  });

  if (!(await cardNumber.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      const el =
        document.querySelector<HTMLElement>('button[data-testid="card-accordion-item-button"]') ??
        document.querySelector<HTMLElement>("#payment-method-accordion-item-title-card");
      el?.click();
    });
  }

  await cardNumber.waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("input#cardNumber").fill("4242424242424242");
  await page.locator("input#cardExpiry").fill("12/34");
  await page.locator("input#cardCvc").fill("123");
  await page.locator("input#billingName").fill(cardholder);

  // Stripe builds the billing form from the payer's GEOGRAPHY, not from the
  // price's currency. Run from the UK you get a Postcode field; run from a
  // US-hosted CI runner you get a ZIP, which strips non-digits — so "WF8 4AH"
  // became "84", failed validation as incomplete, Pay never submitted, and the
  // test timed out after 90s. It looked like a redirect regression and was
  // actually a postcode in the wrong country's field.
  //
  // Pin the country so the form is the same shape wherever this runs.
  const country = page.locator("select#billingCountry");
  if (await country.count()) {
    await country.selectOption("GB").catch(() => { /* already GB, or no such option */ });
  }

  // Ticking Link's "save my information" makes the phone number required, and
  // it is pre-ticked for some payers. Nothing here needs Link, so clear it
  // rather than satisfy a field the journey does not depend on.
  const link = page.locator('input[type="checkbox"]#enableStripePass');
  if ((await link.count()) && (await link.isChecked().catch(() => false))) {
    await link.uncheck().catch(() => { /* not interactable — the phone fill below covers it */ });
  }

  const postcode = page.locator("input#billingPostalCode");
  if (await postcode.count()) await postcode.fill("WF8 4AH");

  // Only present if Link stayed on. A valid UK mobile, so it passes whichever
  // country the form ended up in.
  const phone = page.locator("input#phoneNumber");
  if ((await phone.count()) && (await phone.isVisible().catch(() => false))) {
    await phone.fill("07700900123").catch(() => {});
  }

  await page.getByTestId("hosted-payment-submit-button").click();
}
