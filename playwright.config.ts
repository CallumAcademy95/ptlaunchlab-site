import { defineConfig, devices } from "@playwright/test";

// The e2e/ suite exists to stop ONE specific class of failure recurring: a
// buyer paying and not being returned to /enrol/success, so no learner record
// and no signed agreement is ever created. That happened silently for eight
// months and cost eight paying customers. See e2e/README.md.
//
// The suite boots a real dev server against Stripe TEST mode (e2e/dev-server.mjs)
// and completes a real card payment on Stripe's real hosted checkout page.

const PORT = Number(process.env.PTLL_E2E_PORT || 3100);

export default defineConfig({
  testDir: "./e2e",
  // A real payment plus a 3-step form; Stripe's hosted page is not fast.
  timeout: 180_000,
  expect: { timeout: 20_000 },
  // Payments against a shared Stripe test account — keep it serial so a
  // failure is unambiguous rather than a race between two checkouts.
  workers: 1,
  fullyParallel: false,
  // One retry. A genuine redirect regression fails deterministically on every
  // attempt, so a retry cannot hide one — but the journey depends on a real
  // third-party checkout page and a dev server's cold-start latency, and those
  // do occasionally cost a run. A retry that goes green is still reported as
  // flaky, so it stays visible.
  retries: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Runs `next dev` with Stripe test keys and every outbound side effect
    // (Resend email, Zapier→Sheets, GA4) blanked. See e2e/test-env.mjs.
    command: "node e2e/dev-server.mjs",
    url: `http://localhost:${PORT}/enrol`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
