# Podcast feed — the settings only Callum can change

The site side is done. Everything below lives in **Riverside hosting settings**
or **YouTube Studio**, so it needs your login, not a deploy.

Feed: `https://api.riverside.com/hosting/WXwoGTza.rss`
Keep the old Buzzsprout URL 301ing to it — Apple, Spotify and Podchaser were all
submitted with the Buzzsprout address.

---

## 1. Point the show's website at ptlaunchlab.co.uk  ← highest value

The feed's channel-level `<link>` is currently:

    <link>https://www.buzzsprout.com/2615411</link>

Every directory that mints a link from this feed — Apple, Podcast Index, Listen
Notes, Podchaser, snipd, audecibel, podcastplayer — is therefore crediting
**Buzzsprout**, not you. This is the single reason the podcast is not feeding the
backlink profile.

**Change the show's Website / Show URL in Riverside to:**

    https://ptlaunchlab.co.uk/podcast

## 2. Give every episode its own link

No item in the feed has a `<link>` element, so episode pages on Spotify and Apple
link nowhere. Each episode's link should be its page on the site:

    https://ptlaunchlab.co.uk/podcast/<slug>

Slugs are in the table below.

## 3. Add the transcript tag to every episode

1 of 27 episodes currently carries `<podcast:transcript>`. The site now serves a
plain-text transcript for all 32 episodes at a stable URL. In Riverside, set each
episode's transcript to its URL below, type `text/plain`:

