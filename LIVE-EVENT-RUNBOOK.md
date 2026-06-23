# PT Launch Lab LIVE — Event Runbook

The complete prep + run guide for the monthly live webinar/podcast funnel.
Built around the existing site (`/live`), MailerLite, Meta ads and Riverside (**Grow** plan).

---

## Event #1 facts

| | |
|---|---|
| **Title** | The Real State of the PT Industry in 2026 |
| **Date/time** | **Wednesday 15 July 2026, 20:00–21:30 (UK)** |
| **Platform** | Riverside (Grow) → multistream to **unlisted YouTube Live** |
| **Gate** | Email-required-then-open (registration on `ptlaunchlab.co.uk/live`) |
| **Hosts** | Callum Brown · Ryan Robinson · Miles Halstead |
| **Guest panellists** | Jerome Scherrer (Muscle Mechanics) · Sam Hinks (SJH Coaching) · Tom Blackman (Ministry of Fitness) · Aaron Caseley (MOFO Body Mechanic) · Sohail Rashid (Brawn) |
| **On screen** | 8 (3 hosts + 5 guests) — within Riverside studio limits |
| **Podcast drop** | ~1 week later (~22 July) → Buzzsprout + YouTube + `/podcast` |

---

## The funnel

```
Meta ads ──► /live (email gate) ──► MailerLite "Live Sessions" segment
                                            │
                        ┌───────────────────┤
                        ▼                    ▼
              5-email reminder seq     Unlisted YouTube Live link
              (instant→24h→1h→live     (in confirmation email)
               →+1wk replay)                │
                                            ▼
                          LIVE: Riverside studio (5 panellists)
                          multistreamed to YouTube · Omnichat Q&A
                                            │
                                            ▼  (~1 week later)
                          Edited episode → Buzzsprout + YouTube + /podcast
                                            │
                                            ▼
                          Best Q&A clips → next month's ads (the loop)
```

---

## PHASE 0 — One-time setup (do once, reused every month)

### 0.1 Riverside (Grow — already subscribed)
- [ ] Create Studio: **"PT Launch Lab LIVE"**
- [ ] Studio settings → enable **Separate track recording** (per-person files = podcast master)
- [ ] Studio settings → set recording quality to highest available
- [ ] Connect **YouTube** as a streaming destination (Riverside → Destinations → connect YouTube account `@ptlaunchlab`, authorise)
- [ ] Confirm **Omnichat** is on (pulls live chat/comments into one moderator view) and **live call-ins** enabled (bring an audience member on air)

### 0.2 YouTube (the watch surface)
- [ ] On `@ptlaunchlab`, confirm the channel is **enabled for live streaming** (24h activation if first time — do this NOW)
- [ ] You'll create the actual broadcast per-event (Phase 1) and set it **Unlisted**

### 0.3 MailerLite
- [ ] Create group/segment: **"Live Sessions"**
- [ ] Build the **5-email automation** (full copy in Phase 2) triggered on join to that group

### 0.4 Zapier
- [ ] New Zap: **Catch Hook** → **MailerLite: Add/Update Subscriber** into "Live Sessions"
- [ ] (Optional) filter/branch on `source == "live-webinar"` if reusing the prospectus hook
- [ ] Copy the catch-hook URL → use as `LIVE_ZAPIER_WEBHOOK_URL` below

### 0.5 Vercel env vars (Project → ptlaunchlab-site → Settings → Environment Variables)
- [ ] `LIVE_ZAPIER_WEBHOOK_URL` = the catch-hook URL from 0.4 *(not Sensitive — see memory note)*
- [ ] `LIVE_STREAM_URL` = the unlisted YouTube **watch** URL (set/updated per event in Phase 1)
- [ ] Confirm `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` already present (they are — quiz uses them)
- [ ] Redeploy after adding

> **Note:** Do NOT mark `LIVE_ZAPIER_WEBHOOK_URL` as *Sensitive* on Vercel — sensitive non-secret URLs silently blank-save on edit here.

---

## PHASE 1 — Per-event config (edit each month)

### 1.1 Create the YouTube broadcast
- [ ] YouTube Studio → Create → **Go Live** → Schedule new stream
- [ ] Title, thumbnail, **Visibility = Unlisted**, date/time = event
- [ ] Copy the **watch URL** (`youtube.com/watch?v=…`) → this is `LIVE_STREAM_URL`
- [ ] In Riverside, link this scheduled broadcast as the destination

