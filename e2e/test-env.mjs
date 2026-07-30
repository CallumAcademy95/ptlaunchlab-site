// Resolves the environment the end-to-end enrolment test runs against.
//
// The point of this file is that the test exercises the REAL code path —
// app/lib/stripeCheckout.ts, /api/checkout, /api/enrolments, the real Stripe
// API — while being physically incapable of taking real money or touching real
// learner data. It does that by overriding, in one place:
//
//   • STRIPE_SECRET_KEY      → the rk_test_… key (test mode: no real charges)
//   • STRIPE_*_PRICE_ID      → test-mode prices (live price ids don't exist there)
//   • PTLL_E2E_BASE_URL      → the local dev server, so Stripe's post-payment
//                              redirect comes back here instead of production
//   • RESEND_API_KEY         → blank, so no admin/learner emails are sent
//   • ENROLMENT_ZAPIER_*     → blank, so nothing is written to the Google Sheet
//   • GA4_*                  → blank, so no analytics events are recorded
//
// Anything NOT listed here is inherited from .env.local as normal.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(HERE, "..");
export const PRICES_FILE = join(HERE, ".test-prices.json");

export const PORT = Number(process.env.PTLL_E2E_PORT || 3100);
export const BASE_URL = `http://localhost:${PORT}`;

/** Reads a KEY=value file without pulling in a dotenv dependency. */
export function readEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

export function localEnv() {
  return readEnvFile(join(REPO_ROOT, ".env.local"));
}

export function testSecretKey() {
  const key = process.env.STRIPE_TEST_SECRET_KEY || localEnv().STRIPE_TEST_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_TEST_SECRET_KEY is not set (looked in the environment and .env.local).\n" +
        "The enrolment regression test talks to Stripe in TEST mode and will not fall\n" +
        "back to the live key. Add a restricted test key with Checkout Sessions write.",
    );
  }
  if (!key.startsWith("rk_test_") && !key.startsWith("sk_test_")) {
    throw new Error(
      `STRIPE_TEST_SECRET_KEY does not look like a test key (starts "${key.slice(0, 8)}").\n` +
        "Refusing to run: this test completes a real card payment and must never do so in live mode.",
    );
  }
  return key;
}

export function testPrices() {
  if (!existsSync(PRICES_FILE)) {
    throw new Error(
      `Missing ${PRICES_FILE}.\nRun: npm run e2e:prices  (or just use npm run test:e2e, which does it for you)`,
    );
  }
  return JSON.parse(readFileSync(PRICES_FILE, "utf8"));
}

/** The env the dev server under test is booted with. */
export function serverEnv() {
  const prices = testPrices();
  return {
    ...process.env,
    PTLL_E2E_BASE_URL: BASE_URL,
    STRIPE_SECRET_KEY: testSecretKey(),
    STRIPE_PIF_PRICE_ID: prices.pif,
    STRIPE_DEPOSIT_PRICE_ID: prices.deposit,
    STRIPE_FUNNEL_PIF_PRICE_ID: prices.funnelPif,
    STRIPE_INSTALMENT_PRICE_ID: prices.instalment,
    NEXT_PUBLIC_STRIPE_INSTALMENTS_ENABLED: "true",
    // Side effects the test must never trigger. Next.js does not overwrite a
    // variable that is already present in process.env, so these win over
    // .env.local even though they are empty.
    RESEND_API_KEY: "",
    ENROLMENT_ZAPIER_WEBHOOK_URL: "",
    ENROLMENT_PDF_ZAPIER_WEBHOOK_URL: "",
    PENDING_ENROLMENT_ZAPIER_WEBHOOK_URL: "",
    GA4_MEASUREMENT_ID: "",
    GA4_API_SECRET: "",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}