| Ep | Episode | Transcript URL |
|---|---|---|
| ? | Good Clients vs Nightmare Clients — What Every PT Needs to Know | `https://ptlaunchlab.co.uk/podcast/good-clients-vs-nightmare-clients-what-every-pt-needs-to-know/transcript` |
| ? | Sick of the 9–5? How to Build a Fitness Career You Actually Want | `https://ptlaunchlab.co.uk/podcast/sick-of-the-9-5-how-to-build-a-fitness-career-you-actually-want/transcript` |
| ? | The Brutal Reality of a Personal Trainer's Working Hours | `https://ptlaunchlab.co.uk/podcast/the-brutal-reality-of-a-personal-trainers-working-hours/transcript` |
| ? | Why Most Fitness Influencers Are Lying to You | `https://ptlaunchlab.co.uk/podcast/why-most-fitness-influencers-are-lying-to-you/transcript` |
| ? | Will AI Replace Personal Trainers? The Honest Answer | `https://ptlaunchlab.co.uk/podcast/will-ai-replace-personal-trainers-the-honest-answer/transcript` |
| 6 | How I Built an Online PT Business to £500K — Ryan's Full Story | `https://ptlaunchlab.co.uk/podcast/how-i-built-an-online-pt-business-to-500k-ryans-full-story/transcript` |
| 7 | Is Becoming a Personal Trainer Still Worth It? The Honest Answer | `https://ptlaunchlab.co.uk/podcast/is-becoming-a-personal-trainer-still-worth-it-the-honest-answer/transcript` |
| 8 | What PureGym Looks for When Hiring Personal Trainers — Mac Livock | `https://ptlaunchlab.co.uk/podcast/what-puregym-looks-for-when-hiring-personal-trainers-mac-livock/transcript` |
| 9 | How We Scaled PT Launch Lab Courses — with Sam, Merve EdTech | `https://ptlaunchlab.co.uk/podcast/how-we-scaled-pt-launch-lab-courses-with-sam-merve-edtech/transcript` |
| 10 | Why I Shut Down My £500K Online PT Business — The Honest Story | `https://ptlaunchlab.co.uk/podcast/why-i-shut-down-my-500k-online-pt-business-the-honest-story/transcript` |
| 11 | How Running Saved Me from Addiction — Matty Bell | `https://ptlaunchlab.co.uk/podcast/how-running-saved-me-from-addiction-matty-bell/transcript` |
| 12 | How Gemma Left Her Corporate Job to Become a Personal Trainer | `https://ptlaunchlab.co.uk/podcast/how-gemma-left-her-corporate-job-to-become-a-personal-trainer/transcript` |
| 13 | How Personal Training Made Me a Better Racing Driver — Zak Meakin | `https://ptlaunchlab.co.uk/podcast/how-personal-training-made-me-a-better-racing-driver-zak-meakin/transcript` |
| 14 | 3 Things I Wish I Knew Before Becoming a Personal Trainer — Luke McCarthy | `https://ptlaunchlab.co.uk/podcast/3-things-i-wish-i-knew-before-becoming-a-personal-trainer-luke-mccarthy/transcript` |
| 15 | From Addiction to Personal Trainer — Marcus, Mean and Clean | `https://ptlaunchlab.co.uk/podcast/from-addiction-to-personal-trainer-marcus-mean-and-clean/transcript` |
| 16 | How to Scale Your PT Business Online — with Miles | `https://ptlaunchlab.co.uk/podcast/how-to-scale-your-pt-business-online-with-miles/transcript` |
| 19 | Super League Debut to Heart Surgery — Kiel's Story | `https://ptlaunchlab.co.uk/podcast/super-league-debut-to-heart-surgery-kiels-story/transcript` |
| 20 | How Max Clark Opened His Own Boxing Gym at 18 | `https://ptlaunchlab.co.uk/podcast/how-max-clark-opened-his-own-boxing-gym-at-18/transcript` |
| 21 | What Most PTs Get Wrong About Movement — Kim Tomlin | `https://ptlaunchlab.co.uk/podcast/what-most-pts-get-wrong-about-movement-kim-tomlin/transcript` |
| 22 | British Powerlifting Champion to Bodybuilding Burnout — Sam Hincks | `https://ptlaunchlab.co.uk/podcast/british-powerlifting-champion-to-bodybuilding-burnout-sam-hincks/transcript` |
| 23 | The Reality of Running Multiple Fitness Businesses | `https://ptlaunchlab.co.uk/podcast/the-reality-of-running-multiple-fitness-businesses/transcript` |
| 24 | From 46 Stone to Qualified Personal Trainer — Jack Atkinson | `https://ptlaunchlab.co.uk/podcast/from-46-stone-to-qualified-personal-trainer-jack-atkinson/transcript` |
| 25 | World-Class Dancer to Yoga Studio Owner: Laura's Story | `https://ptlaunchlab.co.uk/podcast/world-class-dancer-to-yoga-studio-owner-lauras-story/transcript` |
| 26 | Building a Martial Arts Gym from Scratch — Ty Harrison | `https://ptlaunchlab.co.uk/podcast/building-a-martial-arts-gym-from-scratch-ty-harrison/transcript` |
| 27 | From Addiction to Full-Time Boxing Coach: Pembo's Story | `https://ptlaunchlab.co.uk/podcast/from-addiction-to-full-time-boxing-coach-pembos-story/transcript` |
| 28 | From ICU Nurse to Fitness Business: Maria's Career Change | `https://ptlaunchlab.co.uk/podcast/from-icu-nurse-to-fitness-business-marias-career-change/transcript` |
| 29 | What 90% of Blood Tests Reveal (Even When You Feel Fine) | `https://ptlaunchlab.co.uk/podcast/what-90-of-blood-tests-reveal-even-when-you-feel-fine/transcript` |
| 30 | From Council Estate to Stage with Dizzee Rascal — Now I'm a Personal Trainer | `https://ptlaunchlab.co.uk/podcast/from-council-estate-to-stage-with-dizzee-rascal-now-im-a-personal-trainer/transcript` |
| 31 | Royal Marines & Afghanistan to Personal Trainer — The Truth About This Industry | `https://ptlaunchlab.co.uk/podcast/royal-marines-and-afghanistan-to-personal-trainer-the-truth-about-this-industry/transcript` |
| 32 | Why In-Person Personal Training Will Be AI-Proof — Sohail Rashid | `https://ptlaunchlab.co.uk/podcast/why-in-person-personal-training-will-be-ai-proof-sohail-rashid/transcript` |
| 33 | Ridge Holland on Big E, Rugby League & Life After WWE | `https://ptlaunchlab.co.uk/podcast/ridge-holland-on-big-e-rugby-league-and-life-after-wwe/transcript` |
| 34 | AI, GLP-1s and the Death of the £20 Personal Trainer — PT Launch Lab LIVE | `https://ptlaunchlab.co.uk/podcast/ai-glp-1s-and-the-death-of-the-20-personal-trainer/transcript` |

## 4. Fix the duplicate upload on YouTube

The playlist feed shows **two entries with the same title published 3 Aug 2026**
("AI, GLP-1s and the Death of the £20 Personal Trainer"). Delete or unlist one —
right now it splits views and signals on the newest episode.

## 5. Backfill the episodes missing from audio

32 episode pages on the site, 27 items in the audio feed. Title matching flags
these as absent from the audio host:

- Ep 6 — How I Built an Online PT Business to £500K (Ryan's Full Story)
- Ep 19 — Super League Debut to Heart Surgery (Kiel's Story)
- Ep 20 — How Max Clark Opened His Own Boxing Gym at 18
- Ep 33 — Ridge Holland on Big E, Rugby League & Life After WWE

Caveat: Ep 33 appears in the feed retitled "Ridge Holland: From WWE to Online
Personal Trainer", so the real gap is likely 3, not 4. Worth eyeballing the list
rather than trusting the match.

Also worth knowing: the feed went quiet between **4 May and 3 Aug 2026**.
Syndication links accrue per episode, so a dormant feed accrues nothing.
