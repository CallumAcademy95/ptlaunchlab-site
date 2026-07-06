# PT Launch Lab LIVE — Event #1 Emails + Setup (22 July 2026)

Ready-to-send copy for Event #1, plus the exact MailerLite + Zapier setup to make
the funnel live. Generic templates live in `LIVE-EVENT-EMAIL-PLAN.md`; this file is
the **filled-in, event-specific** version.

**Event facts used throughout**
- **When:** Wednesday 22 July 2026, 8:00pm (UK)
- **Topic:** The Real State of the PT Industry in 2026
- **Panel:** Hosts Callum Brown, Ryan Robinson & Miles Halstead — with guests Jonny
  Grayshon (Vaxa Fitness Transformations), Sam Hinks (SJH Coaching), Tom Blackman (Ministry of
  Fitness), Aaron Caseley (MOFO Body Mechanic) & Sohail Rashid (Brawn)
- **Ask a question:** https://ptlaunchlab.co.uk/ask
- **Podcast (episode lands ~22 July):** https://ptlaunchlab.co.uk/podcast
- **Quiz:** https://ptlaunchlab.co.uk/quiz

> ⚠️ **The one thing only you can supply:** the **WATCH LINK** (the unlisted
> YouTube/Riverside stream URL). Everywhere below it says `[WATCH LINK]` — paste your
> stream URL there, and set it as `LIVE_STREAM_URL` on Vercel so the website reveals
> it too. Confirm the **Sam Hinks / Hincks** spelling before sending.

---

## A. Send schedule (work back from Wed 22 July, 8pm)

| When | Email | Type |
|---|---|---|
| **ASAP (now)** | B1 — Announce / you're in | Campaign → whole list |
| **Tue 8 July** | B2 — 1 week to go | Campaign → whole list |
| **Mon 14 July, ~6pm** | B3 — Tomorrow night | Campaign → whole list |
| **Wed 22 July, 7pm** | B4 — Live in 1 hour | Campaign → whole list |
| **Wed 22 July, 8pm** | B5 — We're live now | Campaign → whole list |
| **Thu 16 July** | B6 — Thanks / sorry we missed you | Campaign → split (attendees / no-shows) |
| **~Tue 22 July** | B7 — The episode is up | Campaign → whole list |
| **On signup (always)** | A1 — Instant "you're in" + watch link | Automation (new joiners) |
| **Days 2–10 after signup** | A2–A5 welcome | Automation (new joiners) |

---

## B. TRACK A — Welcome automation (event-ready)

Trigger in MailerLite: **subscriber joins "Live Sessions"**. Fires once ever.

### A1 — Instant: "You're in" (carries the watch link)
**Subject:** You're in 🎟️ here's your watch link
```
{$name|"Hey"}, you're on the list for PT Launch Lab LIVE.

📅 Next session: Wednesday 22 July, 8:00pm (UK)
🎙️ The Real State of the PT Industry in 2026

Save your watch link: [WATCH LINK]
Add it to your calendar so you don't forget.

🎤 Got a question for the panel? Submit it here and we'll answer the best ones
live: https://ptlaunchlab.co.uk/ask

A quick heads up on what you've joined: once a month we go live with leading UK
coaches and gym owners — no scripts, real talk, your questions answered. A week
later it lands as a podcast episode. You'll also hear from us between sessions
with the best episodes and the odd thing we think will genuinely help you.

See you on the live,
Callum — PT Launch Lab
```

### A2 — Day 2: Who we are
**Subject:** Why three gym owners started doing this
```
{$name|"there"}, quick intro so you know who's in your inbox.

PT Launch Lab is run by us — Callum, Ryan and Miles — gym owners and coaches
who've hired and trained hundreds of PTs. We got sick of the fitness industry
being full of hype and influencers who've never actually built anything.

So we started having the honest conversations on the record: what actually
works, what's nonsense, and how real people build careers and businesses in
fitness. That's the live panel. That's the podcast.

If you only listen to one episode first, make it this one:
https://ptlaunchlab.co.uk/podcast

More soon,
Callum
```

