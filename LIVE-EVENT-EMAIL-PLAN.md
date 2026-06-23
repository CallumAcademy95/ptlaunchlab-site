# PT Launch Lab LIVE — MailerLite Email Plan

The full email architecture for the **"Live Sessions"** list. This list is
**dual-purpose**: an *event list* (live webinar reminders) AND a *nurture list*
(podcast, course marketing, other PT Launch Lab offers). Those two jobs run on
**separate tracks** so reminders stay sharp and nurture never clashes with a hot
event week.

> Supersedes the 5-email block in `LIVE-EVENT-RUNBOOK.md` §Phase 2.
> Merge tags: `{$name|"there"}`. Placeholders to swap each event:
> `{{WATCH_LINK}}` `{{ASK_LINK}}`(=`/ask`) `{{EPISODE_LINK}}` `{{TOPIC}}` `{{WHEN}}` `{{PANEL}}`.

---

## How it fits together

```
                         ┌─────────────────────────────────────────┐
  /live registration ──► │  GROUP: "Live Sessions" (master list)    │
                         └─────────────────────────────────────────┘
                              │              │                 │
              TRACK A         │   TRACK B    │     TRACK C      │
        Welcome & onboarding  │  Event cycle │  Ongoing nurture │
        (automation, ONCE     │  (recurring  │  (broadcasts +   │
         per subscriber)      │   monthly)   │   RSS + triggers)│
```

| Track | What | MailerLite mechanism | Cadence |
|---|---|---|---|
| **A — Welcome** | First ~2 weeks: who we are, the value, soft course intro | **Automation**, trigger = *joins "Live Sessions"* | Once per subscriber, ever |
| **B — Event cycle** | Pre-event reminders + post-event replay | **Scheduled campaigns** to the group each month + 1 instant-confirmation automation | Every month, around each event |
| **C — Nurture/marketing** | New podcast episodes, course pushes, other PTLL plugins, win-back | **RSS auto-email** (podcast) + **broadcasts** + **re-engagement automation** | Ongoing |

