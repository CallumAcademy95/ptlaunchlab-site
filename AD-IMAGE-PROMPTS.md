# PT Launch Lab — AI Image Generation Prompts

**Where to use these:** Paste into Gemini (https://gemini.google.com) — works on the free tier. Also works in ChatGPT (GPT-Image-1), Midjourney, Imagen, Firefly. Each prompt is tool-agnostic.

**Generate twice per ad** — once for 1:1 (feed) and once for 9:16 (Stories/Reels). Most tools let you specify aspect ratio in the prompt or via a dropdown.

**Reality check on AI text rendering:** Modern image gen (Nano Banana / GPT-Image-1) gets short text right ~80% of the time. If your generated image has misspelled or weird text, regenerate 1-2 times — usually the second attempt is clean. If it's still wrong, generate background-only (see "Background-only fallback" at the bottom of each ad) and overlay the text in Canva yourself.

---

## Universal style preamble (paste at the top of every prompt)

Copy this once, then add the ad-specific section below it:

```
Create a Meta ad creative for PT Launch Lab — a UK personal trainer qualification brand.

Visual style:
- Solid dark navy background (hex #072B4A), almost no gradient
- Gold accent colour (hex #F5C518) used sparingly for emphasis words and a single thin underline
- Typography: bold condensed sans-serif (like Bebas Neue, Oswald, or Barlow Condensed) — extra-bold weight, tight letter spacing, near-zero line height
- White (#FFFFFF) for body text
- Premium, education-brand feel — NOT internet-marketing energy
- Small "PT Launch Lab" wordmark logo top-left (white text, max 80px high)
- Mobile-first composition — keep all important text within the middle 80% of the frame

Do NOT include:
- Stock fitness imagery
- Shredded models or muscle close-ups
- Gym bro energy or aggressive branding
- Neon scarcity badges, "limited time" overlays, or fake countdowns
- Light backgrounds or rainbow gradients
- Serif fonts or decorative fonts
- Emojis in headlines
```

---

## v2 — POP LAYER (apply to EVERY ad) ⭐ NEW 2026-06-05

The v1 statics are clean but flat. After studying OriGym's live Meta creatives (real faces, baked-in proof, button-style CTAs, depth), add these **on-brand** pop upgrades when you regenerate. They lift CTR without betraying the premium/anti-hype positioning — so **no** loud colours, sale badges or urgency.

**1. Depth (do in AI gen):** instead of pure flat navy, add a **large subtle diagonal tonal panel** — a darker navy wedge (`#051D33`) cutting across the lower-left at ~20° behind the headline, plus a single **thin gold diagonal accent line**. Gives dimension so the ad doesn't read as a flat slide. Keep it whisper-quiet.

**2. A real human (Canva composite — NOT AI):** the biggest miss in v1 is zero faces. Generate the text/background in Gemini, then in **Canva composite a REAL cut-out photo** on the right third:
   - Cold Switcher → a founder candid (`/callum.webp` or `/miles.webp`) OR a real 30-something looking thoughtful
   - Cold Starter → a real gym-floor learner (`/learner-*.png`)
   - Cold Returner → keep softer; a warm real learner photo, relaxed, NOT gym kit
   - **Never** AI-generate the person (brand rule). Composite a real asset.

**3. Trust strip (do in AI gen or Canva):** a **slim bottom bar** in soft white, small caps, low-key: `NCFE LEVEL 2+3 · CIMSPA · ★★★★★ 17 GOOGLE REVIEWS`. Quiet credibility — matches OriGym's social proof without the loud Trustpilot graphic.

**4. CTA as a BUTTON, not a bare arrow:** replace the thin gold arrow with a **solid gold pill button** (`#F5C518` fill, dark navy `#072B4A` text, rounded corners) reading the ad's CTA. Reads clickable → lifts CTR. Cold = `TAKE THE QUIZ →` · RT = `CHAT ON WHATSAPP →` (+ small WhatsApp glyph).

**5. Differentiator badge (optional, top-right):** a small gold-outline badge: `RUN BY GYM OWNERS WHO HIRE PTs`. It's the one claim no competitor (OriGym, PT Academy, anyone) can make — the anti-factory wedge, baked into the visual.

> Priority if time-boxed: **#4 (button) + #2 (face) first** — they move CTR most. #1 and #3 are polish.

---

## AD 1 — Career Switcher (Cold, primary)

**Audience:** 28-40 year olds, burned out at work, considering career change.

### Prompt (square 1:1, 1080×1080)

```
[paste the universal style preamble above first, then:]

Composition:
- Headline dominates the upper two-thirds of the frame in extra-bold condensed sans-serif
- Headline reads exactly: "Stuck In A Job You Hate?"
- The words "Stuck In A Job" in solid white
- The words "You Hate?" in gold (#F5C518)
- Thin gold horizontal line under the headline
- Small uppercase eyebrow ABOVE the headline reads: "FREE 60-SEC CAREER QUIZ" in gold, much smaller text, all caps, wide letter spacing
- Below the headline, a single line of soft white body text: "There's a real route into PT — and you don't need a degree."
- Bottom-right corner: a small gold arrow icon hinting at "tap to find out"

Aspect ratio: 1:1 (1080 × 1080 pixels)
```

### Prompt (vertical 9:16, 1080×1920)

Same prompt, change last line to: `Aspect ratio: 9:16 (1080 × 1920 pixels), with the headline centred vertically in the middle 60% of the frame.`

### Background-only fallback

If AI keeps mangling the text, generate just the background:

```
A solid dark navy (#072B4A) backdrop with a subtle gold (#F5C518) thin horizontal accent line at the lower-third mark and a faint gold radial glow at 8% opacity behind where headline text would sit. Pure background — no text, no people, no objects. Aspect ratio 1:1.
```

Then overlay the headline + body text in Canva yourself.

---

## AD 2 — Gym Starter (Cold)

**Audience:** 18-30 year olds, gym regulars, considering PT as a career.

### Prompt (square 1:1)

```
[universal style preamble, then:]

Composition:
- Headline dominates upper two-thirds in extra-bold condensed sans-serif
- Headline reads exactly: "You're Already In The Gym Anyway…"
- The words "You're Already In The Gym" in solid white
- The word "Anyway…" in gold (#F5C518), italic style if possible
- Small uppercase eyebrow above headline: "LEVEL 2 + 3 PT · ONLINE · NO DEGREE" in gold, all caps, wide letter spacing, much smaller
- Body subline below headline, soft white: "Stop renting motivation. Start coaching it."
- Bottom-left: a small gold outline icon of a dumbbell (vector style, not photographic), about 60px wide
- Bottom-right: small gold arrow

Aspect ratio: 1:1 (1080 × 1080 pixels)
```

### Prompt (9:16)

Same, change aspect to: `Aspect ratio: 9:16 (1080 × 1920 pixels), headline centred in upper-middle third.`

### Background-only fallback

```
A dark navy (#072B4A) backdrop with a very subtle dark-grey overlay at 5% opacity suggesting a gym-floor texture. A single small gold (#F5C518) dumbbell outline icon in the bottom-left corner. No people, no faces, no text. Aspect ratio 1:1.
```

---

## AD 3 — Returner (Cold) ⚠️ SOFTER TONE

**Audience:** 32-55, female-skewing, parents/returners, rebuilding confidence.

**Critical:** This ad should NOT feel like a fitness ad. No gym energy, no aggressive typography. Soft, warm, kind.

### Prompt (square 1:1)

```
[universal style preamble, then OVERRIDE these specifics:]

Tone override for this ad: warmer, softer feel. Slightly less aggressive typography weight (semibold instead of extra-bold). A subtle gold radial glow at 10% opacity behind the headline gives a hint of warmth, like soft morning light. The ad should feel calming, not energetic.

Composition:
- Headline reads exactly: "Ready For Something That's Yours Again?"
- The words "Ready For Something" in white
- The words "That's Yours Again?" in gold (#F5C518)
- Eyebrow above headline: "FOR PARENTS + RETURNERS" in gold, smaller, all caps, wide letter spacing
- Body subline below: "A flexible PT qualification built for real life — kids, mortgage, school run."
- NO fitness imagery. NO dumbbells. NO gym icons. NO athletic energy at all.
- Background: dark navy (#072B4A) with a soft warm gold radial glow at 10% opacity emanating from the upper-right corner (like dawn light through a window)

Aspect ratio: 1:1 (1080 × 1080 pixels)
```

### Prompt (9:16)

Same, change aspect line: `Aspect ratio: 9:16 (1080 × 1920 pixels)`

### Background-only fallback

```
A dark navy (#072B4A) backdrop with a soft warm gold (#F5C518) radial glow at 10% opacity in the upper-right corner — like first morning light through a window. No objects, no people, no text. The mood is calm and gentle. Aspect ratio 1:1.
```

---

## AD 4 — Retargeting · "Most PT Courses Leave You Stuck"

**Audience:** Site visitors who didn't convert. Contrast-positioning ad.

### Prompt (square 1:1)

```
[universal style preamble, then:]

Composition:
- Headline at top of frame in extra-bold condensed sans-serif: "Most PT Courses Leave You Stuck"
- Below, in gold (#F5C518), a smaller line: "We don't."
- Eyebrow above headline in gold all caps: "WHY PT LAUNCH LAB IS DIFFERENT"
- Below the headline+subline, a compact two-column comparison:
  - LEFT column (50% width) header in white at 50% opacity reads: "MOST PT COURSES" (uppercase, small, wide letter-spacing)
    - Three rows below, each with a red (#EF4444) × mark followed by short white text:
      - "Just a certificate"
      - "No business help"
      - "Figure clients out alone"
  - RIGHT column (50% width) header in gold (#F5C518) reads: "PT LAUNCH LAB" (uppercase, small, wide letter-spacing)
    - Three rows below, each with a gold ✓ mark followed by short white text:
      - "Personal tutor included"
      - "Mentorship Hub bundled free"
      - "Guaranteed gym interviews"
- Bottom of frame, centred: a solid gold (#F5C518) rounded pill button with dark navy text reading "Chat on WhatsApp →" plus a small WhatsApp glyph (NOT a quiz CTA — these run as WhatsApp Click-to-Chat ads)

Aspect ratio: 1:1 (1080 × 1080 pixels)
```

### Prompt (9:16)

Same prompt. The two-column comparison stacks naturally in 9:16.
`Aspect ratio: 9:16 (1080 × 1920 pixels)`

### Background-only fallback

```
Dark navy (#072B4A) background with a vertical thin gold (#F5C518) divider line down the centre of the frame, splitting it into two equal columns. No text, no icons, no other content. Aspect ratio 1:1.
```

Then add the headline, columns, and ticks/crosses in Canva.

---

## AD 5 — Retargeting · "Too Late?" Objection Handler

**Audience:** Site visitors who hesitated. Direct objection handling.

### Prompt (square 1:1)

```
[universal style preamble, then:]

Composition:
- Eyebrow at top in gold all caps: "OBJECTION ANSWERED"
- Headline in extra-bold condensed sans-serif (dominant in upper half):
  - "Too Late To Become A PT?" in white
  - "Not Quite." in gold (#F5C518), on the line below
- Below headline: three rectangular pill-shaped tags arranged vertically, each with a strikethrough line drawn diagonally across the text inside:
  - Pill 1: "Too old" (struck through)
  - Pill 2: "Too inexperienced" (struck through)
  - Pill 3: "Too late" (struck through)
- Pill tags are dark grey rounded rectangles with white text and a single thin red diagonal line crossing through each
- Bottom of frame: soft white subline "Most start with zero clients, no coaching experience, no idea where to start."
- Bottom of frame, centred: a solid gold (#F5C518) rounded pill button with dark navy text reading "Chat on WhatsApp →" plus a small WhatsApp glyph (NOT a quiz CTA — these run as WhatsApp Click-to-Chat ads)

Aspect ratio: 1:1 (1080 × 1080 pixels)
```

### Prompt (9:16)

Same prompt. The pill stack works well vertically.
`Aspect ratio: 9:16 (1080 × 1920 pixels)`

### Background-only fallback

```
Dark navy (#072B4A) background with three rounded dark-grey rectangular pill shapes stacked vertically in the centre of the frame — each pill about 60% of frame width, evenly spaced. Each pill has a single thin red (#EF4444) diagonal line drawn through it. No text, no other elements. Aspect ratio 1:1.
```

Then add headline + pill text + subline in Canva.

---

## Generation strategy — recommended

1. **Open Gemini** (https://gemini.google.com) or Google AI Studio (https://aistudio.google.com)
2. **Generate Ad 1** first (1:1 then 9:16). Inspect the text — if it's clean, you've validated the prompt structure works.
3. **If text is wrong on Ad 1**: switch to the "Background-only fallback" pattern for the remaining ads. Generate just the backgrounds in Gemini, then add headlines + body text in Canva.
4. **Process the rest** the same way. Should take 30-45 min total if Gemini text rendering is clean; 60-90 min if you need to do Canva overlays.

## Naming convention for the output files

Save with these exact filenames so the ad manager can match them to the runbook:

```
ad-assets/
├── ad1-switcher-1080x1080.png
├── ad1-switcher-1080x1920.png
├── ad2-starter-1080x1080.png
├── ad2-starter-1080x1920.png
├── ad3-returner-1080x1080.png
├── ad3-returner-1080x1920.png
├── ad4-rt-stuck-1080x1080.png
├── ad4-rt-stuck-1080x1920.png
├── ad5-rt-toolate-1080x1080.png
└── ad5-rt-toolate-1080x1920.png
```

Once all 10 files exist in `C:\Projects\ptlaunchlab-site\ad-assets\`, you're cleared to hand the bundle (campaign-brief.md + brand-profile.json + ad-assets/ folder + AD-LAUNCH-RUNBOOK.md) to your ad manager.
