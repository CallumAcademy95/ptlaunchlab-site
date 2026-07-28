# Gym Partner Platform — Build Plan

**Status:** v1 complete and live. All five portal sections built, 9 sales backfilled, £4,000 of commission reconciled, 27 playbook entries written. **One migration outstanding: `20260728_pp_playbook_entries.sql`.** · 2026-07-28

> **Picking this up?** Read `PARTNER-PLAYBOOK-BRIEF.md` for the content spec, and
> `partner-playbook/idea-its-your-academy.md` before writing any partner-facing
> copy — the academy belongs to the gym, and naming ourselves in front of a
> member is the easiest mistake to make here.
>
> **Next task:** convert Chapters 7 and 8 of `PLAYBOOK FILE.docx` into
> `type: campaign` and `type: idea` entries. Both chapters are complete in the
> document and need nothing from Callum. The document only contains Chapters
> 6–8, and spells the brand "PT Launch Labs" — it has no S.
**Lives in:** `ptlaunchlab-site` at `/partners`
**One-liner:** A logged-in hub where each gym partner sees everything they get from the partnership — resources, their academy link, live sales, payments, and a marketing playbook.

---

## 0. Progress log

### ✅ Done — Phase 0 (uncommitted)

**`gymSlug` now flows to Stripe.** Every new sale carries a stable partner key:

- `app/enrol/shared.tsx` — `gymSlug` added to `PartnerConfig` and `EnrolmentContext`
- `app/enrol/EnrolmentFlow.tsx` — `buildAttributionRef(gym, gymSlug)` writes `payload.gyms` **before** `payload.gym`, so the slug survives the 200-char `client_reference_id` cap; slug also added to the localStorage context and the `/api/checkout` body
- `app/lib/stripeCheckout.ts` — `gymSlug` on `CheckoutSessionInput`, written as `gym_slug` into **both** session metadata and `subscription_data.metadata` (deposits are subscriptions — the instalment webhook only sees the latter)
- `app/api/checkout/route.ts` — accepts and forwards `gymSlug`
- All 8 live partner configs + `_gym-template` given a slug: `6fit`, `xcelerate`, `gym-n-go`, `superflex`, `ebor`, `muscle-bound`, `mof`, `ironwolf`

`gymReferral` is untouched everywhere, so the Make → Google Sheet tracker behaves exactly as before. `npx tsc --noEmit` clean.

**Schema drafted:** `supabase/migrations/20260727_partner_platform.sql` — `pp_partners`, `pp_partner_users`, `pp_sales`, `pp_payouts`, `pp_resources`, RLS policies, and a seed of the 8 live partners. **Not applied yet.**

Grandfathering is modelled as `pp_partners.commission_terms`: all 8 existing partners seed as `on_enrolment` (their signed terms); the column defaults to `instalment_2` so new partners get the new deal automatically.

### ✅ Done — agreement v2.0 (2026-07-28)

`PARTNERSHIP_AGREEMENT_VERSION = "2.0"`, exported from the server PDF generator and stamped into the PDF header, the admin notification email, and the Zapier→Drive payload as `agreement_version`. Bump it whenever the legal text changes — it is how you tell later which terms a gym actually signed.

Clause 5 rewritten: 5.2 splits release by plan (PIF → 30 days after enrolment; deposit → 30 days after the **2nd** instalment clears), 5.3 points at the portal and states accrued ≠ payable, 5.5 widens withholding to cancellations/reversals/chargebacks, and **5.6–5.7 are new** — clawback with pro-rata partial refunds, recovered by offset against future commission or repayment within 30 days of demand.