### 1.2 Update the site (`app/live/page.tsx`)
Edit the `EVENT` object at the top — everything else (date label, calendar link, schema) derives from it:
- [ ] `number`, `title`, `topic`
- [ ] `startIso` / `endIso` (keep the `+01:00` offset for BST; `+00:00` in winter)
- [ ] `panellists[]` (5)
- [ ] `talkingPoints[]`
- [ ] Commit + push → Vercel auto-deploys

### 1.3 Update env
- [ ] Set `LIVE_STREAM_URL` to this month's watch URL → redeploy

### 1.4 Send panellists their guest links
- [ ] In Riverside, invite the 5 guests → each gets a **guest link** (NOT the audience link)
- [ ] Send calendar holds + the rehearsal time (Phase 4)

### 1.5 Remote guest prep (all 5 panellists join virtually)
Riverside records each guest **locally in full quality** then uploads — so a guest's
wifi wobble doesn't ruin the recording. But the live stream still needs a decent
connection. Send every panellist this before the rehearsal:

> **Joining the PT Launch Lab live panel — 5-min setup**
> - Use a **laptop/desktop in Google Chrome** (not phone, not Safari, not the app)
> - **Wired headphones/earbuds** — kills echo. Non-negotiable.
> - **Ethernet if possible**, or sit next to the router. Close other tabs/apps.
> - **Quiet room, door shut**, no one walking through. Tidy/plain background.
> - **Face a window or light** — light in front of you, not behind.
> - Click your **guest link ~10 min early** and run the gear check.
> - Charge your laptop / keep it plugged in. Silence phone + notifications.

- [ ] Send the above to all 5 + confirm each has a laptop + wired headphones
- [ ] Flag anyone on weak wifi → ask them to hardwire or move closer to the router

---

## PHASE 2 — MailerLite reminder automation (5 emails)

Trigger: subscriber joins **"Live Sessions"**. Replace `{{WATCH_LINK}}` with the unlisted YouTube URL, `{{CALENDAR_LINK}}` with the Google Calendar link (the `/live` page builds the same one), `{{TOPIC}}` and `{{WHEN}}` per event. Personalisation tag: `{$name}`.

### Email 1 — instant (on register)
**Subject:** You're in 🎟️ here's your watch link
```
{$name}, you're on the list for PT Launch Lab LIVE.

📅 {{WHEN}}
🎙️ {{TOPIC}}

Save your watch link now so you don't lose it:
👉 {{WATCH_LINK}}

Add it to your calendar: {{CALENDAR_LINK}}

It's a proper live panel — 5 gym owners, coaches and PTs, no script,
plus a live Q&A where we answer YOUR questions on air. Start thinking
about what you want to ask.

See you there,
Callum
PT Launch Lab
```

### Email 2 — T-24h
**Subject:** Tomorrow night: {{TOPIC}}
```
{$name}, we go live tomorrow at 7:30pm.

On the panel:
• Callum Brown — PT Launch Lab, gym owner
• Ryan Robinson — built & sold a £500k online PT business
• + 3 working PTs, coaches and gym owners

The 3 questions we're tackling:
1. Is the PT market actually saturated — or just full of part-timers?
2. What's really filling client rosters in 2026
3. Employed vs self-employed vs online — the honest numbers

Got a question? Reply to this email and we'll try to get to it live.

Your watch link: {{WATCH_LINK}}
```

### Email 3 — T-1h
**Subject:** ⏰ 1 hour to go
```
{$name}, we're live in an hour (7:30pm).

Grab a brew, get comfy, and have your questions ready.

👉 {{WATCH_LINK}}
```

### Email 4 — T-0 (at start)
**Subject:** 🔴 We're LIVE now
```
{$name}, we've started — come join us.

👉 {{WATCH_LINK}}

Drop your questions in the chat and we'll answer them on air.
```

### Email 5 — T+1 week (replay)
**Subject:** Missed it? The full episode is up
```
{$name}, the recording from last week's live is now up as a podcast episode.

🎧 Listen / watch: {{EPISODE_LINK}}

The next live is coming — you're already on the list, so you'll be first
to know the date and topic.

Callum
```

- [ ] Build all 5 in MailerLite, set delays (instant / -24h / -1h / at start / +7d relative to event — or schedule manually each month)
- [ ] Test the automation with your own email before going live

---

## PHASE 3 — Meta ads (~£500/mo)

