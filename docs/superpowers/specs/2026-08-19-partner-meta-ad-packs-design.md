# Partner Meta ad packs — design

**Date:** 2026-08-19
**Status:** Approved, not yet planned
**Related:** `docs/superpowers/specs/2026-08-17-partner-course-guide-pdf-design.md`

## Why

A gym partner asked for Meta ad graphics for his gym. The wider opportunity: partners
advertise in their own town, where their brand is already recognised, and a locally
recognised gym name does work that our name cannot. Every academy enrolment they drive
earns them £500, so their ad spend has a payback we can point at.

## Decisions taken

| Question | Decision |
|---|---|
| Who runs and pays for the ads | The partner, from their own Meta account and their own money. We are a creative supplier only. |
| What the ads sell | Academy enrolments only. Not gym membership, not classes. |
| Imagery | Photo-free layouts by default, with a photo slot that activates automatically when files land in `partner-photos/<slug>/`. |
| Photo sourcing | Harvest from each gym's website and Google Business Profile, automatically preferring shots without identifiable faces. |
| Angles | Two: "turn your training into a career" and "qualify without leaving `<town>`". |
| Scope | All 9 real partner gyms, shipped into the portal. |
| Pack contents | Graphics plus matching ad copy. No launch guide, no per-gym UTM. |
| Before upload | Callum reviews a contact sheet of every rendered graphic. Nothing reaches `pp_resources` until approved. |

### Consequence accepted

With no UTM on the destination, analytics will not show that ads drove a visit. A partner's
ad-driven enrolment will surface only as a promo-code enrolment weeks later. Fine for v1;
it does mean "did the ad pack work" is not answerable from data.

## Scope

`gym-brands.json` holds **10 entries, 9 of them real gyms** — the 10th is `demo` and is skipped.

Per gym: **2 concepts × 2 sizes = 4 PNGs**, plus ad copy. **36 graphics total.**

- **1080×1080** — feed and Instagram square
- **1080×1920** — stories and reels

## Components

### 1. `scripts/gym-ad-creatives.mjs`

Modelled on `scripts/gym-tv-slides.mjs`, reusing `scripts/render-image.mjs` unchanged
(HTML → headless Chrome → sharp). Reads `gym-brands.json`, loops the 9 real gyms.

Output: `ad-assets/gym-ads/<slug>/<concept>-<w>x<h>.png`, plus the `.html` alongside for
hand-tweaks, matching the convention `live-ad-creatives.mjs` already uses.

**Concept A — "You're already in the gym. Make it your job."**
Aimed at people who already train, including the gym's own members. Warmest audience,
cheapest clicks, and the one where local brand recognition does the most work.

**Concept B — "Qualify as a PT without leaving `<town>`."**
Local convenience plus "nationally recognised Level 3 qualification".

Both use the gym's logo, `accentFor(brand)` for the accent, and name the gym in the subline.
Neither carries PT Launch Lab branding — the white-label rule holds: it is the gym's academy.

**Vertical safe zones.** The 1080×1920 layout keeps all text clear of the top 250px and
bottom 340px, which Meta's UI chrome occupies in stories and reels.

**No `_shared` fallback.** A deliberate divergence from `gym-tv-slides.mjs`. Generic stock
in a paid ad running in the gym's own town undercuts the exact claim the ad makes. No photos
means the photo-free layout, which is the default regardless.

### 2. `scripts/harvest-gym-photos.mjs`

Fills `partner-photos/<slug>/` so the photo slot has something to use.

1. **Sources:** Google Places (Place Details → `photos[]` → Place Photos at `maxwidth=1600`)
   and a crawl of the gym's own site for `<img>` and CSS background images.
2. **Filter:** drop anything under ~1200px on the short edge.
3. **Dedupe:** average hash via sharp.
4. **Score:** one Claude vision call per candidate returning `hasIdentifiableFaces`,
   `isGymInterior`, and `usableAsAdBackground` (1–5). This is what makes "prefer no-faces
   shots" real — sharp has no face detection and filename heuristics detect nothing.
5. **Write:** top-ranked keepers into `partner-photos/<slug>/`; rejects into
   `partner-photos/<slug>/_rejected/` with the reason in a JSON sidecar, so nothing is
   binned silently and the ranking can be overruled by hand.

**Ownership position:** the gym's own photo of their own gym, used in an ad they run from
their own account, is defensible. Preferring face-free equipment and floor shots avoids the
harder question of whether website-gallery consent extends to paid advertising.

**Keys required, both present but in other projects:**

- `GOOGLE_PLACES_API_KEY` — in `pt-launch-lab-pt-app/.env.local`. ~90 calls total, under $1.
- `ANTHROPIC_API_KEY` — in `albaco-lms/.env.local` among others.

Both must be copied into `ptlaunchlab-site/.env.local`. Neither is currently there.

### 3. Ad copy in the playbook

Ad copy must be pasted into Ads Manager, so it needs copy-to-clipboard, not a PDF. The
playbook already renders fenced code blocks as copy panels.

- New `partner-playbook/campaign-meta-ads.md`, `type: campaign`, one fenced block per
  concept holding primary text, headline and description.
