# PT Launch Lab LIVE — Meta Campaign (AS BUILT)

Final record of what was actually created in Meta, 2026-06-29. Everything is
**PAUSED** — nothing spends until the ad sets are switched ON in Ads Manager.

> Supersedes `LIVE-EVENT-CAMPAIGN-PLAN.md` (the strategist's pre-build plan, which
> assumed the wrong ad account, 4 ad sets, and video creative).

---

## 1. Account & tracking

| | |
|---|---|
| **Ad account** | `act_37869536` ("AcademyAds" business; holds the PTLL pixel) — *NOT* `act_3635881119973565` (that's the Ultimate Shred gym account the old brief named) |
| **Pixel / dataset** | `1133525198707842` ("PT LAUNCH LAB - WEBSITE") |
| **FB Page** | `798389646699303` (same page the existing "Cold Leads - June 2026" ads run from) |
| **Custom conversion** | **Live Registration** = `1730939884700449` — fires on `Lead` events where the URL contains `/live` |
| **Landing page** | https://ptlaunchlab.co.uk/live |
| **Attribution** | Meta default (7-day click / 1-day view) |

---

## 2. Event being advertised

- **Series:** PT Launch Lab LIVE — monthly live discussions with leading fitness professionals
- **Event #1:** *The Real State of the PT Industry in 2026*
- **When:** Wednesday 15 July 2026, 8:00pm UK (~75 min)
- **Conversion goal:** email registration (a Lead), not a course sale — grows the "Live Sessions" list

---

## 3. Campaign

| Setting | Value |
|---|---|
| **Name** | PT Launch Lab LIVE \| July 2026 |
| **ID** | `52548488684318` |
| **Objective** | Leads (OUTCOME_LEADS) |
| **Conversion location** | Website |
| **Budget** | Ad-set level (no CBO) |
| **Status** | **PAUSED** |
| **Total daily** | **£25/day** across 3 ad sets |

---

## 4. Ad sets (3) — all PAUSED, all optimising for "Live Registration"

All: UK · age 18+ · billing on impressions · lowest-cost bid · destination Website.

### Ad Set 1 — Warm Audience · £8/day · `52548493581118`
- **Audiences (OR):** `RT · IG Engagers` (~3,100), `RT · FB Engagers` (~1,000), `RT · Deep Page Viewers No Lead`, `RT · Avatar Visitors No Lead`, `RT · Quiz Starters No Lead`
- **Advantage+ Audience:** OFF (hard age cap 18–45)
- *Cheapest CPL source — already engaged with PTLL.*

### Ad Set 2 — Lookalikes · £7/day · `52548495889718`
- **Audience:** `Lookalike (1%) - meta_value_based_audience.csv`
- **Excludes:** all the `RT ·` warm audiences (no overlap)
- **Advantage+ Audience:** ON (age 18+ as suggestion)

### Ad Set 3 — Broad · £10/day · `52548495979318`
- **Audience:** none — UK 18+, no interests/behaviours
- **Advantage+ Audience:** ON
- *Scale lever — let Meta find registrants.*

> **Dropped from the original plan:** the "Quiz Segments" ad set. The only quiz
> audience that exists (`RT · Quiz Starters No Lead`, ~20 people) is far too small
> for its own ad set, so it folds into Warm. Email/course-lead list audiences don't
> exist on this account (would need MailerLite CSV uploads to add later).

---

## 5. Creative — one image ad per ad set (all PAUSED)

Static 1080×1080 images, brand-matched (navy `#072B4A` + gold `#F5C518`, Barlow
Condensed headlines). CTA button = **Sign Up**. All link to `/live`.
Story 9:16 versions exist in `ad-assets/live-july2026/` for optional placement
customisation.

### Ad 1 — "Lead Saturated" → Warm · ad `52548563001118`
- **Image:** `lead-saturated-1080x1080.png` — "EVERYONE SAYS PT IS SATURATED. THE PEOPLE MAKING MONEY DISAGREE."
- **Headline:** The Real State Of The PT Industry In 2026
- **Primary text:**
  > Thinking about becoming a PT? Already qualified but struggling to grow? Or wondering what the fitness industry actually looks like in 2026?
  >
  > We're bringing together some of the UK's leading coaches, gym owners and fitness professionals for a live discussion covering:
  > ✓ Is the PT market saturated?
  > ✓ Are GLP-1 weight loss drugs a threat or opportunity?
  > ✓ Where is the money really being made in fitness right now?
  > ✓ Live audience Q&A
  >
  > Free to attend. Register now and we'll send you the private watch link.

### Ad 2 — "Worth It" → Lookalikes · ad `52548563046718`
- **Image:** `worth-it-1080x1080.png` — "IS BECOMING A PT STILL WORTH IT IN 2026? WE'RE SETTLING IT LIVE."
- **Headline:** Is Becoming A PT Still Worth It In 2026?
- **Primary text:**
  > Everyone has an opinion about the fitness industry. We're bringing together the people actually building businesses inside it.
  >
  > Join PT Launch Lab LIVE and hear what some of the UK's leading coaches think about:
  > • Is the PT market saturated? • GLP-1 drugs — threat or opportunity? • Where the money really is in 2026 • Where the industry is heading next
  >
  > Plus a live audience Q&A. Free registration — we'll send you the private watch link.

### Ad 3 — "GLP-1" → Broad · ad `52548563083518`
- **Image:** `glp1-1080x1080.png` — "OZEMPIC. AI. SATURATION. WHAT IT ACTUALLY MEANS FOR PTs."
- **Headline:** The Real State Of The PT Industry In 2026
- **Primary text:**
  > Everyone keeps saying personal training is dead — that GLP-1 drugs will replace coaches, that the market is saturated, that nobody can make money anymore.
  >
  > The people actually building businesses in fitness disagree. We're bringing together some of the UK's leading coaches and gym owners for a live discussion on what's really happening in the industry right now:
  > ✓ Saturation — myth or reality?
  > ✓ GLP-1 drugs — threat or opportunity?
  > ✓ Where the money really is in 2026
  > ✓ Live audience Q&A
  >
  > Free to attend. Register now for the private watch link.

---

## 6. KPIs — cost per registration (Lead)

| Tier | CPL |
|---|---|
| Good | £2–£5 |
| Very good | £1–£3 |
| Excellent | sub-£1.50 |

Warm should land cheapest. 3× Kill Rule: pause an ad/ad set whose CPL runs >3× target with no leads after meaningful spend.

---

## 7. Pre-launch checklist (do before switching ON)

- [ ] Preview each ad — image renders, text exact, link resolves to `/live`
- [ ] Test-submit `/live` → confirm the `Lead` fires and "Live Registration" registers in Events Manager (Test Events)
- [ ] Confirm `/live` event date/speakers are final (the Sam Hinks/Hincks spelling)
- [ ] Decide a sensible start (campaign budget is £25/day = ~£750/mo if left running)
- [ ] Switch the 3 ad sets ON

---

## 8. Post-event loop

After 15 July: cut 10–20 clips from the discussion → those become August's
creative (real, native, social-proofed). Re-run the build script with an updated
CONFIG (new date in copy) for next month.

---

## Build artefacts (in repo, not yet committed)
- `scripts/meta-live-campaign.mjs` — campaign/ad-set/creative builder (idempotent, dry-run by default)
- `scripts/live-creatives.json` — the per-ad-set copy + image manifest
- `ad-assets/live-july2026/` — the 6 PNG creatives
