# Meta Ads Readiness Audit — PT Launch Lab
**Date:** 2026-05-26  
**Pixel:** 1133525198707842 (PT LAUNCH LAB - WEBSITE)  
**Scope:** Full pixel + CAPI + funnel-page review pre-launch

---

## Verdict at a glance

The site is **ready with caveats**. The core tracking stack is well-engineered: CAPI is implemented across all three conversion types (Lead, Schedule, Purchase), event_id deduplication is wired on every browser/server pair, PII is SHA-256 hashed correctly, and the Stripe webhook provides a server-side Purchase safety net that works even if the user closes the tab. The gaps are not architectural — they are a missing `fbp`/`fbc` leg in the Purchase attribution chain (those cookies are captured at Lead time but not re-read at enrolment time), a `lazyOnload` pixel load that risks the fbq guard failing on fast form submits in Safari, one browser-only Lead event with no CAPI partner on the `/book-call` page, zero `InitiateCheckout` events, and a handful of manual Meta Business Manager steps that must happen before the first ad goes live. Fix the must-fixes (90 minutes of work + one afternoon in Business Manager) and the account will be in strong shape.

---

## Must Fix Before Spend

**1. `fbp` and `fbc` are NOT forwarded into the Purchase CAPI event from the enrolment flow.**  
`EnrolmentFlow.tsx:39-57` (the `appendStripeAttribution` function) encodes `fbclid` from localStorage into `client_reference_id`, but NOT `_fbp` or `_fbc` cookies. `stripe-webhook/route.ts:195-228` reads `attribution["fbp"]` and `attribution["fbc"]` from that decoded payload — so both are always `undefined` on the Purchase event. Since the Purchase event is the highest-value signal Meta optimises on, missing fbp/fbc directly depresses EMQ for Purchase and hurts campaign learning.  
**Fix:** In `EnrolmentFlow.tsx`, add to `appendStripeAttribution`:
```ts
const fbp = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
const fbc = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
if (fbp) payload.fbp = fbp;
if (fbc) payload.fbc = fbc;
```
These keys then survive through Stripe back to the webhook where `sendToMetaCapi` already reads them.

**2. `lazyOnload` pixel strategy means `window.fbq` may not be defined when forms fire on fast connections / Safari pre-render.**  
`app/layout.tsx:218` uses `strategy="lazyOnload"` which defers script injection until after the `load` event. On a cached/fast page load, React hydrates and the user can submit the `HeroLeadForm` before the pixel fires. `HeroLeadForm.tsx:91` and `PhoneCallbackForm.tsx:126` both check `typeof window.fbq` before calling it — the guard is correct, so no crash. But the browser Lead / Schedule events will silently drop. CAPI is the safety net for most cases, but EMQ is higher when browser + server both fire. More critically, the `PageView` at `layout.tsx:225` fires inside the same deferred block — on SPA-style navigations via Next.js `<Link>`, the `load` event does not re-fire, so subsequent page views after the first are never tracked in the browser.  
**Fix (critical part):** Change pixel strategy to `afterInteractive`. It loads after hydration but before the `load` event, keeping it off the critical render path while ensuring `fbq` is ready before any form can be submitted. PageView on SPA transitions also needs a client-side navigation listener — add a `usePathname`-based `useEffect` in `Tracking.tsx` that calls `window.fbq?.('track', 'PageView')` on route change.

**3. The `/book-call` Schedule CAPI event sends no email — EMQ for Schedule is low.**  
`PhoneCallbackForm.tsx:137-146` sends name + phone + avatar to `/api/capi-schedule/route.ts`, but the form only collects name and mobile — no email field. The Schedule CAPI event therefore has no `em` field (email hash). EMQ without email is typically 3–5 points lower. If `/book-call` is a retargeting destination or conversion event in campaigns, this materially hurts match quality.  
**Fix:** Add an optional email field to `PhoneCallbackForm`, or at minimum forward the promo cookie holder's email if it was captured earlier in the funnel. Even an optional email that 50% of users fill out lifts EMQ.

**4. No `InitiateCheckout` event on `/enrol`.**  
`EnrolmentFlow.tsx` tracks `enrolment_started` to GA4 (line 245) but fires no `fbq('track', 'InitiateCheckout')` and no CAPI equivalent. Meta's conversion funnel optimisation (especially for Purchase campaigns) benefits significantly from InitiateCheckout — it signals warm intent below Lead and above Purchase, which helps ASC identify high-probability buyers. Currently there's a complete signal gap between Lead and Purchase.  
**Fix:** At the point where Step 4 (Payment) renders — or when the user clicks "Complete & Pay" — fire `fbq('track', 'InitiateCheckout', { value: amount, currency: 'GBP' }, { eventID: ic_id })` and POST a matching CAPI event. The existing `sendCapiEvent` helper and rate-limited CAPI route pattern make this a straightforward addition.

**5. Meta Business Manager domain verification and Aggregated Event Measurement are manual steps that must be done before spend.**  
See the "Manual Setup Checklist" section below. Without AEM configured, Meta cannot attribute web conversions post-iOS 14.5 for iOS traffic, and campaign delivery for Purchase-optimised campaigns will be restricted or mis-attributed. This is a blocker.

