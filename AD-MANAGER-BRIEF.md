# PT Launch Lab — Ad Manager Brief

**Site:** https://ptlaunchlab.co.uk
**Brand:** PT Launch Lab (NCFE Level 2 + Level 3 Personal Trainer course, UK, online)
**Headline price:** £1,599 PIF or £599 deposit + 5 × £200 (with funnel promo: £1,399 / £599 + 4 × £200)
**Geo:** UK-wide; Yorkshire emphasis on homepage hero (geo-personalised)
**Primary KPI:** Lead → WhatsApp warm-up → free 15-min call → enrolment
**Primary lever:** Drive cold traffic to one of 3 avatar pages OR to /quiz, capture lead, enter 48h £200-off funnel + WhatsApp + MailerLite warm-up.

---

## 1. Meta Account Setup

| Item                      | Value                                                                 |
|---------------------------|-----------------------------------------------------------------------|
| Meta Ad Account ID        | `act_3635881119973565`                                                |
| Pixel / Dataset ID        | `1133525198707842` (named "PT LAUNCH LAB - WEBSITE")                  |
| Old pixel (RETIRED)       | `1988881834762642` — do NOT use, retired 2026-05-22                    |
| CAPI Access Token         | Set in Vercel env as `META_CAPI_ACCESS_TOKEN` (generated from the dataset above) |
| CAPI dedup mechanism      | Browser `fbq` + server CAPI fire same `event_id` (UUID per submit / Stripe session id for purchases). 7-day dedup window on (event_name, event_id) |
| Test event code env       | `META_CAPI_TEST_EVENT_CODE` (optional, for Events Manager → Test Events) |
| Facebook Page             | https://www.facebook.com/profile.php?id=61583011678458                |
| Instagram                 | @ptlaunchlab                                                          |
| TikTok                    | @pt.launch.lab                                                        |
| YouTube                   | https://www.youtube.com/@ptlaunchlab                                  |
| Companies House           | 16596168 (PT Launch Lab Ltd)                                          |

---

## 2. Ad-Ready Funnel Pages (use these for traffic, not /courses or homepage)

### A. AVATAR LANDING PAGES (cold-traffic Meta ads — the primary funnels)

Each one is built for one segment, with an inline 3-field lead form in the hero (HeroLeadForm component). Form submit:
- Fires browser `fbq('Lead')` + server CAPI Lead (deduped)
- Sets 48-hour £200-off promo cookie
- Pushes to Zapier → MailerLite → WhatsApp warm-up
- Switches form to a countdown "Book Your Free Call" CTA

| Avatar  | URL                                                            | Audience hook                                                              |
|---------|----------------------------------------------------------------|----------------------------------------------------------------------------|
| Starter | `/become-a-personal-trainer-uk?avatar=starter`                 | Young gym-obsessed (16-30). "Practically live in the gym already."         |
| Switcher| `/career-change-to-personal-trainer?avatar=switcher`           | Burned-out 30s/40s. Corporate/hospitality/sales. Can't quit yet — needs a believable transition. |
| Returner| `/retrain-as-a-personal-trainer?avatar=returner`               | Parents and returners (35-55, women-heavy). Kids, school run, midlife, postnatal. |

**Use `?avatar=starter|switcher|returner` on ad URLs.** The quiz, prospectus form, and CAPI payload all read it. Already wired for segmented retargeting.

### B. QUIZ FUNNEL

| URL                                              | Purpose                                                                  |
|--------------------------------------------------|--------------------------------------------------------------------------|
| `/quiz?avatar={starter\|switcher\|returner}`     | 5-question career-fit quiz → 4 result archetypes (On-Floor / Online / Hybrid / Already-Qualified) → mobile + email/name capture → 48h £200 promo cookie + WhatsApp + MailerLite + CAPI Lead |

Pre-tagging via `?avatar=` carries through into the CAPI event's `content_category` field. Quiz already fires `quiz_start`, `quiz_question_answered`, `quiz_complete`, and Lead on submit.

### C. SECONDARY FUNNELS