### A3 — Day 4: A genuine quick win
**Subject:** The 3 things actually working for PTs right now
```
{$name|"there"}, no pitch today — just something useful.

From what we and the coaches we know are seeing on the ground, three things are
quietly working in 2026 while everyone else panics about AI and saturation:

1. Niching down hard enough that you're the obvious choice for ONE type of client.
2. Owning the in-person/accountability piece machines can't replace.
3. Treating retention as the business — keeping clients 12+ months, not chasing new ones.

We go deep on this stuff live. Speaking of which — your next session is
Wednesday 22 July, 8pm.

Callum
```

### A4 — Day 7: Soft course intro
**Subject:** In case you didn't know what we actually do
```
{$name|"there"}, you joined us for the live panel — but a lot of people don't
realise PT Launch Lab is also how you become a qualified PT in the first place.

We run the NCFE Level 3 Personal Trainer qualification — 100% online, built by
gym owners, with real mentorship and business support (not just a certificate
and good luck). Ofqual regulated, CIMSPA recognised.

No pressure at all — but if becoming a PT (or finally getting qualified) is on
your mind, the 60-second quiz tells you the right path for your situation:
👉 https://ptlaunchlab.co.uk/quiz

Either way, see you on the next live.
Callum
```

### A5 — Day 10: Best-of podcast
**Subject:** 3 episodes worth your commute
```
{$name|"there"}, if you've got a drive or a session ahead, start here:

🎧 How I built an online PT business to £500K — Ryan's full story
🎧 Is becoming a personal trainer still worth it? The honest answer
🎧 Will AI replace personal trainers? The honest answer

All here: https://ptlaunchlab.co.uk/podcast

Then come settle the debates with us live, Wednesday 22 July, 8pm.
Callum
```

---

## C. TRACK B — Event build-up (event-ready, dated)

Send as scheduled **campaigns to the whole "Live Sessions" group**.

### B1 — Announce (send ASAP)
**Subject:** Next PT Launch Lab LIVE: The Real State of the PT Industry in 2026
```
{$name|"there"}, the next live session is locked in.

📅 Wednesday 22 July, 8:00pm (UK)
🎙️ The Real State of the PT Industry in 2026
🎤 On the panel: Callum Brown, Ryan Robinson & Miles Halstead, with guests Jonny
Grayshon (Vaxa Fitness Transformations), Sam Hinks (SJH Coaching), Tom Blackman (Ministry of
Fitness), Aaron Caseley (MOFO Body Mechanic) & Sohail Rashid (Brawn).

You're already on the list, so you're in — here's your watch link: [WATCH LINK]

Want something specific covered? Submit your question now and we'll answer the
best ones live: https://ptlaunchlab.co.uk/ask
```

### B2 — T-7 (Tue 8 July)
**Subject:** 1 week: The Real State of the PT Industry in 2026
```
{$name|"there"}, one week until we go live.

Here's what we're getting into:
• Is the PT market really saturated?
• Are GLP-1 weight-loss drugs a threat or an opportunity for coaches?
• Where the money's actually being made in fitness in 2026
• Where the industry is heading next — plus your live Q&A

With: Callum, Ryan & Miles + Jonny Grayshon, Sam Hinks, Tom Blackman, Aaron
Caseley and Sohail Rashid.

Last call to get your question in — we read every one:
https://ptlaunchlab.co.uk/ask
Your watch link: [WATCH LINK]
```

### B3 — T-24h (Mon 14 July, ~6pm)
**Subject:** Tomorrow, 8pm 👀
```
{$name|"there"}, we go live tomorrow at 8pm.

The questions we're settling:
• Is the PT market saturated?
• Are GLP-1 drugs a threat or an opportunity for coaches?
• Where the money's really being made in 2026
• Your live Q&A

Watch link: [WATCH LINK]
Final chance to submit a question: https://ptlaunchlab.co.uk/ask
```

