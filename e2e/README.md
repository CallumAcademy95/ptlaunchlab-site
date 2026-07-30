# Pay-first enrolment regression suite

## What this exists to stop

A Stripe **Payment Link**'s post-payment redirect is configured in the Stripe
Dashboard, not in this repo. Two of the three links the enrolment flow used were
left on Stripe's default landing page, so buyers paid and were dropped on
`stripe.com` instead of `/enrol/success` — the page that collects the NCFE
learner record and the signed learner agreement.

Nothing looked broken. The money still arrived. It ran from **Nov 2025 to Jul
2026** and cost **eight paying customers**, each of whom had to be found and
chased by hand.

The fix (`app/lib/stripeCheckout.ts`) creates Checkout Sessions in code so
`success_url` lives in version control. This suite is what stops it drifting back
out.

## The four things it protects

| # | Check | Catches |
|---|---|---|
| 1 | Every Payment Link in `PAYMENT_LINK_PRICES` produces a session whose `success_url` is `/enrol/success?session_id={CHECKOUT_SESSION_ID}` | `success_url` edited, broken, or moved back to the Dashboard |
| 2 | `/api/checkout` returns a real session, never `url: null` | Lost `checkout_sessions_write` scope, deleted price — i.e. **silent** fallback to the raw Payment Link |
| 3 | A real card payment in a real browser lands back on `/enrol/success` and creates an enrolment record carrying the Stripe session id | The whole chain, end to end |
| 4 | Every in-code Payment Link **in live Stripe** still redirects to `/enrol/success` | The original bug: Dashboard config drift, invisible to code review |

Checks 1–3 run against Stripe **test mode**. Check 4 is **read-only** against
live Stripe.

## Running it

```bash
npm run test:e2e            # everything
npm run test:e2e:redirects  # just the live Payment Link check (fast)
npm run e2e:server          # boot the test-mode dev server to click through by hand
```

`npm run test:e2e` provisions its Stripe test-mode prices first (idempotent,
looked up by `lookup_key`), then runs Playwright.

### What it needs

- **`STRIPE_TEST_SECRET_KEY`** — a `rk_test_`/`sk_test_` key with *Checkout
  Sessions write* and *Prices/Products write*. Read from the environment or
  `.env.local`. The suite refuses to run if this is not a test key.
- **`STRIPE_SECRET_KEY`** — the live key, for check 4 only. It is used for
  `GET /v1/payment_links` and nothing else. Needs *Payment Links read*.

### Safety

The dev server under test is booted by `e2e/dev-server.mjs` with every outbound
side effect blanked (see `e2e/test-env.mjs`):

- `RESEND_API_KEY` → no admin or learner emails
- `ENROLMENT_ZAPIER_WEBHOOK_URL`, `ENROLMENT_PDF_ZAPIER_WEBHOOK_URL`,
  `PENDING_ENROLMENT_ZAPIER_WEBHOOK_URL` → nothing written to the Google Sheet
- `GA4_MEASUREMENT_ID` / `GA4_API_SECRET` → no analytics events
- `PTLL_E2E_BASE_URL` → Stripe returns the browser to localhost, not production

Test payments use card `4242 4242 4242 4242` against Stripe test mode. No real
money can move: the key is rejected unless it is a test key, and the browser
journey asserts `livemode === false` before continuing.

## Things that will bite you

**A stale dev server.** Outside CI, Playwright reuses whatever is already
listening on port 3100 — and that server holds the environment it was *started*
with. Check 1 therefore also asserts that the price on the created session
matches `e2e/.test-prices.json`, so a stale server fails loudly instead of
passing meaninglessly. If you see that failure, restart the server.

**The 5-second fallback.** `EnrolmentFlow.tsx` gives `/api/checkout` 5 seconds
before redirecting to the raw Payment Link, so a buyer is never blocked from
paying. On a cold `next dev` the first Stripe call can exceed that, which lands
the browser on `buy.stripe.com` and makes check 3 unable to verify anything. The
test detects this specifically and says so rather than reporting it as a redirect
regression. A `beforeAll` warm-up makes it rare.

**`PTLL_SKIP_LIVE_REDIRECT_CHECK=1`** disables check 4. It exists so a run
without live credentials can be explicit about what it is *not* covering. It
skips visibly and never silently — an unnoticed skip is how the original bug
survived eight months.

## Proof it works

Each guard was verified by reintroducing the bug it protects against:

| Mutation | Result |
|---|---|
| `success_url` → `https://stripe.com` | Checks 1 and 3 fail. Check 3 reports the buyer ending up at `https://stripe.com/gb` — exactly what the 8 customers hit. |
| Break a price ID (simulates lost key scope) | Check 2 fails: *"returned no session … Buyers are being sent to the raw Stripe Payment Link instead"* |
| Point the suite at a link with no Dashboard redirect | Check 4 fails, naming the link and printing the exact Dashboard fix |

Re-run those mutations if you ever substantially change the checkout code — a
regression suite that has never been seen to fail is not yet evidence of
anything.
