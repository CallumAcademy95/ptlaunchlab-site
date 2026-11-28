# Call prep video: script for Callum

For the confirmation page people see straight after booking a course call
(`app/book/CallPrep.tsx`). Read to camera, phone held upright or landscape, somewhere
quiet. Aim for 75 to 90 seconds. Don't worry about reading it word for word if a
line comes out more naturally in your own words, but keep the price and the two
answers exactly as they are.

They have already booked, so there's no hook and no selling: just "you're booked,
here's what happens".

## The script (about 210 words, roughly 80 to 90 seconds)

**1. You're booked**

> Hiya, it's Callum from PT Launch Lab. You've booked a call with me, so thank you.
> Your time is on this page, and I'll ring you from 07822 012186. Save that number
> now, so you know it's me when it rings.

**2. Who it suits, and who it doesn't**

> Quick bit of honesty. This suits you if you want to become a personal trainer and
> you can put a few hours a week into studying online. It's not for you if you're
> after a weekend course, or a certificate you don't have to work for.

**3. What the call is**

> The call takes about fifteen, twenty minutes. We'll go through your goals and your
> Career Planner answers. I'll walk you through the Level 2 and 3 and how long it
> takes. And I'll tell you the price straight: nine hundred and ninety-nine pounds
> ninety-nine in full, or ninety-nine pounds ninety-nine a month for ten months.
> There's no pressure to decide on the call. If it's not right for you, I'll tell you.

**4. Two worries, answered**

> Two things people ask me a lot. Can I fit it around a full-time job? Yes. It's
> online, you go at your own pace, and most people finish in eight to sixteen weeks
> doing it around work. And is it recognised? It's an NCFE qualification, regulated
> by Ofqual. A proper qualification, not a certificate someone's made up.

**[OPTIONAL: one real learner, only if they've agreed to be named. Otherwise skip it.]**

> [Name] did hers/his around [their real situation, e.g. a new baby / shift work],
> and qualified with us. [Nothing about earnings or jobs.]

(An existing real review on the site that fits this: Rebecca Davies, on the
book-call page, who did hers after having her baby. Check she's happy to be
mentioned by name on video first.)

**5. How to prepare**

> Before we speak, jot down your questions, and be somewhere quiet with decent
> signal. If the time doesn't work any more, move it from this page, or just
> message us on WhatsApp.

**6. See you then**

> That's it. Speak to you soon.

## Rules this script keeps to

- Never "free", never "consultation": it's "a call with me".
- Price stated plainly. Nothing about how payments are taken.
- No income or job promises, no scarcity, no deadlines, no timers.
- "8 to 16 weeks" and "NCFE, regulated by Ofqual" are the site's own published
  claims (`/courses`).

## Putting it live

1. Upload to YouTube as **Unlisted** (or to any https host as an .mp4).
2. In Vercel, set `NEXT_PUBLIC_CALL_PREP_VIDEO_URL` to the link (any YouTube link
   shape works: watch, youtu.be, shorts) and redeploy. Unset = no video block.
   Only YouTube or an https .mp4/.webm/.mov file will show: the site's security
   policy blocks other video hosts, and anything else is ignored rather than shown
   broken.

## Next: 3 to 4 breakout FAQ videos (drafted, not built)

From inbound WhatsApp, Instagram and Messenger messages in `lead_messages`
(443 inbound with text, read-only, keyword themes, counts are rough). Each 30 to 90
seconds, one question each:

1. **"What does it cost, and is there a monthly option?"** (price: 34 messages;
   monthly/plan: 18). £999.99 in full or £99.99 a month for 10 months, and what's
   included for that. No word on how payments are taken.
2. **"Can I do it around a full-time job, and how long does it take?"** (time
   around a job: 21; how long: 19; start dates: 18). Weekly hours, 8 to 16 weeks,
   starting whenever you like.
3. **"How do the practical assessments work, and where?"** (practical /
   assessment / location: 15; how the online course works: 18).
4. **"Is it recognised, and what happens with gyms after I qualify?"** (recognised
   / NCFE: 23; jobs and gyms: 47, the biggest theme). Ofqual-regulated NCFE, and
   exactly what the gym introduction is. No job or income promises.