| URL                              | What it is                                            | Lead event?      |
|----------------------------------|-------------------------------------------------------|------------------|
| `/funnel`                        | General "PT Launch Lab" long-form ad funnel, prospectus modal | Lead via modal   |
| `/book-call`                     | Phone-callback form + Calendly video tab              | Schedule + Lead  |
| `/pt-salary-calculator`          | UK PT income calculator (lead magnet)                 | Lead             |
| `/youtube-discount`              | Subscribe to YouTube → £200 off                       | Lead             |
| `/prospectus/thank-you`          | Post-prospectus opt-in landing (countdown + CTAs)     | (lands here after Lead) |
| `/enrol`                         | Direct-to-Stripe enrolment flow                       | Purchase via Stripe webhook |
| `/enrol/success`                 | Thank-you page (noindex). Fires browser `fbq` Purchase paired with CAPI Purchase from Stripe webhook | Purchase (dedup) |

### D. SEO PILLAR PAGES (use for retargeting only, not cold ads — these are long-form blog-style)

- `/online-personal-trainer-course-uk` (main pillar)
- `/how-to-become-a-personal-trainer-uk` (HowTo + FAQPage schema)
- `/personal-trainer-salary-uk`
- `/too-old-to-become-a-personal-trainer`
- `/are-online-pt-qualifications-recognised-by-uk-gyms`
- `/personal-trainer-mentorship-uk`
- `/self-employed-personal-trainer-uk`
- `/best-personal-trainer-course-uk`
- `/personal-trainer-course-near-me`
- `/personal-trainer-course-with-business-support`

### E. PROGRAMMATIC LOCATION PAGES (28 keyword templates × Yorkshire towns)

Auto-generated `[location]` SEO pages — only worth retargeting visitors of these, not paying cold for them.

Examples:
- `/become-a-personal-trainer-online/leeds`
- `/career-change-personal-trainer/sheffield`
- `/ncfe-level-3-pt-qualification/wakefield`
- (full list in `app/lib/yorkshireLocations.ts`)

---

## 3. Meta Standard Events Wired (USE THESE FOR OPTIMISATION)

All events fire both browser `fbq` AND server CAPI with shared `event_id` for dedup.

| Event              | Fires where                                              | When to use as optimisation event              |
|--------------------|----------------------------------------------------------|------------------------------------------------|
| `PageView`         | Every page (browser only — covers all routes)            | Awareness / reach campaigns                    |
| `Lead`             | Quiz submit, Prospectus form, HeroLeadForm (avatar pages)| **Primary cold-traffic optimisation event**    |
| `Schedule`         | `/book-call` phone-callback form submit                  | Mid-funnel optimisation                        |
| `Purchase`         | Stripe webhook fires CAPI; `/enrol/success` fires browser fbq | Bottom-funnel — needs ~30-50 events to optimise. Use Lead until then |

**Custom data attached on every Lead:**
- `content_name` — e.g. `prospectus_download` / `quiz_result_onFloor` / etc.
- `content_category` — the avatar slug (`starter` / `switcher` / `returner`)
- `currency` = `GBP`
- `value` = 0 on Lead, actual £ amount on Purchase
- Hashed PII: email, phone, first/last name, country (`gb`)
- `fbp`, `fbc`, IP, UA — automatically extracted from request (matched with browser pixel)

---

## 4. Ready-Made Audience Definitions (build these in Audiences)

### Custom Audiences
1. **All site visitors (30/60/90 days)** — Pixel: All visitors
2. **Quiz starters who didn't submit** — URL contains `/quiz` AND no Lead in 30 days
3. **Avatar visitors (3 separate audiences)** — URL contains `?avatar=starter` (etc.) — 30/90 days
4. **Prospectus thank-you viewers (high-intent, no purchase)** — URL contains `/prospectus/thank-you` AND no Purchase in 14 days
5. **Book-call viewers, no Schedule** — URL contains `/book-call` AND no Schedule in 14 days
6. **Enrolment-page bounces** — URL contains `/enrol` AND no Purchase in 7 days (warmest of all)
7. **All leads (Lead event)** — for value-based optimisation seed
8. **Purchasers (Purchase event)** — exclude from all cold + most warm campaigns
9. **Engaged FB/IG page** — last 365 days (any engagement)