Applied to **both** copies of the legal text: the live server generator and the unused client `app/lib/generatePartnershipAgreementPDF.ts` (jspdf, no callers — kept in sync so they can't silently diverge). Renders at 3 pages, same as v1.0.

**⚠️ Not legally reviewed.** Worth a solicitor's eye on 5.6–5.7 before it goes to a partner with real money behind it.

### ✅ Done — Phase 1, code (2026-07-28)

Auth, middleware gate, portal shell, forced password change and My Academy are all written and building. **Neither the migration nor the new env var is in place, so none of it can run yet** — see "blocked on you" below.

| File | Role |
|---|---|
| `app/lib/partner-auth.ts` | `createPartnerServerClient`, `getPartnerSession`, `requirePartner`, `partnerAcademyUrl` |
| `app/lib/partner-session-edge.ts` | `isProtectedPartnerPath` + `gatePartnerRequest` for middleware (edge-safe) |
| `app/lib/partner-data.ts` | `getPartnerSummary` + `PARTNER_SALE_COLUMNS` (the §6.2 no-email column list) |
| `app/partners/actions.ts` | `partnerSignIn` / `partnerSignOut` / `partnerSetPassword` |
| `app/partners/login`, `app/partners/set-password` | Full-screen, outside the portal shell |
| `app/partners/(portal)/*` | Shell layout, nav, My Academy, and stubs for the four unbuilt sections |
| `app/partners/qr/route.ts` | PNG QR of their academy URL, session-derived |
| `app/admin/partners` | Create a partner login → `auth.admin.createUser` + welcome email |

**Route group, not a plain layout.** Login and set-password sit *outside* `(portal)/` on purpose: the shell layout calls `requirePartner()`, and set-password wrapped in that layout would redirect to itself forever.

**`getPartnerSession` is wrapped in React `cache()`.** The shell layout and the page inside it both resolve the session; without the cache that is two Supabase round trips and two partner lookups per page load.

**Password reset is not built.** Partners who forget their password currently have to email us and get a new login created. Worth adding a Supabase reset flow, but it wasn't in the Phase 1 scope.

**No browser Supabase client anywhere.** All auth happens in server actions and server components, which is why the anon key is `SUPABASE_ANON_KEY` and not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### ⛔ Blocked on you — /partners is dead until both of these are done

1. **`SUPABASE_ANON_KEY`** — new env var, needed in `.env.local` and on Vercel (all three environments). It's the anon/publishable key from the same project as `SUPABASE_URL` (`rbbudrdryuokujlsvwgm`). Not a secret, so per [[feedback_vercel_sensitive_env_vars]] **do not mark it Sensitive**. Without it the middleware gate fails closed and every `/partners` URL bounces to `?error=config`.
2. **Apply `supabase/migrations/20260727_partner_platform.sql`** in the SQL editor for project `rbbudrdryuokujlsvwgm` — the *fitness* org project, not the AlbaCo learner-data one.

Then: `/admin/partners` → create a login for one gym → sign in at `/partners/login` → confirm the forced password change fires and the academy link, QR and promo code render.

### ▶️ Next session — pick up here

Phase 2 (Resource Drive: private bucket, signed downloads, admin upload) or Phase 3 (tracking: `recordPartnerSale()` in the Stripe webhook + the commission release rules). **Phase 3 is the one partners will ask about first** — the portal currently shows honest zeros on the counters.

### ⚠️ Watch-outs discovered while building

- `_gym-template` ships with `gymSlug: "GYM-SLUG-HERE"` — a new partner copied from the template without editing it will attribute sales to a nonexistent partner. Worth a startup assert or a lint rule later.
- The seed inserts **8** partners; `_gym-template` is a template, not a gym.

---

## 1. What exists today (grounding)

| Thing | Where | Notes |
|---|---|---|
| 9 partner gym pages | `app/6fit-academy`, `ebor-fitness`, `ironwolf-gym`, `mof-gym`, `muscle-bound-academy`, `superflex-academy`, `xcelerate-academy`, `gym-n-go-academy`, `_gym-template` | Each = a `GymConfig` (`app/lib/gymPartnerConfig.ts`) + a `PartnerConfig` in its `enrol/page.tsx` |
| Gym attribution | `EnrolmentFlow.tsx` → Stripe session `metadata.gym_referral` + `client_reference_id` → `stripe-webhook` | **`gymReferral` is a free-text display name**, e.g. `"Xcelerate Gyms Edgware"` |
| Sales tracker | `sendToGymTracker()` in `app/api/stripe-webhook/route.ts:305` → `GYM_TRACKER_WEBHOOK_URL` → Make.com → Google Sheet | Fire-and-forget. Mirror, not queryable. |
| Auth | `app/lib/admin-auth.ts` — single shared password, HMAC-signed cookie, gated in `middleware.ts:152` | Code comment: *"Upgrade to Supabase Auth or magic links when adding multi-user roles."* |
| Database | Supabase already in-app: `@supabase/supabase-js`, `getSupabaseAdmin()` service-role client | Currently used for WhatsApp inbox + live questions only |
| Email | Resend (`RESEND_API_KEY`) | Used across enrolment + partnership flows |
| PDF | `pdfkit` + `jspdf`; `app/lib/server/generatePartnershipAgreementPDF.server.ts` | Reusable pattern for invoices |
| Partner agreement | `app/api/gym-partnership/sign/route.ts` → PDF → email | £500 per learner, **paid 30 days after confirmed enrolment** |
| Payments | Stripe restricted key now has Checkout Sessions / Prices / Subscriptions / Invoices / Customers / Payment Links | Deposits are **subscriptions**: £599 + 5 × £200 |

**Why build it inside `ptlaunchlab-site` and not a new app:** the gym attribution, the Stripe webhook, the Supabase client, the brand tokens and the partner landing pages are all already here. A separate app would need to duplicate all five and then reach back across for data. `/partners` is the portal; `/gym-partnership` stays the public sales page.

---

## 2. Blocker to resolve first — partner identity

`gymReferral` being a display name is fragile: a rename, a typo, or a trailing space silently orphans a sale from its partner. Every partner-facing number depends on this join.

**Fix (do this in Phase 0, ~1 hour):**

1. Add `gymSlug: string` to `PartnerConfig` — stable, lowercase, never changes (`6fit`, `xcelerate`, `superflex`…).
2. `EnrolmentFlow` writes **both** `gym_referral` (display name — keeps the existing Sheet readable) and `gym_slug` (the join key) into Stripe metadata and `client_reference_id`.
3. `pp_partners.slug` matches `gym_slug`.
4. For historical rows, keep a `pp_partners.legacy_referral_names text[]` so backfill can match the old free-text strings.

Without this, Phase 3 tracking will look like it works and quietly under-report.

---

## 3. Data model (Supabase, `pp_` prefix)

```sql
pp_partners
  id                  uuid pk
  slug                text unique         -- join key, matches gym_slug in Stripe metadata
  legacy_referral_names text[]            -- old free-text gymReferral values, for backfill
  gym_name            text
  status              text                -- active | paused
  landing_page_path   text                -- '/6fit-academy'
  promo_code          text
  logo_url, primary_color                 -- light co-brand in the hub header
  fee_per_learner_pence int default 50000
  payout_terms_days   int  default 30
  created_at

pp_partner_users
  id                  uuid pk             -- = auth.users.id
  partner_id          uuid → pp_partners
  email, full_name
  role                text                -- owner | staff
  must_change_password bool default true
  last_login_at

pp_sales                                  -- one row per attributed enrolment
  id                  uuid pk
  partner_id          uuid → pp_partners
  stripe_session_id   text unique         -- idempotency key
  learner_name        text
  learner_email       text                -- stored, NOT shown to partner (see §6)
  plan_type           text                -- PIF | deposit
  amount_paid_pence   int                 -- updates as instalments land
  amount_due_pence    int                 -- 159900
  promo_code          text
  status              text                -- confirmed | cancelled | refunded
  commission_pence    int
  commission_status   text                -- accruing | due | paid | voided
  commission_release_at timestamptz null   -- when it becomes payable (see §6.1)
  payout_id           uuid → pp_payouts null
  enrolled_at         timestamptz

pp_payouts
  id, partner_id, period_label, total_pence,
  status              text                -- draft | approved | paid
  invoice_number, invoice_url, reference, paid_at

pp_resources                              -- the drive/hub
  id
  partner_id          uuid null           -- NULL = shared with every partner
  category            text                -- branding | print | digital | learner | legal | training
  title, description
  storage_path        text                -- private Supabase Storage object
  external_url        text null           -- escape hatch (Drive/Canva/YouTube)
  mime, file_size, version
  sort_order, created_at
```

**Not in the DB:** the playbook. See §5.4.

---

## 4. Auth

Supabase Auth (email + password), not an extension of the HMAC admin cookie. Reasons: password hashing, reset flows, and session handling all come free, and external business users are the wrong place to hand-roll credential storage. The two cookie systems coexist — `ptll_admin_auth` for `/admin`, Supabase session for `/partners`.

- Add `@supabase/ssr` **for session cookies only**. Per project memory, `createServerClient` does not bypass RLS — that's fine and wanted here.
- Data reads go through the service-role client, filtered by the `partner_id` resolved from the session. RLS policies on `pp_*` as a second belt, never the only one.
- You create the login during setup: an admin action that calls `auth.admin.createUser()` with a generated password, inserts `pp_partner_users` with `must_change_password = true`, and Resends a welcome email.
- `middleware.ts` gets an `isProtectedPartnerPath()` gate mirroring the existing admin one. First login → forced redirect to `/partners/set-password` until the flag clears.

---

## 5. The five sections

### 5.1 `/partners` — My Academy (home)

The landing surface. Follows the hub UX philosophy (learner is *led*, one next-best action):

- Their academy URL, large, with a copy button + QR download
- Their promo code
- Four counters: enrolments this month · all-time · commission earned · next payout
- One action card ("3 new resources added" / "Your October payout is ready")

### 5.2 `/partners/resources` — Resource Drive

- Private Supabase Storage bucket `partner-resources`. Downloads go through a server action that checks the session's `partner_id` then issues a **60-second signed URL**. Never public objects.
- Two tiers: shared resources (visible to all) + per-partner resources (their logo pack, their QR, their branded prospectus).
- Categories: Branding & logos · Print (posters, QR, flyers) · Digital (social templates) · Learner handouts · Legal (signed agreement, terms) · Training (how to sell it).
- "New" badge driven by `created_at`.
- Upload happens in `/admin/partners/[id]` — you upload manually, as intended.

### 5.3 `/partners/sales` + `/partners/payments` — Tracking

**Source of truth = Supabase, written by the Stripe webhook.** Not the Sheet, not Stripe queried live.

Add `recordPartnerSale(session)` next to the existing `sendToGymTracker()` call in `app/api/stripe-webhook/route.ts:804`. It upserts a `pp_sales` row keyed on `stripe_session_id`. The Sheet keeps working exactly as-is — ops don't lose anything.

The `invoice.paid` handler (already subscribed) increments `amount_paid_pence`, so a deposit learner's progress toward £1,599 is genuinely live.

Backfill: a one-off script listing Stripe Checkout Sessions (the restricted key can now read them) matched against `legacy_referral_names`, plus the existing Sheet for anything older. Anything predating `gym_referral` is unrecoverable — accept it.

**Sales view:** date · learner name · plan · payment progress · status · commission · payout status. Filters by month and status. Summary cards for total enrolments / earned / paid / outstanding.

**Payments view:** payout list with status and reference, plus a downloadable invoice PDF generated with the existing `pdfkit` pattern. Self-billing (you raise the invoice on their behalf) is the right model — it needs a self-billing clause in the agreement, see §6.

### 5.4 `/partners/playbook` — Content & Strategy

**Markdown files in the repo, not a database.** `partner-playbook/*.md` with frontmatter (`type`, `channel`, `title`, `when_to_use`, `tags`). Same call as learning-hub's chapter library, and for the same reason: this is content you will constantly rewrite, and a DB turns every copy tweak into a data migration. You update it by committing markdown.

Rendered as a filterable card grid:

- **Social posts** — captions with `[GYM NAME]` placeholders, per platform
- **Emails** — member announcement, re-engagement, "your PT wants to qualify"
- **In-gym scripts** — front desk, PT-to-member, tour close
- **Campaign plays** — January intake, QR poster push, member referral
- **Funnel ideas** — the longer strategic pieces

Every card has a copy-to-clipboard block. Nothing personalised, nothing generated — a library you curate.

---

## 6. Decisions

### 6.1 Commission release — DECIDED: accrue at enrolment, hold until instalment 2

Commission accrues the moment the sale lands, so the partner sees it immediately. Payout is held until the money behind it is real.

| Plan | Release rule | Typical wait |
|---|---|---|
| Pay in full (≥ £1,300) | `enrolled_at + 30 days` — unchanged from the agreement | 30 days |
| Deposit (£599 + 5 × £200) | On the **2nd** `invoice.paid` with `billing_reason = subscription_cycle` (≈ £999 collected), then + 30 days | ~90 days |

Implementation: set `commission_release_at` at sale time for PIF. For deposits leave it `null` and stamp it from the existing `invoice.paid` handler once `countSettledInstalments() >= 2`. That counter already exists and is idempotent — reuse it, don't write a second one.

**⚠️ This is a variation to the signed agreement**, which says 30 days after confirmed enrolment with no instalment condition. Existing signed partners are contractually owed the original terms — either honour the old terms for them and apply the new rule to partners signed from here, or issue a variation letter. **Do not apply this retroactively without telling them.** The agreement template in `generatePartnershipAgreementPDF.server.ts` needs the new clause before the next partner signs.

The partner UI must make the hold visible and unsurprising — show the sale as "Accrued · releases after 2nd instalment" with the expected date, never as a bare pending balance.

### 6.2 Learner data — DECIDED: name + enrolment date only

`learner_email` is stored (needed for reconciliation and support) but never rendered in any `/partners` view or export. No privacy-policy or agreement change needed. If a partner disputes a referral, resolution goes through you, not through exposing the record.

Enforce it at the query layer, not the component — the `/partners` data functions should select an explicit column list that omits `learner_email`, so a future UI change can't accidentally leak it.

### 6.3 Still open

1. **Clawback.** Refunds and cooling-off cancellations need a `status = refunded` → `commission_status = voided` path. The instalment-2 hold reduces the exposure a lot but doesn't remove it. Not currently in the agreement — worth adding alongside the 6.1 variation, since you're amending it anyway.

2. **Self-billing.** Generating invoices "from" the partner requires a self-billing clause. Otherwise the platform can only *display* what's owed and they invoice you. Deferred with Phase 4 — v1 displays the outstanding total only.

3. **Middleware surface.** The matcher at `middleware.ts:237` runs on nearly everything. Add the partner gate as an explicit path check like `isProtectedAdminPath` — do not broaden the matcher.

---

## 7. Phasing

| Phase | Work | Est. |
|---|---|---|
**v1 = Phases 0–3, ~6 working days.** Phases 4 and 5 are additive and rework nothing.

| Phase | Work | Est. | In v1 |
|---|---|---|---|
| **0** | `gymSlug` migration across the 9 partner configs; `pp_partners` seeded | 0.5 day | ✅ |
| **1** | Supabase Auth + middleware gate + `/partners` shell + forced password change + My Academy home (link, promo, QR) | 2 days | ✅ |
| **2** | Resource Drive: bucket, signed downloads, admin upload page | 1.5 days | ✅ |
| **3** | Tracking: `pp_sales`, webhook write, commission release rules, backfill script, sales table + filters | 2 days | ✅ |
| **4** | Payouts + self-billed invoice PDFs | 1.5 days | — |
| **5** | Full playbook library | 1 day | — |

**What v1 ships without:** `/partners/payments` shows the outstanding total and release dates but no invoice PDFs — those arrive by email as they do now. `/partners/playbook` ships with three markdown files to prove the pattern; filling the library is writing work, not build work, and can happen continuously after launch.

---

## 8. Sequencing notes

- Phase 3 depends on Phase 0. If the `gymSlug` migration slips, build Phases 1 and 2 anyway — neither touches attribution.
- The agreement clause change in §6.1 should land **before** the next partner signs, independently of the build.
- Phase 3's commission-release logic hooks the existing `invoice.paid` handler. Re-read `countSettledInstalments()` before touching it — it is idempotent by design and the Stripe API version on that endpoint (`2025-07-30.basil`) has non-obvious invoice shapes already handled there.
