# PT Launch Lab — June 2026 Meta Ads Launch Runbook

**Status:** Ready for ad manager to build in Meta Ads Manager.
**v1 launch format: STATIC IMAGE ads only** (no videos in week 1 — video assets queued for Phase 2 once first-week data is in).
**Total daily budget:** £20/day (£16 cold + £4 retargeting) = £600/month.
**Ad account:** `act_3635881119973565`
**Pixel/Dataset:** `1133525198707842` (PT LAUNCH LAB - WEBSITE)
**Primary KPI:** Lead → Schedule → Purchase
**Optimisation event for first 2-4 weeks:** `Lead` (not Purchase — volume too low to optimise on the bottom event yet)

> **Static-only caveat:** Static images on Meta historically deliver lower CTR than video (1–1.5% vs 2%+ on UGC video), but they're faster to iterate, cheaper to produce, and the data is what informs the eventual video direction. Expect CPL on the higher end of the target range (£15–£22) until video creative lands in Phase 2. Don't panic-kill on day 3.

---

## ⚠️ 24-Hour Pre-Launch Checklist (MUST complete before any ad goes live)

### Vercel environment variables (Production)
| Var | Status to verify | Why critical |
|---|---|---|
| `META_PIXEL_ID` | `1133525198707842` | Without this, CAPI silently no-ops |
| `META_CAPI_ACCESS_TOKEN` | Generated from Events Manager → dataset `1133525198707842` → Settings → Conversions API → Generate Access Token | Without this, CAPI silently no-ops — Lead/Schedule/Purchase events only fire browser-side, EMQ drops, iOS/Safari conversions disappear |
| `PTLL_PROMO_SECRET` | 32+ char random string | Already set per memory; verify still present |
| `QUIZ_ZAPIER_WEBHOOK_URL` | Set | Quiz leads flow to MailerLite |
| `PROSPECTUS_ZAPIER_WEBHOOK_URL` | Set | Hero-form leads flow to MailerLite |
| `STRIPE_WEBHOOK_SECRET` | Set | Purchase CAPI fires from here |
| `GA4_MEASUREMENT_ID` | `G-90W2KGSL55` | GA4 server-side Purchase |
| `GA4_API_SECRET` | Set | GA4 server-side Purchase |

### Meta Business Manager UI setup (one-time, see `META-READINESS-AUDIT.md` for full checklist)
- [ ] Domain `ptlaunchlab.co.uk` verified (Business Settings → Brand Safety → Domains)
- [ ] Aggregated Event Measurement: priority order set as **Purchase → Schedule → Lead → InitiateCheckout → ViewContent → PageView** (max 8 events per domain)
- [ ] CAPI Test Events tab: fire a test Lead from the live site, confirm it lands with `event_match_quality ≥ 7.0`
- [ ] iOS 14.5+ ATT prompt acknowledged in account settings

### Smoke tests on the live site
- [ ] `/quiz` loads in incognito, can complete to result screen
- [ ] `/become-a-personal-trainer-uk?avatar=starter` hero form submits without error
- [ ] `/career-change-to-personal-trainer?avatar=switcher` hero form submits without error
- [ ] `/retrain-as-a-personal-trainer?avatar=returner` hero form submits without error
- [ ] Vercel logs (`/api/quiz-submission` and `/api/prospectus`) show 200s with `[meta-capi]` confirmation lines
- [ ] Meta Pixel Helper Chrome extension shows the pixel firing on landing + Lead firing on form submit

---

## Campaign 1 — Cold Traffic

**Setup**
- Objective: **Leads**
- Conversion location: **Website**
- Performance goal: **Maximise number of leads**
- Conversion event: **Lead** (NOT Purchase — too early)
- Budget mode: **CBO off** (use ad-set-level budgets so each avatar gets dedicated learning)
- Total daily: **£16/day**

**Ad sets — one per avatar**
| Ad set name | Budget/day | Audience size target | Landing page |
|---|---|---|---|
| Cold · Career Switcher | £8 | 800K–2M | `/career-change-to-personal-trainer?avatar=switcher` |
| Cold · Gym Starter | £5 | 500K–1.5M | `/become-a-personal-trainer-uk?avatar=starter` |
| Cold · Returner | £3 | 400K–1M | `/retrain-as-a-personal-trainer?avatar=returner` |