---

## Should Fix in Week 1

**6. `PhoneCallbackForm.tsx:135` fires a browser `fbq('track', 'Lead')` with no matching CAPI event.**  
On line 135, a secondary `Lead` event is fired alongside `Schedule` with `content_category: 'phone_callback'`, but the CAPI relay at `/api/capi-schedule` only sends a `Schedule` event. The orphaned browser Lead has no server-side partner, so deduplication cannot happen. If any campaign optimises on Lead events this will inflate browser-only Lead counts vs server-side counts, confusing the dedup log in Events Manager.  
**Fix:** Either remove the secondary browser `Lead` fire (Schedule is the right event for this form), or add a second `sendCapiEvent` call to `/api/capi-schedule/route.ts` for Lead with the same user data.

**7. Funnel promo source is not propagated into the Purchase CAPI `contentCategory`.**  
`stripe-webhook/route.ts:224` sets `contentCategory: attribution["funnel_promo"]` but `EnrolmentFlow.tsx` never writes `funnel_promo` into the `client_reference_id` payload. The promo cookie exists server-side (set by `/api/funnel-promo/start`) but the enrolment flow never reads it and adds it to the Stripe attribution object. Result: all Purchase CAPI events have `contentCategory: undefined`, making avatar-level purchase attribution impossible.  
**Fix:** In `appendStripeAttribution`, read the `ptll_promo` cookie value, decode it client-side, and add `payload.funnel_promo = promoPayload.source` before base64-encoding. Alternatively, expose a `/api/funnel-promo/status` call at Step 4 render and include the source in the attribution.

**8. `/quiz` page has no `og:image` in its own `metadata` export.**  
`app/quiz/page.tsx:5-9` defines metadata with only title and description — no `openGraph.images` override. When the quiz URL is shared (e.g. in Meta ad previews or WhatsApp), it inherits the root layout `og-image.png` via Next.js metadata merging, which works but is not avatar-specific. Given the quiz is the primary cold-traffic landing for the avatar funnels, a dedicated quiz OG image (or avatar-conditional one) would improve ad creative preview quality.

**9. `QuizApp.tsx:158` uses `(window as any).fbq` — TypeScript escape hatch where a typed guard exists elsewhere.**  
`PhoneCallbackForm.tsx:313-317` correctly declares `interface Window { fbq? }` globally. `QuizApp.tsx` bypasses this with `as any` cast at line 158. Not a runtime risk, but inconsistent — a future refactor could accidentally break the guard. Centralise the fbq window type to a shared `app/types/meta.d.ts`.

**10. `GRAPH_API_VERSION = "v18.0"` in `metaCapi.ts:29` is two versions behind.**  
Meta Graph API is currently at v22.0 (as of May 2026). v18.0 will reach end-of-life. While Meta maintains backward compatibility windows, this should be bumped to v21.0 or v22.0 before go-live to ensure access to any EMQ or dedup improvements in newer API versions.

---

## Already Good

- CAPI is correctly implemented with SHA-256 hashing of all PII fields (email, phone, firstName, lastName, city, country, postcode, externalId) before transmission. Raw values never reach Meta's servers. (`metaCapi.ts:86-141`)
- Event deduplication is correctly wired on Lead (quiz), Lead (prospectus/HeroLeadForm), Schedule, and Purchase — every browser `fbq` call passes the same `eventID` that the server CAPI call uses.
- The Stripe webhook Purchase CAPI event fires server-side unconditionally when `payment_status === 'paid'`, so closed-tab scenarios are covered.
- `/enrol/success/page.tsx:7-11` is correctly `noindex: true` — the purchase confirmation page will not appear in SERPs or be crawled as a duplicate.
- `PurchasePixel.tsx` is wrapped in `<Suspense>` (`enrol/success/page.tsx:20-22`), and `QuizApp` is wrapped in `<Suspense>` (`quiz/page.tsx:16-18`) — both correctly handle `useSearchParams` in App Router without breaking static generation.
- UK phone numbers are normalised to `44XXXXXXXXX` format before hashing (`metaCapi.ts:93-102`), matching Meta's expected format.
- Consent Mode v2 defaults are set before any tracking script fires (`layout.tsx:183-187`) with all signals denied pending user consent. CookieYes loads `afterInteractive` and the pixel loads `lazyOnload` — so the ordering is: Consent defaults (inline) → CookieYes → Pixel, which is correct.
- The `_fbc` synthesis from `fbclid` query parameter is implemented correctly in `extractRequestUserData` (`metaCapi.ts:217-218`) — if a user lands with `?fbclid=`, the server CAPI event builds a valid `fbc` value even without the browser cookie.
- Avatar funnel pages (`/become-a-personal-trainer-uk`) have full OG metadata with correct image dimensions (1200×630).
- The `client_reference_id` attribution chain carries `fbclid`, UTMs, and GA client ID from first touch through to the Stripe webhook, enabling cross-platform attribution reconciliation.
- `sendCapiEvent` fails gracefully — wrapped in try/catch, returns null on failure, never throws into the calling request (`metaCapi.ts:187-202`). A misconfigured env var produces a `console.warn` but no user-facing error.

