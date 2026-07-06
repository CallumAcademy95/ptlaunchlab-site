# PT Launch Lab LIVE — Meta Ads Brief

**Prepared for:** Meta ads strategist/buyer
**Brand:** PT Launch Lab — UK online Personal Trainer course provider (NCFE L2 + L3), Pontefract HQ, sells UK-wide
**Site:** https://ptlaunchlab.co.uk
**Date prepared:** June 2026

---

## 1. TL;DR — what we need from you

We're launching a **free monthly live webinar/podcast** for the UK fitness/PT
community. We want a Meta ads strategy to **drive registrations** to the landing
page, where visitors give their **name + email** to get the watch link.

- **The conversion = an email registration** (a `Lead` event), *not* a course sale.
- **The real goal = grow a permission-based mailing list** ("Live Sessions" segment)
  that we market to every month. Each event is a fresh reason to opt in + re-engage.
- **This is recurring** — a new event every month, so we want a **repeatable, always-on
  structure**, not a one-off burst.
- **First event is ~3 weeks out (22 July 2026)** — we need to launch quickly.

**Primary KPI:** cost per registration (Lead). **Secondary:** list growth volume,
live attendance rate, cost per *new* subscriber.

---

## 2. The product being advertised — Event #1

| | |
|---|---|
| **Format** | Free live panel webinar, streamed live, then released as a podcast episode ~1 week later |
| **Title** | The Real State of the PT Industry in 2026 |
| **Date/time** | **Wednesday 22 July 2026, 8:00pm UK** (~1 hour) |
| **Hosts** | Callum Brown · Ryan Robinson · Miles Halstead (PT Launch Lab) |
| **Guest panellists** | Jonny Grayshon (Vaxa Fitness Transformations) · Sam Hinks (SJH Coaching) · Tom Blackman (Ministry of Fitness) · Aaron Caseley (MOFO Body Mechanic) · Sohail Rashid (Brawn) |
| **Topics** | The GLP-1 / weight-loss-drug boom (threat or opportunity for PTs?) · Is the PT market saturated & how to stand out · Where the money really is in 2026 |
| **Live hook** | Audience Q&A — viewers submit questions and get them answered live |
| **Platform** | Riverside → streamed to an unlisted YouTube link given only to registrants |
| **Cadence** | Monthly — same funnel, new title/panel/topic each time |

---

## 3. Who we're targeting (audience)

PT Launch Lab's audience = **people in or entering the UK fitness industry**:

1. **Aspiring / trainee PTs** — gym-obsessed, considering qualifying (16–30)
2. **Career changers** — 30s/40s, burned out in corporate/trades/hospitality, want into fitness
3. **Returners / new PTs** — recently qualified or returning, building a client base
4. **Existing PTs, coaches & small gym owners** — want to grow/sustain their business

The event content (industry trends, standing out, making money as a PT) speaks to all
four. This is a **warm, interest-led B2C-to-prosumer audience**, not a cold weight-loss
consumer audience.

### Existing audience assets to build from
- A **large existing email list** (course leads, quiz takers, prospectus downloads, podcast subs) → **seed for lookalikes** + a direct "you're invited" audience
- **Website visitors** (pixel-tracked), **podcast listeners**, **IG/FB/YouTube/TikTok engagers**
- **WhatsApp lead database** + a **3,651-record UK gym database** (owners/emails)
- Quiz-funnel avatar segments already tagged: `starter` / `switcher` / `returner`

---

## 4. The funnel / conversion path

```
Meta ad ──► ptlaunchlab.co.uk/live ──► name + email (+ optional phone)
                                              │
                                              ▼
                        Lead event fires (browser fbq + server CAPI, deduped)
                                              │
                          ┌───────────────────┤
                          ▼                    ▼
                Added to MailerLite      Shown watch link + add-to-calendar
                "Live Sessions" segment        │
                          │                     ▼
              5-email reminder sequence    (optional) /ask page to submit
              (instant → 24h → 1h →         a question for the panel
               live → +1wk replay)
                                              │
                                              ▼
                                   LIVE EVENT → podcast episode 1 wk later
```

- **Landing page for all ad traffic:** `https://ptlaunchlab.co.uk/live`
- The page is purpose-built, on-brand, fast, mobile-first, and **fires the pixel +
  CAPI**. Do **not** send live-event traffic to the homepage or course pages.

---

## 5. Tracking & measurement (already built)

| Item | Value |
|---|---|
| **Meta Ad Account ID** | `act_3635881119973565` |
| **Pixel / Dataset ID** | `1133525198707842` ("PT LAUNCH LAB - WEBSITE") |
| **Old pixel (do NOT use)** | `1988881834762642` (retired 2026-05-22) |
| **CAPI** | Live — server-side `Lead` fires alongside browser `fbq`, deduped on shared `event_id` (7-day window). Recovers ~30% of conversions iOS/ad-blockers miss. |
| **Domain verification** | `ptlaunchlab.co.uk` verified (meta tag `vwepg3x20z4pmksvkubk7v1vzinalg`) |
| **Consent** | Consent Mode v2 + CookieYes installed |
| **Other analytics** | GA4 `G-90W2KGSL55`, Microsoft Clarity, Vercel Analytics |
| **FB Page / IG** | facebook.com/profile.php?id=61583011678458 · @ptlaunchlab |

