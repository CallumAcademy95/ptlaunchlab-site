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

## Campaign 2 — Retargeting (WhatsApp Click-to-Chat)

> **CHANGED 2026-06-05 — killed the IG DM automation.** The IG Click-to-Message + ManyChat test produced **797 clicks / 0 conversations** — a huge intent mismatch. Per the retargeting review: career-changers (28–45, cautious, working parents) trust **WhatsApp** far more than IG DMs, and a ManyChat maze asking them to self-disclose to a bot makes them freeze. RT now opens a **WhatsApp chat with a prefilled, low-pressure message** that a **human replies to** — no bot, no keyword, no flow. Trade-off unchanged: bypasses the pixel Lead event, 48h promo cookie and auto-MailerLite — but the conversation lands in the **already-live `/admin/whatsapp` inbox**. Result metric = **conversations started**. Competitor note: *no* top-tier UK PT advertiser (OriGym, PT Academy) uses click-to-message — genuine white-space.

**Setup**
- Objective: **Engagement** (the Leads objective also works if you want it in the Leads reporting column — either is fine; Engagement is simplest)
- Conversion location: **Messaging apps**
- Messaging app: **WhatsApp only** (untick Messenger + Instagram)
- Performance goal: **Maximise number of conversations**
- CTA button: pick the most WhatsApp-explicit option available (renders with the WhatsApp glyph) — e.g. **Send Message** / **Send WhatsApp Message**
- WhatsApp destination: **`07822012186`** (Callum's usable WhatsApp on the Business app — see v1 routing decision in the WhatsApp section below)
- Prefilled message: set per the WhatsApp section below
- Placements: **Advantage+ (automatic)** — Meta will favour FB + IG feeds/stories where the WhatsApp hand-off is smoothest
- Budget: **£4/day on ONE consolidated ad set** (see note below — do NOT split £2/£2)

> **Budget consolidation:** `Maximise conversations` needs enough conversation volume to exit the learning phase. At £2/day on a small RT pool it will stall. Run **one ad set at £4/day** with both creatives inside it and let Meta pick the winner, rather than two starved £2/day ad sets.

**Audiences — build these in Meta Audiences BEFORE launching**

> Per the retargeting review: messaging ads work on the **warmest** audiences, not all visitors — "click curiosity exists, interaction intent doesn't" is what kills generic-visitor messaging ads. Prioritise by intent; quiz completers + result-page viewers are the hottest. Union all four into the single ad set, but know that 1 + 2 carry it.

1. **RT · Quiz Completers / Result Viewers** *(hottest)* — URL contains `/quiz/result` OR fired `result_screen_viewed`, AND NOT `Lead` in last 30 days. Window: 30 days.
2. **RT · Course / Pricing / VSL Viewers** — URL contains `/courses` OR `/vsl/` OR `/online-personal-trainer-course-uk`, AND NOT `Lead` in last 30 days. Window: 30 days.
3. **RT · Avatar + Quiz Visitors No Lead** — URL contains any of `become-a-personal-trainer-uk`, `career-change-to-personal-trainer`, `retrain-as-a-personal-trainer`, `/quiz`, AND NOT `Lead` in last 30 days. Window: 30 days.
4. **RT · IG / FB Engagers + Repeat Visitors** — engaged with PTLL IG/FB (message, save, profile visit), OR 2+ site sessions. Window: 365 days (engagers) / 30 days (repeat).

**Ad set (single, consolidated)**
| Ad set name | Budget/day | Audience |
|---|---|---|
| RT · WhatsApp Message | £4 | Union of audiences 1 + 2 + 3 + 4 |

Excludes: Purchasers (180d), All Leads (14d — give them a breather post-Lead).
Both RT creatives (RT1 "Stuck" + RT2 "Too Late") run inside this one ad set.

### Replies land in your existing WhatsApp inbox — reply manually (no ManyChat)

The whole point of the switch is to **remove the funnel maze**. There is **no ManyChat, no keyword, no automation flow** in v1. A warm prospect taps the ad → WhatsApp opens with the prefilled message → they hit send → the conversation lands in the **existing `/admin/whatsapp` inbox** (inbound webhook → Supabase, already live) → **a human (Callum / Miles / Ryan) replies personally.** That's it. This is trust conversion, not lead volume — exactly what the 797-clicks/0-conversations result was telling us.

**Prefilled message (set this in the ad — it's what the prospect sends):**
> Hey — I've been looking at PT Launch Lab and just wanted to see whether becoming a PT is realistically doable around full-time work.

*Per-creative variant (optional): RT2 can prefill* `Hey — is it actually too late / am I too old to start as a PT?` *— but keep ONE default if unsure.*

**v1 routing — DECISION (Callum, 2026-06-05): send straight to a usable phone WhatsApp, reply manually.**
Skip the Cloud-API line + web inbox for v1. Point the RT ads — and a "Book a call on WhatsApp" CTA — directly at **Callum's usable WhatsApp: `07822012186`** (`wa.me/447822012186`). Messages arrive as normal WhatsApp chats on the phone; Callum replies manually and books the call in-conversation. No inbox, no automation, no auth dependency — the simplest possible version of the "human replies" model.

**Setup (one-time):**
1. Put `07822012186` on the **WhatsApp Business app** (free; a number can't be on personal WhatsApp *and* the Business app at once — convert it, or use a number that's already on Business).
2. **Connect it to the Facebook Page** (Meta Business Suite → Settings → WhatsApp accounts) so it's selectable as the click-to-WhatsApp ad destination.
3. In the ad: select this number + set the prefilled opener.
4. **"Book a call" path = a wa.me deep link (this IS the automation):** add a CTA button `Chat on WhatsApp` linking to
   `https://wa.me/447822012186?text=Hi%20—%20I'd%20like%20to%20book%20a%20call%20about%20the%20PT%20course`
   on the quiz **result page** + **/book-call**. A prefilled WhatsApp message lands on Callum's phone; he replies and arranges the call manually. No backend, no Zap.

**Tradeoff vs the Cloud-API inbox (`+44 7418 609039` → `/admin/whatsapp`):** the personal-number route is simpler + phone-native + sidesteps the unauthenticated `/admin/whatsapp` risk entirely, BUT you lose the Supabase logging, the central/shared team inbox, and the Phase-B "Mark as Lead → CAPI" hook. Fine for solo manual v1. Revisit the Cloud-API inbox if volume grows or the team needs a shared inbox.

**Lead handling (v1):** result metric in Ads Manager = **conversations started** (messaging objective fires no pixel Lead). When a chat shows real intent, drop the name + number into MailerLite + the lead sheet manually; tag `rt_wa_lead`.

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

### RETARGETING AD 1 — "Most PT Courses Leave You Stuck" (WhatsApp chat)

| Field | Value |
|---|---|
| Format | **Single static image** — bold typography on dark navy bg, gold accent |
| Aspect ratios to produce | 1:1 + 9:16 |
| Visual direction | Headline `Most PT Courses Leave You Stuck` dominates. Subline: "We don't." Comparison-style layout (Most courses ✕ vs PT Launch Lab ✓). **On-image CTA footer must read "Chat on WhatsApp →"** (with a small WhatsApp glyph) — the current PNG says "MESSAGE US 'INFO'"; regenerate the footer so the creative matches the WhatsApp Send-Message button. |
| Headline | `Most PT Courses Leave You Stuck` |
| Conversion location | **Click to message → WhatsApp (`07822012186`)** |
| CTA button | `Send Message` (WhatsApp) |
| Prefilled message | default opener (see WhatsApp section) |
| Audience | RT · WhatsApp Message (consolidated) |

**Primary text:**

```
Most PT courses give you a certificate…

Then leave you to figure everything else out yourself.

That's exactly why so many newly-qualified PTs struggle to:
• get clients
• build confidence
• earn consistently

PT Launch Lab was built differently — personal tutor, £500 mentorship bundled, real client-acquisition help, guaranteed gym interviews.

Want the honest version of how we actually get newly-qualified PTs earning?

Tap below — it opens a WhatsApp chat with us. A real person replies (no bots, no hard sell).
```

---

### RETARGETING AD 2 — "Too Old / Too Inexperienced / Too Late" (WhatsApp chat)

| Field | Value |
|---|---|
| Format | **Single static image** |
| Aspect ratios to produce | 1:1 + 9:16 |
| Visual direction | Headline `Too Late To Become A PT? Not Quite.` with three struck-through objections (too old / too inexperienced / too late). **On-image CTA footer must read "Chat on WhatsApp →"** (with a small WhatsApp glyph) — the current PNG says "DM US 'PT'"; regenerate the footer so it matches the WhatsApp Send-Message button. |
| Headline | `Too Late To Become A PT? Not Quite.` |
| Conversion location | **Click to message → WhatsApp (`07822012186`)** |
| CTA button | `Send Message` (WhatsApp) |
| Prefilled message | variant: `Hey — is it actually too late / am I too old to start as a PT?` |
| Audience | RT · WhatsApp Message (consolidated) |

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

Not sure if it's realistic for YOU specifically? That's the exact question to ask us.

Tap below — it opens a WhatsApp chat. We'll tell you straight whether it's a fit, even if the answer's no.
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
| 4 | RT 1 | `Most PT Courses Leave You Stuck` | Comparison ✕ vs ✓ list. Brand-consistent navy + gold. **Footer CTA: "Chat on WhatsApp →"** + WhatsApp glyph (NOT quiz, NOT "Message us INFO" — these now run as WhatsApp Click-to-Chat ads) | Single variant — REGENERATE footer |
| 5 | RT 2 | `Too Late To Become A PT? Not Quite.` | Headline + 3 struck-through objections (too old / too inexperienced / too late). **Footer CTA: "Chat on WhatsApp →"** + WhatsApp glyph | Single variant — REGENERATE footer |

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

## First-week reality check + Switcher fix plan (2026-06-05)

**The numbers lied in both directions.** Three systems disagreed on week-1 cold results:

| Source | Reported | Verdict |
|---|---|---|
| Meta Ads Manager | 14 leads · £9.81 CPL | **Inflated ~4.7×** (1-day-view attribution + every lead type firing one generic `Lead`) |
| GA4 | 1 quiz_complete | **Under-counted** (client-side/consent loss) |
| **MailerLite (PTLL Quiz group)** | **3 real leads** (phone numbers captured) | ✅ **Ground truth** |

**Real CPL ≈ £46** (3 leads ÷ £137 spent on Switcher). Also: **only Switcher delivered** — Starter (£1.45) and Returner (£0.26) were starved by Advantage Campaign Budget chasing Switcher's *fake* £9.81 CPL.

### Decision: concentrate on Switcher (don't spread £20/day across 3 angles)
At £20/day + ~£46 real CPL, only one angle can reach learning. Switcher is the only one with traction → feed it, fix the measurement, improve the creative, then judge. **Leave Advantage Campaign Budget ON** (it's already concentrating on Switcher — which is now what we want). No restructure.

### ✅ Code fixes shipped (2026-06-05)
- **Phantom Lead gated** — `QuizApp.tsx` now fires `Lead` + `quiz_complete` only when the server returns `lead: true`. Silently-blocked spam/bot submissions return `lead: false` and no longer inflate Meta/GA4 or teach the algorithm to chase junk. (`/api/quiz-submission` returns the flag.)
- **MailerLite push hardened** — the Zapier push retries once and logs `level:lead-lost` on failure instead of silently dropping the lead or 500-ing the submission.

### ⚙️ Meta settings to change (Callum — UI, ~5 min)
1. **Attribution:** set Switcher to **7-day click, NO view** (drop the 1-day-view bucket that's manufacturing most of the phantom leads).
2. **Custom Conversion "PTLL · Quiz Lead":** event `Lead` filtered to `content_category` ∈ {switcher, starter, returner} (quiz Leads set this; prospectus/hero/book-call Leads don't). Lets you report/optimise on *quiz* leads specifically instead of the lumped `Lead`.

### 📏 Scoreboard + decision rule
- **Judge on the MailerLite PTLL Quiz group, never Meta's Lead column.**
- **Bar:** if real (MailerLite) CPL doesn't drop **under ~£25 over the next ~£150 spend** — with fixed tracking + the creative pop applied — that's the signal to split **Starter** into its own £15–20/day campaign and test a fresh angle.

### 🎨 Creative lever (biggest CPL mover)
Apply the **v2 POP LAYER** in `AD-IMAGE-PROMPTS.md` and regenerate Switcher: real founder/learner **face** + solid gold **CTA button** first. Watch the quiz-start rate once tracking is trustworthy.

---

## Open items before go-live (assign to Callum)

- [ ] Confirm `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` in Vercel Production
- [ ] Complete Meta Business Manager domain verification + AEM priority order (see META-READINESS-AUDIT.md)
- [ ] Produce 5 static ad image sets — each at 1080×1080 + 1080×1920 (10 files total). A/B variants for the 3 cold ads (text-only vs text-over-photo) = up to 16 files total if testing both variants.
- [ ] Fire one test Lead from the live site, confirm it lands in Events Manager Test Events with EMQ ≥7.0
- [ ] Review committed code (current uncommitted diff = 4 Meta-readiness fixes + quiz rebuild + IC bounce) — commit when happy
- [ ] Queue Phase 2 video production for week 3 if v1 CPL clears <£22
- [ ] **WhatsApp RT routing:** put `07822012186` on the WhatsApp Business app + connect to the Facebook Page (Meta Business Suite → Settings → WhatsApp accounts) so it's selectable as the click-to-WhatsApp ad destination
- [ ] **Book-a-call CTA:** add a `Chat on WhatsApp` button → `https://wa.me/447822012186?text=...` on the quiz result page + `/book-call` (manual reply)

---

**Once the ad manager has this doc, the 5 static ads + 2 audience sets + 1 campaign architecture are everything they need to build, launch, and monitor for the first 14 days. Phase 2 video creative kicks off in week 3 if v1 metrics validate the angles.**