---

## Manual Setup Checklist (Meta Business Manager / Events Manager)

Complete these in order before the first ad goes live. These cannot be done in code — they require UI access.

1. **Domain verification** — Business Manager > Brand Safety > Domains > Add `ptlaunchlab.co.uk`. Use the DNS TXT record method (avoids needing to re-deploy). Without this, AEM configuration is blocked.

2. **Aggregated Event Measurement (AEM) — event prioritisation** — Events Manager > pixel 1133525198707842 > Aggregated Event Measurement > Configure Web Events. Set priority order (highest to lowest): `Purchase`, `InitiateCheckout`, `Schedule`, `Lead`. Only 8 slots are available; use these 4. This is required for iOS 14.5+ conversion attribution.

3. **CAPI access token generation** — Events Manager > pixel > Settings > Conversions API > Generate Access Token. Generate a long-lived system user token (not a personal user token — personal tokens expire). Copy the value to Vercel as `META_CAPI_ACCESS_TOKEN`.

4. **Test Events confirmation** — After setting `META_CAPI_TEST_EVENT_CODE` on Vercel (e.g. `TEST12345`), go to Events Manager > Test Events tab. Load `https://ptlaunchlab.co.uk/quiz` in a browser, submit a test lead, and confirm: (a) a Lead event appears in Test Events within 60 seconds, (b) the dedup count shows `2 received, 1 deduplicated` (browser + server), (c) EMQ score displays for the Lead event. Remove `META_CAPI_TEST_EVENT_CODE` from Vercel Production env after testing (leave it in Preview/Development only).

5. **Pixel health check** — Use Meta Pixel Helper (Chrome extension) on each funnel page to confirm: PageView fires on load, no duplicate pixel IDs, old pixel `1988881834762642` is absent. Check the avatar pages (`/become-a-personal-trainer-uk`, `/career-change-to-personal-trainer`, `/retrain-as-a-personal-trainer`), `/quiz`, `/book-call`, and `/enrol`.

6. **Offline Conversions API check** — Confirm no Offline Conversions dataset is attached to pixel 1133525198707842 in Events Manager. Meta discontinued Offline Conversions API in May 2025. If one is attached, detach it to avoid data conflicts.

7. **Custom conversions** — In Events Manager, create custom conversions for: `Lead` (source: all), `Schedule` (source: all), `Purchase` (source: all, minimum value filter: £100 to exclude test transactions). These are what you'll assign as campaign objectives.

---

## Env Var Checklist for Vercel Production

| Variable | Purpose | Criticality |
|---|---|---|
| `META_PIXEL_ID` | Pixel ID used in all server CAPI calls — must be `1133525198707842`. Missing = all CAPI events silently dropped with `console.warn` (`metaCapi.ts:158`). | CRITICAL |
| `META_CAPI_ACCESS_TOKEN` | Long-lived system user token from Events Manager. Missing = all CAPI events silently dropped (`metaCapi.ts:154-159`). | CRITICAL |
| `META_CAPI_TEST_EVENT_CODE` | Test event code (e.g. `TEST12345`) — routes events to Test Events tab instead of live data. Must be REMOVED from Production after QA; leaving it live means no real events are recorded. | Remove after QA |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. Missing = webhook returns 503 and NO Purchase events fire anywhere (CAPI, GA4, or gym tracker). Code at `stripe-webhook/route.ts:287-289` hard-blocks on this. | CRITICAL |
| `GA4_MEASUREMENT_ID` | GA4 stream ID (G-90W2KGSL55). Missing = server-side purchase event skipped with `console.warn` (`stripe-webhook/route.ts:94-96`). | HIGH |
| `GA4_API_SECRET` | GA4 Measurement Protocol API secret. Same consequence as above. | HIGH |
| `QUIZ_ZAPIER_WEBHOOK_URL` | Zapier hook for quiz lead forwarding. Missing = quiz leads not forwarded to Sheets/MailerLite (Meta CAPI still fires). | HIGH |
| `PROSPECTUS_ZAPIER_WEBHOOK_URL` | Zapier hook for prospectus leads. Same consequence. | HIGH |
| `PTLL_PROMO_SECRET` | HMAC secret for signing the 48h promo cookie. Missing = promo cookie silently broken (`funnelPromo.ts:30-31`). | MEDIUM |
| `EMAIL_SERVER_URL` | URL of the Render email nurture server. Missing = warm-up emails not sent but no error thrown. | MEDIUM |
| `NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK` | Client-side Zapier hook for the book-call form. Missing = form throws user-facing error "Form endpoint not configured" (`PhoneCallbackForm.tsx:86-88`). | HIGH |
| `FUNNEL_PROMO_ADMIN_WEBHOOK` | Make.com webhook for admin notification on deposit-plan promo redemptions. Missing = admin not notified but sale still processes. | LOW |
| `GYM_TRACKER_WEBHOOK_URL` | Make.com webhook for gym partner sales tracker. Missing = tracker not updated, no user impact. | LOW |
