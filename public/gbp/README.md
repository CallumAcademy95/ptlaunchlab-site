# Google Business Profile photos

Drop finished images in this folder. Once deployed they are publicly reachable at
`https://ptlaunchlab.co.uk/gbp/<filename>` — which is what Make needs, since it
cannot upload a local file to Google.

Two separate jobs, don't mix them up:

1. **Profile photos** — uploaded by hand in the Business Profile editor. These are
   what shows in the knowledge panel and Maps. Google wants *authentic photos of
   the real business*. Do not use stock or AI-generated shots of premises that
   don't exist; it is grounds for removal and it misleads people deciding whether
   to turn up.
2. **Post images** — referenced by URL from `scripts/gbp-posts.json`. Branded
   graphics are fine here (course cards, event promos, the partnership
   infographic) alongside real photos.

## Specs

| Use | Aspect | Size | Notes |
|---|---|---|---|
| Post image | 4:3 | 1200×900 | Google crops other ratios badly |
| Logo | 1:1 | 720×720 | |
| Cover | 16:9 | 1024×576 min | Sets the panel header |
| Any | — | 10 KB–5 MB | JPG or PNG only |

Compress before committing. Several existing site images are over 3 MB, which is
fine for Google's limit but bad for page speed if reused on the site.

## Shot list — what's actually missing

The profile currently has no owner photos at all; the main image is still Google's
Street View car shot of the access road. Ultimate Shred Academy has 17. This is the
single biggest gap on the profile.

**Exterior (2–3)**
- Unit 3 frontage with PT Launch Lab signage clearly readable
- The business park entrance / approach, so people can find it
- Parking and door

**Interior (3–4)**
- The training space, lit, tidy, in use
- Classroom / assessment area set up for a practical
- Wide shot that gives a sense of the size

**People at work (4–5)** — highest-performing category on GBP
- A practical assessment happening, learner and assessor both in frame
- Someone coaching on the gym floor
- A small group session mid-flow, not posed
- Learners with certificates — faces, smiles, get written permission

**Team (3)**
- Callum, Ryan and Miles individually, head and shoulders, plain background
- One together

**Identity (2)**
- Logo square on brand navy
- Cover image, 16:9, gold on navy per the brand system

## Rules of thumb

- Landscape, shot on a recent phone, good light, no flash
- No text overlays or borders on profile photos — Google demotes them
- Faces beat empty rooms; a photo of an empty gym at 6am converts nothing
- Geotagging does nothing for ranking, ignore anyone who tells you otherwise
- Upload steadily, a few a week, not 20 in one go

## Naming

`exterior-signage.jpg`, `interior-training-floor.jpg`, `team-callum.jpg`,
`post-live-event-jul26.png` — lowercase, hyphenated, descriptive.