### B4 — T-1h (Wed 22 July, 7pm)
**Subject:** ⏰ Live in 1 hour
```
{$name|"there"}, we're live in an hour (8pm). Grab a brew and your questions.
👉 [WATCH LINK]
```

### B5 — T-0 (Wed 22 July, 8pm)
**Subject:** 🔴 We're LIVE now
```
{$name|"there"}, we've started — come join us. Drop your questions in the chat.
👉 [WATCH LINK]
```

### B6 — T+1 (Thu 16 July) — split by segment
**Attendees (clicked the watch link) — Subject:** Thanks for being on the live
```
{$name|"there"}, cheers for joining last night — proper session.

The full episode lands in about a week; we'll send it over. In the meantime, if
last night got you thinking about getting qualified or growing your business,
have a look: https://ptlaunchlab.co.uk/quiz
```
**No-shows — Subject:** Sorry we missed you last night
```
{$name|"there"}, you missed a good one. No worries — it's coming as a podcast
episode in about a week and we'll send it straight to you.

Next live is monthly, so you're already on the list for the next one.
```

### B7 — T+~7 (~Tue 22 July)
**Subject:** 🎧 Last week's live is now up
```
{$name|"there"}, the full recording from 22 July is now live as a podcast episode:

🎧 https://ptlaunchlab.co.uk/podcast

Next session's date drops soon — you're on the list.
Callum
```

---

## D. Setup checklist — do these to make it live

### 1. Website env vars (Vercel → ptlaunchlab-site → Settings → Environment Variables)
- [ ] `LIVE_STREAM_URL` = your unlisted YouTube/Riverside watch URL (NOT Sensitive)
- [ ] `LIVE_ZAPIER_WEBHOOK_URL` = the hook from the Zap in step 3 (NOT Sensitive — see note)
- [ ] Redeploy after adding (Vercel → Deployments → Redeploy, or push a commit)

> Mark both as **plain** env vars, not "Sensitive" — sensitive non-secret URLs have
> silently blanked on edit before.

### 2. MailerLite
- [ ] Create a **Group** called **"Live Sessions"**
- [ ] Build the **Welcome automation**: trigger = *subscriber joins group "Live Sessions"* → add steps A1 (instant) … A5 (day 10) from Track A above. Paste `[WATCH LINK]` into A1.
- [ ] Create the **Track B campaign template** (one design) and duplicate it for B1–B7; schedule per the table in §A.
- [ ] (Optional, recommended) Connect **Buzzsprout RSS → MailerLite RSS campaign** so new podcast episodes auto-email the list (Track C1).
- [ ] Build the segments from `LIVE-EVENT-EMAIL-PLAN.md` (Attendees = clicked watch link; No-shows; Engaged; Cold) — needed for the B6 split.

### 3. Zapier (connects the site to MailerLite)
- [ ] New Zap: **Trigger = Webhooks by Zapier → Catch Hook**. Copy the hook URL → that's your `LIVE_ZAPIER_WEBHOOK_URL`.
- [ ] **Action = MailerLite → Create/Update Subscriber**, add to group **"Live Sessions"**, map `name`, `email`, `phone`.
- [ ] (If you reuse the Prospectus Zap instead) add a **Filter**: only continue if `source` = `live-webinar`, then route to "Live Sessions". *Cleaner to use a dedicated Zap.*
- [ ] Turn the Zap **on**, then test with a real `/live` signup.

### 4. End-to-end test
- [ ] Submit `/live` with a test email → confirm: watch link shows on screen, A1 email arrives with the link, subscriber lands in "Live Sessions", Pixel **Lead** fires (Events Manager → Test Events).

---

## E. Status of the ad campaign (for cross-reference)
9 ads built + paused on `act_37869536`, all pointing at `/live` with UTMs
(`utm_campaign=ptll_live_july`). Don't switch the ads ON until §D steps 1–4 pass —
otherwise you're paying for clicks the funnel can't capture.