### Lookalikes (build off the most-converting source)
1. **LAL 1% UK — Purchasers** (once 100+ purchases)
2. **LAL 1% UK — High-intent leads** (Lead → Schedule completes)
3. **LAL 2-5% UK — Quiz completers** (highest-volume seed)

---

## 5. Suggested Campaign Architecture

### Campaign 1 — Cold Acquisition (CBO, Lead event optimisation)
| Ad Set         | Audience                                          | Avatar landing                                            |
|----------------|---------------------------------------------------|-----------------------------------------------------------|
| Starter        | UK 18-30, fitness/gym interests, broad           | `/become-a-personal-trainer-uk?avatar=starter`            |
| Switcher       | UK 28-45, salaried/office workers, broad         | `/career-change-to-personal-trainer?avatar=switcher`      |
| Returner       | UK 32-55, women bias, parents, fitness interests | `/retrain-as-a-personal-trainer?avatar=returner`          |
| Quiz (broad)   | UK 18-50, broad fitness interest, no narrowing   | `/quiz?avatar=starter` (rotate variants by ad copy)       |

**Optimisation:** `Lead` event for first 2-4 weeks. Move to `Purchase` only when account hits 50+ purchases in a 7-day window per ad set.

### Campaign 2 — Retargeting (CBO, Lead OR Schedule optimisation)
| Ad Set                | Audience                                        | Landing                              |
|-----------------------|-------------------------------------------------|--------------------------------------|
| Quiz incomplete       | Started quiz, no Lead in 14 days                | `/quiz` (no avatar tag — neutral)    |
| Avatar visitor + no Lead | Avatar URL visit, no Lead, 14d                 | Same avatar URL (re-entry)            |
| Lead, no Schedule     | Lead in 30d, no Schedule                        | `/book-call`                         |
| Schedule, no Purchase | Schedule in 30d, no Purchase                    | `/enrol` (direct enrolment)          |

### Campaign 3 — Authority / Brand (Engagement → Cold seed)
- Podcast clips (EP6 Ryan, EP8 Mac Livock, EP12 Gemma)
- Callum/Miles/Ryan founder UGC
- Optimise: ThruPlay / Engagement → builds video-view custom audiences

---

## 6. Approved Brand Assets / Voice

- **Logo:** `/logo.png` on site root
- **OG image:** `/og-image.png` (1200×630)
- **Brand colours (Tailwind tokens):**
  - `deep` #070D1B (very dark navy bg)
  - `base` #081729
  - `card` #102342
  - `gold` #F5C518 (primary CTA / accent)
  - `blue` #3B82F6 (secondary)
  - White for body text
- **Display font:** Barlow Condensed (extra-bold, tight tracking) — for ad headlines
- **Body font:** Poppins
- **Voice:**
  - Gym-owner authority, honest, zero hype
  - Anti–"£29 weekend course"
  - "We don't just qualify you — we help you get clients"
  - Names: Callum (Head of Education), Miles (Business Mentor), Ryan (Co-founder, Operations). All faceable on `/callum.webp`, `/miles.webp`, `/ryan.webp`
- **Style:** Faces > infographics, video > static, mobile-first vertical
- **Proven hooks (already validated in copy):**
  - "Quit the job you hate. Train for the life you want."
  - "The only PT course run by gym owners who actually hire trainers."
  - "Most PT courses give you a certificate. We give you a career."
  - "80% of newly-qualified UK PTs quit inside 18 months. We built this to fix that."
- **CTAs:**
  - Cold: "Take the Free Quiz →", "See If This Is Right For You →"
  - Mid: "Book Your Free 15-Min Call →"
  - Hot: "Enrol Now — Start Today →"

---

## 7. Authority / Trust Stack (use in ad copy)