**Key mechanics**
- **Instant confirmation** must fire on signup (a campaign can't) → it's a 1-email
  automation. Edit its link/date once per event (one field).
- **Reminders carry that month's watch link** → they go to the *whole group* as
  scheduled campaigns each month (so returning subscribers are re-invited too, not
  just new signups).
- **New podcast episodes** → connect the **Buzzsprout RSS feed to a MailerLite
  RSS campaign** so every new episode auto-emails the list. Zero manual work, keeps
  the list warm between events.

---

## TRACK A — Welcome & onboarding (automation, fires once)

Trigger: subscriber joins **"Live Sessions"**. Runs once, regardless of which
month they joined. Introduces the brand, delivers value, soft-intros the course.

### A1 — Instant: "You're in" *(also the event confirmation)*
**Subject:** You're in 🎟️ here's your watch link
```
{$name|"Hey"}, you're on the list for PT Launch Lab LIVE.

📅 Next session: {{WHEN}}
🎙️ {{TOPIC}}

Save your watch link: {{WATCH_LINK}}
Add it to your calendar so you don't forget.

🎤 Got a question for the panel? Submit it here and we'll answer the best ones
live: {{ASK_LINK}}

A quick heads up on what you've joined: once a month we go live with leading UK
coaches and gym owners — no scripts, real talk, your questions answered. A week
later it lands as a podcast episode. You'll also hear from us between sessions
with the best episodes and the odd thing we think will genuinely help you.

See you on the live,
Callum — PT Launch Lab
```

### A2 — Day 2: Who we are / why we do this
**Subject:** Why two gym owners started doing this
```
{$name|"there"}, quick intro so you know who's in your inbox.

PT Launch Lab is run by us — Callum, Ryan and Miles — gym owners and coaches
who've hired and trained hundreds of PTs. We got sick of the fitness industry
being full of hype and influencers who've never actually built anything.

So we started having the honest conversations on the record: what actually
works, what's nonsense, and how real people build careers and businesses in
fitness. That's the live panel. That's the podcast.

If you only listen to one episode first, make it this one: {{EPISODE_LINK}}

More soon,
Callum
```

### A3 — Day 4: A genuine quick win (value, no pitch)
**Subject:** The 3 things actually working for PTs right now
```
{$name|"there"}, no pitch today — just something useful.

From what we and the coaches we know are seeing on the ground, three things are
quietly working in 2026 while everyone else panics about AI and saturation:

1. Niching down hard enough that you're the obvious choice for ONE type of client.
2. Owning the in-person/accountability piece machines can't replace.
3. Treating retention as the business — keeping clients 12+ months, not chasing new ones.

We go deep on this stuff live. Speaking of which — your next session is {{WHEN}}.

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

Then come settle the debates with us live, {{WHEN}}.
Callum
```

> After A5, the subscriber simply continues receiving Track B (event) + Track C
> (nurture) sends. No further onboarding.

---

## TRACK B — Monthly event cycle (recurring)

Sent each month to the **whole "Live Sessions" group** (so returning members are
re-invited), except the instant confirmation (automation, new joiners only).
Build these once as a **campaign template**, then duplicate + reschedule each month.

### B1 — Registration opens / announce (~2–3 weeks out)
**Subject:** Next PT Launch Lab LIVE: {{TOPIC}}
```
{$name|"there"}, the next live session is locked in.

📅 {{WHEN}}
🎙️ {{TOPIC}}
🎤 On the panel: {{PANEL}}

You're already on the list, so you're in — here's your watch link: {{WATCH_LINK}}

Want something specific covered? Submit your question now and we'll answer the
best ones live: {{ASK_LINK}}
```

### B2 — T-7 days: 1 week to go
**Subject:** 1 week: {{TOPIC}}
```
{$name|"there"}, one week until we go live.

Here's what we're getting into:
{{TOPIC}}

With: {{PANEL}}

Last call to get your question in — we read every one: {{ASK_LINK}}
Your watch link: {{WATCH_LINK}}
```

### B3 — T-24h: Tomorrow night
**Subject:** Tomorrow, 8pm 👀
```
{$name|"there"}, we go live tomorrow at 8pm.

The questions we're settling:
• Is the PT market saturated?
• Are GLP-1 drugs a threat or an opportunity for coaches?
• Where the money's really being made in 2026
• Your live Q&A

Watch link: {{WATCH_LINK}}
Final chance to submit a question: {{ASK_LINK}}
```

### B4 — T-1h: 1 hour to go
**Subject:** ⏰ Live in 1 hour
```
{$name|"there"}, we're live in an hour (8pm). Grab a brew and your questions.
👉 {{WATCH_LINK}}
```

### B5 — T-0: We're live
**Subject:** 🔴 We're LIVE now
```
{$name|"there"}, we've started — come join us. Drop your questions in the chat.
👉 {{WATCH_LINK}}
```

### B6 — T+1 day: Thanks / you missed it *(split by segment)*
**To attendees** (clicked the watch link) — **Subject:** Thanks for being on the live
```
{$name|"there"}, cheers for joining last night — proper session.

The full episode lands in about a week; we'll send it over. In the meantime, if
last night got you thinking about getting qualified or growing your business,
have a look: https://ptlaunchlab.co.uk/quiz
```
**To no-shows** — **Subject:** Sorry we missed you last night
```
{$name|"there"}, you missed a good one. No worries — it's coming as a podcast
episode in about a week and we'll send it straight to you.

Next live is monthly, so you're already on the list for the next one.
```

### B7 — T+~7 days: The episode is live
**Subject:** 🎧 Last week's live is now up
```
{$name|"there"}, the full recording from {{WHEN}} is now live as a podcast episode:

🎧 {{EPISODE_LINK}}

Next session's date drops soon — you're on the list.
Callum
```

---

## TRACK C — Ongoing nurture & marketing (between events)

Keeps the list warm and monetises it without burning it out.

### C1 — New podcast episode (every drop, incl. non-event episodes)
**Best setup:** connect the **Buzzsprout RSS feed → MailerLite RSS campaign** so
each new episode auto-emails the list. Template:
**Subject:** New episode: {{EPISODE_TITLE}}
```
{$name|"there"}, fresh episode out now:

🎧 {{EPISODE_TITLE}}
{{EPISODE_BLURB}}

Listen/watch: {{EPISODE_LINK}}
```

### C2 — Course marketing (periodic broadcasts, ~1–2×/month max)
Rotate angles — don't hard-sell every time. Examples to build as broadcasts:
- "Thinking about it? Here's exactly how the course works" → `/courses`
- "Too old / no time / not sure it's worth it?" objection-buster → relevant SEO page
- Payment-plan / promo push (tie to a deadline) → `/enrol`
- Quiz re-prompt: "Not sure which path is right? 60 seconds:" → `/quiz`

### C3 — Other PT Launch Lab plugins (rotate in)
Mentorship Hub · PT salary calculator (`/pt-salary-calculator`) · prospectus
download · book-a-call (`/book-call`) · GLP-1 coaching course · gym partnerships.
One soft plug per nurture email max.

### C4 — Re-engagement / win-back (automation)
Trigger: no opens in 90 days. 2-email sequence:
1. "Still want these? Here's what you've missed" (best recent episode + next live)
2. "We'll stop emailing unless…" (confirm-to-stay) → keeps the list clean + deliverability high.

---

## Segments to build in MailerLite

| Segment | Definition | Used for |
|---|---|---|
| **New this month** | joined "Live Sessions" in last 30d | tailor first-event framing |
| **Attendees** | clicked `{{WATCH_LINK}}` around event time | B6 attendee version, warmer course pitch |
| **No-shows** | on list but didn't click watch link | B6 no-show version |
| **Engaged** | opened in last 60d | course pushes land here first |
| **Cold** | no opens 90d+ | re-engagement (C4) |
| **Course-intent** | clicked `/quiz` `/courses` `/enrol` `/book-call` | heavier course marketing |

---

## Monthly operating rhythm

Each month, working back from the event date:

1. **~3 weeks out** — set the new event in `app/live/event.ts` + `LIVE_STREAM_URL`. Duplicate the Track B campaign template, swap `{{WATCH_LINK}}`/`{{WHEN}}`/`{{TOPIC}}`/`{{PANEL}}`, schedule B1–B5. Update the A1 confirmation link/date.
2. **Event week** — pause Track C course pushes (don't compete with reminders).
3. **Day after** — send B6 (split attendees/no-shows).
4. **~1 week after** — publish episode, send B7, resume Track C.
5. **Always-on** — RSS podcast emails (C1) + 1–2 nurture/course broadcasts (C2/C3) per month + re-engagement running in the background (C4).

## Sending-cadence rules (so it never feels spammy)
- **~3:1 value-to-pitch.** Most emails give before they ask.
- **Never hard-sell the course during event week** — that week is all about attendance.
- **Max ~2 course-marketing broadcasts/month** outside the event cycle.
- During the heaviest reminder run (B3–B5 in 24h), send nothing else.
