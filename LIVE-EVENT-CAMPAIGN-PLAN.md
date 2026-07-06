# PT Launch Lab LIVE — Meta Campaign Plan (Build Pack)

Strategist's plan for **Event #1 (Wed 22 July 2026)**, ready to build in Meta Ads
Manager. Pairs with `LIVE-EVENT-META-ADS-BRIEF.md` (account/pixel/tracking) and
`LIVE-EVENT-RUNBOOK.md` (event ops).

> **Account:** `act_3635881119973565` · **Pixel:** `1133525198707842`
> **Landing page:** https://ptlaunchlab.co.uk/live (changes below = ✅ done)

---

## 1. Campaign

| Setting | Value |
|---|---|
| **Campaign name** | PT Launch Lab LIVE \| July 2026 |
| **Objective** | Leads |
| **Conversion location** | Website |
| **Optimisation** | **Live Registration** custom conversion (see brief §5) |
| **Attribution** | 7-day click |

**Total daily budget: £25/day (~£750/mo)** across the 4 ad sets below — top of the
£300–800 range. Scale or trim per CPL after data comes in.

---

## 2. Ad sets

### Ad Set 1 — Warm Audience · £8/day
**Custom audiences (OR):** Email list · Course leads · Prospectus downloads · Quiz leads ·
Website visitors 180d · IG engagers 365d · FB engagers 365d · YouTube engagers (if available)
**Exclude:** Event registrants
→ *Should be the cheapest CPL source.*

### Ad Set 2 — Quiz Segments · £5/day
**Custom audiences:** Starter · Switcher · Returner
→ *Already self-identified as potential PTs — messaging can be much stronger.*
**Exclude:** Event registrants

### Ad Set 3 — Lookalikes · £7/day
**Stack:** 1% Email LAL + 1% Quiz Lead LAL + 1% Course Lead LAL
UK · 18–45 · Advantage+ Audience **ON**
**Exclude:** Event registrants + existing custom audiences from Ad Set 1

### Ad Set 4 — Broad · £5/day
UK · 18–45 · **No** interests / behaviours / fitness targeting (no Gymshark, no MyProtein).
Let Meta work.
**Exclude:** Event registrants

> Set up an **"Event registrants" custom audience** = visitors of `/live` who fired the
> Live Registration conversion (or URL contains `/live` + Lead). Exclude it everywhere so
> you stop paying to reach people already signed up.

---

## 3. Creative — launch with 4 VIDEOS (not graphics, not posters)

### 🎯 Lead creative (build + launch this FIRST — the strategist's favourite angle)
Hook: **"Everyone says the PT industry is saturated. The people actually making money disagree."**
Why first: hits aspiring PTs, struggling PTs, career changers AND established coaches at once.
Launch it, get data, then optimise from real numbers.

### Video 1 — "The PT Industry Is Changing"
- **Hook:** Is the PT industry getting harder?
- **Body:** Everyone keeps saying personal training is dead. That GLP-1 drugs will replace coaches. That the market is saturated. That nobody can make money anymore. So we're bringing together some of the UK's leading coaches and gym owners for a live discussion on what's actually happening in the fitness industry right now. Join us live on July 22nd.
- **CTA:** Register free.

### Video 2 — "Where The Money Is"
- **Hook:** Where are PTs actually making money in 2026?
- **Body:** Not what influencers say. Not what course providers say. What people doing it every day are seeing on the ground. Join us live and ask your questions directly.

### Video 3 — "Authority" (fast cuts)
- Speaker photos · names · businesses.
- **Text overlay:** "8 Fitness Industry Leaders / One Live Discussion / No Fluff."
- Simple.

### Video 4 — "The Contrarian"
- **Hook:** Most PTs are worried about the wrong thing.
- **Body:** Everyone is talking about AI. Everyone is talking about GLP-1s. Everyone is talking about saturation. But that's not what's deciding who succeeds in fitness. Join us live and hear what the people building businesses right now actually think.

---

## 4. Primary text + headlines

### Copy Variation 1
**Primary text:**
> Thinking about becoming a PT? Already qualified but struggling to grow? Or wondering what the fitness industry actually looks like in 2026?
>
> We're bringing together some of the UK's leading coaches, gym owners and fitness professionals for a live discussion covering:
> ✓ Is the PT market saturated?
> ✓ Are GLP-1 weight loss drugs a threat or opportunity?
> ✓ Where is the money really being made in fitness right now?
> ✓ Live audience Q&A
>
> Free to attend. Register now and we'll send you the private watch link.

**Headline:** The Real State Of The PT Industry In 2026

### Copy Variation 2
**Primary text:**
> Everyone has an opinion about the fitness industry. We're bringing together the people actually building businesses inside it.
>
> Join PT Launch Lab LIVE and hear what some of the UK's leading coaches think about:
> • The future of personal training • Online coaching • AI • GLP-1 drugs • Standing out in a crowded market
>
> Free registration. Limited live places.

**Headline:** Live Fitness Industry Panel

---

## 5. Landing page changes — ✅ IMPLEMENTED on /live

| Strategist's ask | Status |
|---|---|
| Reframe from "register for webinar" → series positioning: **"PT Launch Lab LIVE — Monthly live discussions with leading fitness professionals,"** then the **July Session** + title | ✅ Done (hero rebuilt) |
| Add **Featured Speakers** section — photos, names, businesses, credibility | ✅ Done (avatar grid; drop headshots in `/public/live/speakers/` + set `photo` in `app/live/event.ts` to replace initials) |
| Add **Questions We'll Be Discussing** section | ✅ Done (saturated market / GLP-1 / what's working / where it's heading) |

**Outstanding:** add real speaker headshots (currently clean initials avatars).

---

## 6. KPIs — Month 1 cost-per-registration

| Tier | CPL |
|---|---|
| Good | £2–£5 |
| Very good | £1–£3 |
| Excellent | sub-£1.50 |

Warm audiences (Ad Set 1) could easily land under £2.

---

## 7. The compounding loop (post-event)

When Event #1 ends, **immediately cut 10–20 clips** from the discussion. Those clips
become the ads for **August** — real, native, social-proofed creative that outperforms
anything pre-produced. Repeat monthly: each event funds and fuels the next.

---

## 8. Build order

1. ✅ Landing page changes (done — live now)
2. Add real speaker headshots to `/public/live/speakers/`
3. Set up the **Live Registration** custom conversion + verify CAPI dedup (brief §5)
4. Create the **Event registrants** custom audience (for exclusions)
5. Build **lead creative first** ("saturated… the people making money disagree"), then Videos 1–4
6. Build the 4 ad sets, attach creative + both copy variations
7. Launch ASAP (event is ~3 weeks out), optimise from real CPL
8. After the event: cut 10–20 clips → August creative