- NCFE Level 3 (Ofqual reg 603/4388/6)
- CIMSPA recognised
- 17+ verified 5-star Google reviews
- 500+ PTs hired by founders' network (Ultimate Shred + partner gyms)
- £500K+ revenue built as independent PTs
- 100s of students qualified
- Real partner gyms: Ultimate Shred, 1079 Fitness, 6Fit Gym, Iron Wolf Gym, Leodis Gym, Ebor Fitness, MOF Gym, Muscle Bound Academy, Ironwolf Gym

---

## 8. Lead Flow / What Happens After Form Submit

```
Cold ad
  → Avatar landing page OR /quiz
    → 3-field form OR quiz
      → /api/prospectus or /api/quiz-submission
        ├─ Server CAPI Lead (deduped via event_id)
        ├─ 48h £200-off promo cookie set (HMAC signed)
        ├─ Zapier webhook → Google Sheet + MailerLite group
        ├─ Email-nurture server triggered (separate Render service)
        └─ Browser fbq Lead fires same event_id
          → Form swaps to countdown + "Book Your Call" CTA
            → MailerLite 4-email quiz/prospectus nurture sequence
            → WhatsApp warm-up sequence (auto-confirmation via Twilio/Meta WABA: ID 1192794446192902)
              → Callum / Miles / Ryan personal follow-up
                → /book-call → Schedule event
                  → /enrol → Stripe checkout
                    → Stripe webhook → Server CAPI Purchase (deduped with browser fbq Purchase)
```

---

## 9. Promo Mechanic — 48h £200 Off

- Triggered automatically on Lead submit from quiz, prospectus, or hero form
- HMAC-signed cookie `ptll_promo` set for 48h
- Pricing block components on funnel pages render struck-through £1,599 → £1,399 with countdown
- Hard-blocked: discounted Payment Link only reachable via `/api/funnel-promo/checkout` with valid cookie
- **DO NOT advertise the £200 off as a public price.** Public `/courses` stays at £1,599.

Stripe Payment Links:
- Full PIF £1,599: `https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f`
- Discounted PIF £1,399 (funnel-only): `https://buy.stripe.com/fZuaER6ME7hi0Ma0o2fEk06`
- Deposit £599 (5 × £200, or 4 × £200 if funnel-flag): `https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05`

---

## 10. UTM Conventions

Use these so attribution lands in GA4 Funnels + the Stripe webhook GA4 Measurement Protocol pipeline.

```
?utm_source=meta
&utm_medium=paid-social
&utm_campaign={campaign_name}
&utm_content={ad_name|creative_id}
&utm_term={audience_segment}
&avatar={starter|switcher|returner}        ← REQUIRED on avatar/quiz pages
&fbclid={{ad.id}}                           ← Meta auto-appends if URL parameter mode is on
```

Touch attribution captured first-touch + last-touch via localStorage on every site visit, then bundled into Stripe `client_reference_id` so the Purchase event carries the full attribution chain.

---

## 11. What's Already Live vs. To-Do

### ✅ Live
- Meta Pixel `1133525198707842` (lazyOnload in `app/layout.tsx`)
- CAPI for Lead, Schedule, Purchase (server-side, hashed PII)
- Cookie-consent / Consent Mode v2 (CookieYes ID `04abe099864c49fd5daf17ec`)
- GA4 (`G-90W2KGSL55`) + Stripe webhook → GA4 MP server-side Purchase
- Microsoft Clarity (heatmaps, ID `w0qwj7lviw`)
- 3 avatar pages + quiz + prospectus + book-call + enrol all wired
- 48h £200 promo cookie
- WhatsApp warm-up sequence
- MailerLite automations (4 sequences live)

### 🟡 Verify before launch (see Audit section)
- `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` set in Vercel Production env (CAPI silently no-ops if missing)
- CAPI Test Events tab shows a recent Lead event with `event_match_quality ≥ 7.0`
- Aggregated Event Measurement: confirm domain `ptlaunchlab.co.uk` is verified in Meta Business Settings + 8 prioritised events configured (Purchase > Schedule > Lead > … )
- iOS 14.5+ / ATT: ensure top-priority conversion event is `Purchase` once volume supports it; otherwise `Lead`