- **Token substitution added to `app/lib/partner-playbook.ts`**, applied to the markdown
  body before `marked` runs: `{{gymName}}`, `{{town}}`, `{{promoCode}}`, `{{academyUrl}}`.
  The playbook page already calls `requirePartner()`, so the gym is in hand.

**Deliberate scope addition.** Roughly 15 lines, but it changes rendering for all 48
existing playbook entries. Accepted because every entry becomes personalisable from then on.
Entries containing no tokens are unaffected.

### 4. Delivery into the portal

- **Category: reuse `digital`** ("Digital & screens"), not a new `ads` key. `pp_resources.category`
  sits behind a CHECK constraint, so a new key means live DDL on the partner database — and a
  `201 []` from the Supabase management API is not proof a statement ran. Not worth the risk to
  gain a heading. The category blurb is updated to mention ads.
- **Individual PNGs, not a ZIP.** The portal renders image thumbnails; an owner should see the
  ad before downloading it.
- Upload via the existing `scripts/import-partner-assets.mts`, idempotent on gym + title.

### 5. Review gate

After rendering and before any upload, the script writes a contact sheet of all 36 graphics
for review. Upload is a separate, explicitly invoked step. Nothing reaches `pp_resources`
without approval.

## Data work required first

All in `scripts/gym-brands.json` unless noted.

1. **`location` is null for `6fit` and `mof`.** Concept B cannot render without it.
   Resolved without needing input: **6fit is Wibsey, Bradford (BD6)**, Park View Mills,
   Wibsey Park Avenue; **mof is Bristol**, per its own `heroHeadline`.
2. **6fit and muscle-bound are both Bradford.** `muscle-bound` is "Bradford & Huddersfield".
   Left as-is, both would run "Qualify without leaving Bradford" against the same audience in
   the same auction — two partners paying to outbid each other for an enrolment we pay £500 on
   either way. **6fit's Concept B uses Wibsey; muscle-bound's uses Huddersfield.**
3. **Ebor's logo is a `.jpg` on Wix.** JPEG has no alpha, so it renders as a white rectangle on
   a dark ad. Needs a transparent PNG, or a light-background variant of the layout for Ebor.
   `gym-tv-slides.mjs` carries the same exposure.
4. **Five logos are remote URLs** fetched at render time — `6fit`, `ebor`, `muscle-bound`,
   `superflex`, `hitio-orpington`. Fragile, unknown resolution, and they break silently if a gym
   redesigns. Pull local into `public/gym-logos/`.
5. **No `siteUrl` and no `placeId`** on any gym. Both needed by the harvester. Three domains are
   inferable from `logoUrl` (`6fitgyms.co.uk`, `muscleboundgymuk.co.uk`, `hitiogym.com`); Ebor's
   and Superflex's logos are on `wixstatic.com` and give nothing away.

## Gates

Run as part of the render. Each has a live precedent in existing material.

1. **Claim gate.** Creative text and ad copy are scanned for job-offer language — `interview`,
   `guaranteed`, `hiring`, `job offer`, `recruiting`. A hit fails the build.
2. **White-label gate.** No rendered graphic may contain "PT Launch Lab".
3. **Dimension and safe-zone check.** sharp metadata must read exactly 1080×1080 / 1080×1920,
   and no text element may sit in the top 250px or bottom 340px of the vertical.
4. **Contrast check.** Accent against background. Ebor's `#1A1A1A` primary is the case that
   `accentFor()` exists for.

### Why the claim gate matters

Meta's Marketing API defines `EMPLOYMENT` as "ads offering job opportunities" and does **not**
explicitly extend it to training or certification programmes, so "become a qualified PT" is not
automatically caught. But if a reviewer classes it as employment, the campaign is forced into the
Special Ad Category, where:

- minimum radius is 15 km in Europe and location exclusion is banned — no targeting the gym's
  actual catchment
- detailed interest targeting is restricted to a pre-approved list — no targeting gym-goers
- lookalike audiences are unavailable, age is locked to 18–65+, all genders

That guts the local-targeting premise the whole idea rests on. Keeping every claim in education
language rather than job-offer language avoids it.

The same rule closes a second problem. Superflex's live handout says "at least one guaranteed
interview with a partner gym", and gym-n-go/xcelerate's poster template carries "GUARANTEED GYM
INTERVIEW ON QUALIFICATION". The word *interview* appears nowhere in the v3.0 agreement, whose
Clause 2.2 says the gym acts "solely as a distribution and referral partner". The gate stops that
claim being reprinted into 9 new ad packs.

**Out of scope:** removing the claim from those partners' existing live material. Still outstanding,
tracked against the HITIO onboarding work.

## Build order

1. Data — locations, Bradford collision, `siteUrl` + `placeId`, five logos pulled local, Ebor's
   transparent PNG
2. Renderer, 2 concepts, photo-free, with all four gates
3. Harvester — Places, site crawl, vision scoring
4. Playbook token substitution and `campaign-meta-ads.md`
5. Render, contact sheet, **Callum approves**
6. Upload, verify signed URLs resolve for all 9 partners

## Out of scope

- Any launch or targeting guide for partners
- Per-gym UTMs and traffic attribution
- Editable source files for partners — locked PNGs only, so claims cannot be edited back in
- Gym membership, class or PT-services creative
- PTLL running or paying for any partner's ads
- Fixing "guaranteed interview" in partners' existing live material