Objective **Leads**, optimise for the `/live` registration (custom conversion on the `live_register_submitted` / Lead event). Account `act_3635881119973565`.

- [ ] **£250 — Cold prospecting:** broad UK fitness/PT interests + lookalike of your existing email list
- [ ] **£150 — Retargeting:** site visitors, podcast/IG engagers, WhatsApp leads → "Join the next live"
- [ ] **£100 — Test/scale buffer** into the winning creative
- [ ] Creative for Event #1: film a 20-sec teaser (no clips exist yet). From Event #2 use real Q&A clips.
- [ ] Point all ads at **ptlaunchlab.co.uk/live** with UTMs
- [ ] Launch **3 weeks out (~3 July)** so the pixel can optimise

---

## PHASE 4 — Timeline (working back from 24 July)

| When | Task | Owner |
|---|---|---|
| **Now (wk of 23 Jun)** | Enable YouTube live streaming (24h activation). Confirm all 8 panellists + date. Build Phase 0 (Riverside studio, MailerLite seg + automation, Zapier, Vercel env). | Callum |
| **Now** | `EVENT` in `/live` set (date + panel ✓). Confirm `/live` works end-to-end (test register → check MailerLite + confirmation email). | Callum |
| **ASAP (~3 wks out)** | Launch Meta ads (event is only 3 weeks out — don't delay). Start organic teasing (podcast audience, IG, WhatsApp list). | Callum |
| **~8 July (1 wk out)** | **Tech rehearsal** in Riverside with all 8 — cameras, mics, guest links, recording on. | All |
| **14 July (eve before)** | Final check: YouTube broadcast scheduled & unlisted, `LIVE_STREAM_URL` correct, emails queued, roles confirmed. | Callum |
| **15 July, 19:30** | Pre-flight (below). | Host + Mod |
| **15 July, 20:00** | **GO LIVE.** | All |
| **~22 July** | Edit + publish episode → Buzzsprout + YouTube + `/podcast`. Cut clips. | Callum |

---

## PHASE 5 — The live event

### Roles
- **Host (Callum)** — drives conversation, hits run-of-show beats, reads out Q&A.
- **Moderator (Ryan or 2nd person)** — works Omnichat: picks best questions, feeds host, drops links, mutes bad mics, triggers call-ins.

### Run-of-show (90 min)
| Time | Segment |
|---|---|
| 0–5 | Welcome · "drop your questions now" · housekeeping |
| 5–20 | Quick intros — 8 people, ~90s each (hosts keep theirs tight) |
| 20–55 | Main discussion — the 4 talking points, keep it moving |
| 55–85 | **Live audience Q&A** — the trust engine, give it room |
| 85–90 | Wrap · tease next month · CTA (courses / mentorship Hub) |

### Pre-flight checklist (T-30 min, 19:00)
- [ ] All 8 on screen (3 hosts + 5 guests) in the Riverside studio, camera + mic green (guests via **guest link**)
- [ ] **Separate track recording confirmed ON**
- [ ] YouTube destination connected, stream healthy (green) in Riverside
- [ ] Unlisted YouTube watch page loads from `LIVE_STREAM_URL`
- [ ] Omnichat panel visible to moderator
- [ ] Lighting/background OK, notifications silenced, water to hand
- [ ] Hit **record** AND **go live** at 19:30 (record is separate from stream — don't forget it)

---

## PHASE 6 — Repurpose to podcast (~1 week later)

- [ ] Download separate tracks + transcript from Riverside
- [ ] Edit: top/tail with intro/outro, trim dead air + Q&A lulls
- [ ] Publish audio to **Buzzsprout** (RSS already feeds Spotify/Apple)
- [ ] Publish video to YouTube (can make the live broadcast public, or upload the edit)
- [ ] Add the episode to `app/podcast/page.tsx` `episodes[]` (id = YouTube video id, slug, ep #, title, desc, date, category) → deploy
- [ ] Cut 3–5 vertical Q&A clips → these become next month's ad creative
- [ ] Fire Email 5 (replay) to the segment

---

## Quick reference — the 3 links (don't mix up)

| Link | Who gets it | Where |
|---|---|---|
| **Guest link** | The 5 panellists only | Riverside invite |
| **Audience / watch link** | Everyone who registers | Unlisted YouTube → `LIVE_STREAM_URL` + emails |
| **Registration link** | Ads + organic traffic | `ptlaunchlab.co.uk/live` |