### The conversion event to optimise for
On a successful registration, `/live` fires:

- **Browser:** `fbq('track', 'Lead', { content_name: 'live_webinar_registration', content_category: 'live-sessions' }, { eventID })`
- **Server (CAPI):** matching `Lead` with the same `event_id`, hashed email/phone/name + IP/UA for strong matching (high EMQ expected)
- **GA4/dataLayer:** `live_register_submitted`

**Recommended setup on your side:**
1. Create a **Custom Conversion** named "Live Registration" = `Lead` events where
   **URL contains `/live`** OR `content_name = live_webinar_registration`
   (so live registrations are measured separately from course-funnel `Lead`s, which
   share the same pixel).
2. Optimise the campaign for that Custom Conversion.
3. Confirm dedup is clean in Events Manager → Test Events before scaling.

> Note: the question form at `/ask` fires a separate non-conversion event
> (`live_question_submitted`) — ignore it for optimisation.

---

## 6. Budget & structure (starting point — refine as you see fit)

**Monthly budget: £300–£800.** Working figure **£500/mo**. Suggested split:

| Bucket | Spend | Audience | Purpose |
|---|---|---|---|
| **Cold prospecting** | ~£250 | Broad UK fitness/PT interests + **lookalike of the email list** | New registrations + list growth |
| **Retargeting** | ~£150 | Site visitors, podcast/IG/YT engagers, WhatsApp leads, quiz avatars | Cheap, high-intent registrations |
| **Test/scale buffer** | ~£100 | Winning creative/audience | Pour into what works |

- **Objective:** Leads / Sales (optimising for the "Live Registration" custom conversion).
- **Geo:** UK. **Age:** ~18–55. **Placements:** Advantage+ placements to start.
- Because this is **recurring monthly**, favour an **always-on structure** you can
  refresh each cycle (new creative + new event date) rather than rebuilding campaigns.
- We can also email the existing list directly (free) — so **paid budget should lean
  toward *new* audiences**, with retargeting mopping up engaged non-registrants.

---

## 7. Timeline

| When | Milestone |
|---|---|
| **ASAP (now, ~3 wks out)** | Launch cold + retargeting — don't wait, the event is 22 July |
| **22 July, 8pm** | Live event |
| **~22 July** | Podcast episode published → becomes retargeting + new creative |
| **Monthly thereafter** | Repeat: new event date, refreshed creative, best Q&A clips as ads |

---

## 8. Creative direction

### Positioning / angle
PT Launch Lab's edge is **identity-first, "built by gym owners who've hired 500+
trainers," honest-and-unfiltered**. The live event leans into that: *real* gym owners,
coaches and PTs, no script, answering your questions live.

### Hooks that should test well
- "5 gym owners and coaches. One hour. Your questions, answered live." (the panel + Q&A)
- The **GLP-1 / Ozempic angle** — timely, high-curiosity: *"What Ozempic means for PTs — live panel"*
- The **"is it too late / is the market saturated"** fear — *"Is becoming a PT still worth it in 2026? We're settling it live."*
- **FOMO / exclusivity** — *"Free, live, mailing-list only. Save your seat."*

### Formats
- **Vertical video (9:16)** for Reels/Stories — strongest. For Event #1, film a 20-sec
  teaser of the hosts (no past clips exist yet).
- **From Event #2 onward:** cut 3–5 vertical clips of the best live Q&A moments → these
  become the highest-performing ad creative (real, native, social-proofed).
- Static + carousel as support (panel headshots + "what we're tackling").

### Competitor intel (UK PT Meta landscape, June 2026)
- The UK PT-course Meta feed is effectively an **OriGym (sophisticated) + The PT Academy
  (lazy/high-volume) duopoly**. Future Fit, HFE, LTB run little/no Meta.
- **Identity-first messaging + WhatsApp click-to-chat retargeting are uncontested** —
  PTLL already exploits this; the live event reinforces the "real community" angle
  competitors don't have.

### Existing assets
- 5 existing course-funnel ad creatives + brand profile + brand colours/voice are in the
  repo (`ad-assets/`, `brand-profile`). The brand palette is dark + gold; font Barlow
  Condensed / Poppins. We can supply logos, headshots, brand guide on request.

---

## 9. Meta policy notes
- Audience is **fitness professionals / aspiring PTs**, not weight-loss consumers — so
  health/"personal attributes" policy is largely N/A.
- When using the **GLP-1 / Ozempic** angle, frame it as **industry/professional
  discussion** ("what it means for PTs"), **not** body-shaming or personal weight-loss
  claims ("are you overweight?") — that keeps it clear of Meta's health policies.
- It's a **free event**, no purchase — straightforward Lead-gen, low policy risk.

---

## 10. What we need from the strategist
1. Campaign structure + audience plan (cold + retargeting + lookalikes) for an always-on monthly funnel
2. Recommended starting budgets/bids and a scaling rule
3. Creative brief/specs for the teaser + ongoing Q&A-clip ads
4. Target cost-per-registration for this niche + a kill/scale framework
5. Confirmation the Custom Conversion + CAPI dedup are set up correctly before scaling

**Everything needed to start is in this doc. Landing page is live now:
https://ptlaunchlab.co.uk/live**