### Audience targeting per ad set

**Career Switcher**
- Location: United Kingdom
- Age: 28–40
- Gender: All
- Detailed targeting: **Interests** — Personal trainer, Physical fitness, Bodybuilding, Strength training, Fitness and wellness; **Behaviours** — Frequent gym-goers (if available)
- Detailed targeting expansion: **ON** (Meta has learned a lot in 18 months)
- Excludes: Purchasers (Pixel Purchase event, 180 days), All Leads (Pixel Lead event, 30 days)
- Languages: English (UK)
- Placements: **Advantage+ (automatic)**

**Gym Starter**
- Location: United Kingdom
- Age: 18–30
- Gender: All (but expect male skew naturally)
- Detailed targeting: **Interests** — Bodybuilding, Personal trainer, Powerlifting, Crossfit, Fitness and wellness, Gym; **Behaviours** — Recently used a fitness app (if available)
- Detailed targeting expansion: **ON**
- Excludes: Purchasers, All Leads (30 days)
- Placements: **Advantage+ (automatic)**

**Returner**
- Location: United Kingdom
- Age: 32–55
- Gender: All (expect female skew naturally — don't gender-restrict, Meta will optimise)
- Detailed targeting: **Interests** — Personal trainer, Physical fitness, Yoga, Pilates, Postnatal fitness, Women's health, Parenting; **Behaviours** — Parents (all)
- Detailed targeting expansion: **ON**
- Excludes: Purchasers, All Leads (30 days)
- Placements: **Advantage+ (automatic)**

---

## Campaign 2 — Retargeting

**Setup**
- Objective: **Leads**
- Conversion event: **Lead**
- Budget: **£4/day** (CBO across 2 ad sets, £2/day each)

**Audiences — build these in Meta Audiences BEFORE launching**

> v1 has no video viewer audience because we're launching static-only. Replaced with deeper-page-viewer audiences which are higher-intent anyway.

1. **RT · Quiz Starters No Lead** — URL contains `/quiz` AND NOT URL contains `/book-call` AND NOT `Lead` event in last 30 days. Window: 30 days.
2. **RT · Avatar Visitors No Lead** — URL contains any of `become-a-personal-trainer-uk`, `career-change-to-personal-trainer`, `retrain-as-a-personal-trainer` AND NOT `Lead` event in last 30 days. Window: 30 days.
3. **RT · Deep Page Viewers No Lead** — URL contains `/courses` OR `/about` OR `/online-personal-trainer-course-uk` AND NOT `Lead` event in last 30 days. Window: 30 days. (Higher-intent than feed scrollers.)
4. **RT · IG / FB Engagers** — Engaged with PT Launch Lab IG or FB page (sent message, saved post, visited profile). Window: 365 days.

**Ad set split**
| Ad set name | Budget/day | Audience |
|---|---|---|
| RT · Engaged No Lead | £2 | Union of audiences 1 + 2 |
| RT · Awareness (deep page + social) | £2 | Union of audiences 3 + 4, EXCLUDE Lead event 30d |

Both ad sets exclude: Purchasers (180d), All Leads (14d — to give them a breather post-Lead).

---

## Ads — Full Spec Sheet

### COLD AD 1 — Career Switcher (Primary, £8/day)

| Field | Value |
|---|---|
| Format | **Single static image** |
| Aspect ratios to produce | 1:1 (1080×1080) for feed + 9:16 (1080×1920) for Stories/Reels placement |
| Visual direction | **Hook image — text-heavy.** Dark navy `#072B4A` background, gold accent `#F5C518`. Large bold headline (`Stuck In A Job You Hate?`) in white Barlow Condensed. Subline in lighter weight: "There's a real route into PT — and you don't need a degree." Optional small founder photo bottom-right (Callum or Miles). PT Launch Lab logo top-left. |
| Image variants to test (2 max) | A: text-only ("Stuck In A Job You Hate?"). B: text + a real candid photo of a 30-something looking out an office window or in a car. |
| Headline | `Sick Of Working A Job You've Outgrown?` |
| Description (optional) | `Free 60-second career quiz. NCFE Level 2 + 3, fully online.` |
| CTA button | `Learn More` |
| Destination URL | `https://ptlaunchlab.co.uk/career-change-to-personal-trainer?avatar=switcher&utm_source=meta&utm_medium=paid-social&utm_campaign=cold-switcher&utm_content=ad1-switcher-static-A` |

**Primary text (copy-paste):**

```
If you've mentally checked out of your job already… read this.

You don't hate working hard.

You hate building somebody else's future.

Most people considering personal training are NOT trying to become influencers.

They just want:
• more freedom
• meaningful work
• flexibility
• a career they actually care about

That's exactly why we built PT Launch Lab.

A fully online Level 2 + 3 Personal Trainer qualification designed for real people changing careers.

No degree needed.
No experience required.
Flexible around work and family.

Take the free PT Career Quiz and find out which pathway fits you best.
```

**Phase 2 video script (parked — produce once first-week data confirms the angle):**

```
[0:00 — direct to camera, walking]
If you're waking up every Monday already exhausted… this is probably for you.

[0:08 — change of scene, car or kitchen]
A lot of people think becoming a PT means being shredded… having loads of followers… or already knowing everything.

[0:18]
That's not reality.

[0:20 — natural environment]
Most of our students are working normal jobs, feeling stuck, and trying to build a better future around something they actually care about.

[0:30]
PT Launch Lab helps you become fully qualified online with a realistic pathway into the fitness industry.

[0:38]
If you've ever thought: "Could I actually do something with fitness?"

[0:42]
Take the free PT Career Quiz below.
```

---

### COLD AD 2 — Gym Starter (£5/day)

| Field | Value |
|---|---|
| Format | **Single static image** |
| Aspect ratios to produce | 1:1 (1080×1080) + 9:16 (1080×1920) |
| Visual direction | **Identity hook.** Dark navy bg, gold accent. Headline: "You're Already In The Gym Anyway…" in white Barlow Condensed. Subline: "Stop renting motivation. Start coaching it." Optional silhouette/photo of a gym setting (dumbbells, gym floor) in the background at low opacity, OR full text-on-colour for v1 speed. |
| Image variants to test (2 max) | A: text-only on navy + gold. B: text overlaid on a real gym-floor photo (low-light, candid). |
| Headline | `Turn Your Gym Obsession Into A Career` |
| Description (optional) | `Free 60-second career quiz. NCFE Level 2 + 3, fully online.` |
| CTA button | `Learn More` |
| Destination URL | `https://ptlaunchlab.co.uk/become-a-personal-trainer-uk?avatar=starter&utm_source=meta&utm_medium=paid-social&utm_campaign=cold-starter&utm_content=ad2-starter-static-A` |

**Primary text:**

```
You're already in the gym 5 days a week anyway…

So why are you still working a job you hate?

Most people don't realise there's a clear route to becoming a qualified Personal Trainer in the UK.

No degree.
No university.
No previous coaching experience.

Just a proper pathway into fitness.

PT Launch Lab helps you qualify online and build real coaching confidence — not just pass exams.

Take the free PT Career Quiz and see which PT pathway suits you best.
```

**Phase 2 video script (parked):**

```
[0:00 — gym floor]
You're already in the gym every day…

[0:05]
Your mates already ask you for training advice…

[0:10]
And deep down you know you'd rather build a career around fitness than sit at a desk forever.

[0:18]
The problem is most people have no clue where to start.

[0:24]
PT Launch Lab gives you a clear online route to becoming a qualified Personal Trainer in the UK.

[0:32]
No degree needed. No experience needed.

[0:37]
Take the free PT Career Quiz below and find out which PT path fits you best.
```

---

### COLD AD 3 — Returner (£3/day)

| Field | Value |
|---|---|
| Format | **Single static image** |
| Aspect ratios to produce | 1:1 (1080×1080) + 9:16 (1080×1920) |
| Visual direction | **Softer tone — important.** Dark navy bg but warmer accent. Headline: "Ready For Something That's Yours Again?" in white Barlow Condensed. Subline: "A flexible PT qualification built for real life — kids, mortgage, school run." Avoid aggressive gym-bro imagery entirely. If using a photo, a warm domestic environment (kitchen morning light, garden) reads much better than gym kit. |
| Image variants to test (2 max) | A: text-only on navy. B: text overlaid on warm domestic photo (mug of coffee, soft morning light, no faces — leaves room for the viewer to project themselves). |
| Headline | `Ready For Something That's Yours Again?` |
| Description (optional) | `Free 60-second career quiz. NCFE Level 2 + 3, fully online.` |
| CTA button | `Learn More` |
| Destination URL | `https://ptlaunchlab.co.uk/retrain-as-a-personal-trainer?avatar=returner&utm_source=meta&utm_medium=paid-social&utm_campaign=cold-returner&utm_content=ad3-returner-static-A` |

**Primary text:**

```
Feel like life became about everybody else for a while?

A lot of our students are:
• mums
• career returners
• women rebuilding confidence
• people wanting something that finally feels theirs again

You do NOT need to:
• look like a fitness influencer
• be super confident already
• have previous coaching experience

PT Launch Lab was built to give real people a realistic pathway into fitness.

Flexible online learning.
Industry-recognised qualification.
Support throughout.

Take the free PT Career Quiz and see which PT pathway suits you best.
```

**Phase 2 video script (parked):**

```
[0:00 — soft, direct to camera]
Maybe confidence has taken a hit.

[0:05]
Maybe life became about everyone else for a while.

[0:10]
And now you want: something flexible, something meaningful, and something that feels like yours again.

[0:20]
That's why we built PT Launch Lab.

[0:25]
A flexible online PT qualification built for real people rebuilding confidence and creating a new future.

[0:35]
Take the free PT Career Quiz below and see which path fits you best.
```

---

### RETARGETING AD 1 — "Most PT Courses Leave You Stuck" (£2/day)

| Field | Value |
|---|---|
| Format | **Single static image** — bold typography on dark navy bg, gold accent |
| Aspect ratios to produce | 1:1 + 9:16 |
| Visual direction | Headline `Most PT Courses Leave You Stuck` dominates. Subline: "We don't." Comparison-style layout (Most courses ✕ vs PT Launch Lab ✓) works well at this stage — visitor has already seen the brand, so contrast positioning lands harder. |
| Headline | `Most PT Courses Leave You Stuck` |
| CTA button | `Learn More` |
| Destination URL | `https://ptlaunchlab.co.uk/quiz?utm_source=meta&utm_medium=paid-social&utm_campaign=rt-stuck&utm_content=rt1-stuck-static` |
| Audience | RT · Engaged No Lead |

**Primary text:**

```
Most PT courses give you a certificate…

Then leave you to figure everything else out yourself.

That's exactly why so many newly-qualified PTs struggle to:
• get clients
• build confidence
• earn consistently

PT Launch Lab was built differently.

We focus on:
• real coaching confidence
• business support
• client acquisition
• long-term career growth

Take the free PT Career Quiz and see which pathway fits you best.
```

---

### RETARGETING AD 2 — "Too Old / Too Inexperienced / Too Late" (£2/day)

| Field | Value |
|---|---|
| Format | **Single static image** |
| Aspect ratios to produce | 1:1 + 9:16 |
| Visual direction | Headline `Too Late To Become A PT? Not Quite.` with three bullet points underneath (too old? / too inexperienced? / too late to start?) each struck through with the gold tick. Final line: "Most start with zero clients, no coaching experience, no idea where to start." |
| Headline | `Too Late To Become A PT? Not Quite.` |
| CTA button | `Learn More` |
| Destination URL | `https://ptlaunchlab.co.uk/quiz?utm_source=meta&utm_medium=paid-social&utm_campaign=rt-objection&utm_content=rt2-toolate-static` |
| Audience | RT · Awareness (engaged + IG) |

**Primary text:**

```
Worried you're:
• too old?
• too inexperienced?
• too late to start?

Most students at PT Launch Lab begin with:
• zero clients
• no coaching experience
• no idea where to start

You do NOT need to be an influencer to become a great coach.

Take the free PT Career Quiz and find your best-fit pathway into fitness.
```

---

## Creative Production Checklist (v1 = Static Images)

### Image assets to produce (10 total = 5 ads × 2 aspect ratios)

All exports at 1080×1080 (1:1, feed) AND 1080×1920 (9:16, Stories/Reels).

| # | Ad | Headline text | Visual approach | Variant test |
|---|---|---|---|---|
| 1 | Cold · Switcher | `Stuck In A Job You Hate?` | Text-dominant on navy + gold. Subline: "There's a real route into PT — and you don't need a degree." | A: text only · B: text over candid photo (30-something at desk/in car) |
| 2 | Cold · Starter | `You're Already In The Gym Anyway…` | Text-dominant. Subline: "Stop renting motivation. Start coaching it." | A: text only · B: text over gym-floor photo (low-light, candid) |
| 3 | Cold · Returner | `Ready For Something That's Yours Again?` | Warmer tone. Text-dominant. Subline: "A flexible PT qualification built for real life — kids, mortgage, school run." | A: text only · B: text over warm domestic photo (no faces — coffee mug, morning light) |
| 4 | RT 1 | `Most PT Courses Leave You Stuck` | Comparison ✕ vs ✓ list. Brand-consistent navy + gold. | Single variant |
| 5 | RT 2 | `Too Late To Become A PT? Not Quite.` | Headline + 3 struck-through objections (too old / too inexperienced / too late). | Single variant |

### Static image creative rules
- **Dimensions:** 1080×1080 (feed) + 1080×1920 (Stories/Reels) — both required per ad
- **File format:** PNG or JPG, under 30MB
- **Text overlay rule:** Meta no longer penalises >20% text but mobile feed still reads better when text fits the middle 60% of the frame
- **Typography:** Barlow Condensed (extra-bold) for headlines, Poppins for sublines — same as the site
- **Colours:**
  - Primary background: deep navy `#072B4A`
  - Card/accent BG: `#0D3559` or `#102342`
  - Headline text: white `#FFFFFF`
  - Accent / CTAs / Highlights: gold `#F5C518`
  - Soft text: `#B4C2D6`
- **Branding:** PT Launch Lab logo top-left, small (max 80px height in 1080×1920)
- **DO NOT:** stock-photo people in fitness gear, generic blue corporate gradients, neon scarcity overlays, fake "expires soon" badges
- **DO:** founder candid photos (Callum/Miles/Ryan from `/callum.webp` `/miles.webp` `/ryan.webp` available), real learner photos (`/learner-1.png` through `/learner-12.png` available), gym-floor reality shots

### Tools to produce
- Canva (template-driven, fastest)
- Figma (if your designer prefers — paste in the brand tokens above)
- AI image generation: only as background/abstract textures, NOT for faces or anything claiming to be a person

### Phase 2 — videos (queued, NOT launching with these)
Video scripts for all 5 ads are documented above under each ad section ("Phase 2 video script (parked)"). Film these once first-week data confirms which avatar angle is converting hardest. Plan to launch Phase 2 videos by end of June if v1 clears CPL <£20.

---

## UTM Convention (already baked into URLs above)

```
?utm_source=meta
&utm_medium=paid-social
&utm_campaign={campaign-name}    e.g. cold-switcher, rt-stuck
&utm_content={ad-name}            e.g. ad1-switcher-ugc
&avatar={starter|switcher|returner}    REQUIRED on avatar/quiz URLs
```

`fbclid` is appended automatically by Meta when "Build a URL Parameter" is configured at ad-set level. Verify in Meta Ads Manager → Ad → URL Parameters → `fbclid={{ad.id}}`.

---

## KPI Targets — June 2026 (Static-only v1)

| Metric | Target | Kill threshold |
|---|---|---|
| CTR (link click) | **1.2–1.8%** (static benchmark — video would target 2%+) | <0.7% after 3 days = pause |
| CPC | £1–£2.50 | £3.50+ after 5 days = pause |
| Landing → Lead conversion | 6–10% | <4% = landing page issue, not creative |
| Quiz completion rate (started → submitted) | 55%+ | <40% = friction issue |
| **CPL** (cost per Lead) | **£15–£22** (static-only realistic) | **£28+ after 5 days = pause and rebuild creative** |
| Calls booked (Schedule event) | 4–10/month | Track separately |
| Enrolments (Purchase event) | 1–2/month at this budget | Track separately |

> Once Phase 2 videos go live, CTR target rises to 2%+ and CPL target drops back to £8–£20.

### When-to-kill matrix

| Day | Spend | Decision |
|---|---|---|
| 0–1 | £16 | **NEVER kill.** Meta is still learning. Do not even check obsessively. |
| 2–3 | £32–48 | Check CTR only. <0.7% CTR = pause. Otherwise leave alone. |
| 4–5 | £64–80 | Full review. CPL >£28 = pause. CPL £15–£22 = scale up. Between = wait another 2 days. |
| 7+ | £100+ | Optimise budget allocation between ad sets. Move budget from worst-performing avatar to best. Swap B variant (image+photo) for A variant (text-only) on any avatar where A is winning by >30% CPL. |
| 14+ | £200+ | If CPL is sub-£22, plan Phase 2 video production. Refresh static creative for any ad with frequency >2.5. |

### Most important rule

**DO NOT judge performance in the first 24-48 hours.** Meta's algorithm needs 50+ events before it stabilises. At £16/day cold + £20 CPL, that's 5-7 days minimum. Killing ads early resets the learning phase and burns the spend.

The only exception: CTR under 1% after 72 hours = the creative is broken, kill and replace.

---

## Day-by-Day Monitoring Schedule (First 14 days)

| Day | Action |
|---|---|
| Day 0 (launch) | Verify ads are "Active" not "In Review". Check first 10 impressions land. Walk away. |
| Day 1 | One quick check at 24h — no decisions. Just confirm no policy rejections. |
| Day 2 | Check CTR per ad. If any <1%, flag for kill on day 3. No budget changes. |
| Day 3 | Pause any ad with CTR <1%. Otherwise no changes. |
| Day 5 | Full review. Sort by CPL. Pause anything >£25 CPL. Note which avatar is converting best. |
| Day 7 | Budget reallocation between ad sets — move 30% of worst performer's budget to best performer. |
| Day 10 | Check Meta Events Manager → Test Events / Deduplication. Verify CAPI is firing matched with browser fbq. EMQ should be ≥7.0 by now. |
| Day 14 | Creative refresh planning — any ad with frequency >2.5 needs a fresh variant queued. |

---

## What's already live and waiting for traffic

- ✅ All 3 avatar landing pages with HeroLeadForm hero capture
- ✅ Quiz with `?avatar=` pre-tagging
- ✅ Meta Pixel (afterInteractive strategy, SPA PageView fires on route change)
- ✅ Meta CAPI for Lead, Schedule, Purchase, InitiateCheckout — all paired with browser fbq via event_id dedup
- ✅ 48h Priority Intake Incentive promo cookie (£200 off, fires on quiz/prospectus/hero-form submit)
- ✅ MailerLite 4-email quiz + prospectus nurture sequences
- ✅ WhatsApp warm-up sequence (auto-triggered)
- ✅ GA4 funnel reports + server-side Purchase via Stripe webhook
- ✅ Result page rebuild: identity-first flow, avatar-specific social proof, founders block, why-most-PTs-fail, future pacing, what-happens-next, not-for-everyone

---

## Open items before go-live (assign to Callum)

- [ ] Confirm `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` in Vercel Production
- [ ] Complete Meta Business Manager domain verification + AEM priority order (see META-READINESS-AUDIT.md)
- [ ] Produce 5 static ad image sets — each at 1080×1080 + 1080×1920 (10 files total). A/B variants for the 3 cold ads (text-only vs text-over-photo) = up to 16 files total if testing both variants.
- [ ] Fire one test Lead from the live site, confirm it lands in Events Manager Test Events with EMQ ≥7.0
- [ ] Review committed code (current uncommitted diff = 4 Meta-readiness fixes + quiz rebuild + IC bounce) — commit when happy
- [ ] Queue Phase 2 video production for week 3 if v1 CPL clears <£22

---

**Once the ad manager has this doc, the 5 static ads + 2 audience sets + 1 campaign architecture are everything they need to build, launch, and monitor for the first 14 days. Phase 2 video creative kicks off in week 3 if v1 metrics validate the angles.**
