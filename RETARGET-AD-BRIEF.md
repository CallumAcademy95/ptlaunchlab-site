# Retarget Ad — "Why PT Launch Lab" / Career Blueprint

**Status:** Brief captured 2026-07-03 (Callum's notes). NOT built yet.
Sits after the cold **Career Planner** ad ([PTLL-ADS-PORTFOLIO.md](PTLL-ADS-PORTFOLIO.md)) in the funnel: cold calculator ad → `/career-planner` → email captured → **this retarget ad** confirms & de-risks → sales page → enrol / book call.

> ⚠️ **FINANCE IS SCRAPPED (Callum, 2026-07-03).** These notes were written before that call and mention "Finance Available", a finance calculator embed, and a "How finance works" email. **Only two payment options now exist: pay in full (£1,599) or the deposit plan (£599 + 5 × £200).** Everywhere below that says "finance", read **"payment options"**. No Payl8er / Klarna / Stripe 0% / third-party lending anywhere.

---

## The core idea
They're **no longer cold** — they used the calculator and gave their email. Stop educating, **start confirming**. Their open questions are **identity & risk**, not curriculum:
> Can I actually do this? · Is it realistic? · Are these people different? · Can I afford it? · Will I get clients? · Will I fail? · Why them?

**The one message:** *We don't sell qualifications. We build successful fitness careers.*

## Campaign setup
- **Objective:** Purchase (if volume) or **Book a Call** (while enrolments are low-volume).
- **Audiences (warm):** Career Calculator completed · 75% calculator completion · calculator results viewed · email subscribers · live attendees · salary-calculator users · career pages viewed.
- **Exclude:** purchasers · current students.

## The ad
**Hook (confirm, don't teach):**
- "You already know becoming a PT could change your life. The question now is — who should you trust to get you there?"
- alt: "The qualification is the easy part. Building a successful PT business is what matters."

**Agitate:** Most providers stop at the qualification (anatomy, assessment, programming) then send you into the industry to figure out the business side alone — which is exactly why most new PTs never make it.

**Different:** PT Launch Lab helps you qualify **and** become employable — build confidence, get clients, start earning, build a career.

**Proof:** 500+ graduates · hiring partners · business mentorship · community · live coaching · case studies.

**CTA:** Explore the course.

**Creative:** documentary-style, NOT stock. Transformation sequence: old job → gym → studying → practical assessment → community → mentoring → graduate with clients → income notification → lifestyle. Show the transformation, not the classroom.

---

## Landing page — "Career Blueprint" (where the effort goes)
Not the traditional course page. A **sales page** positioned as a Career Blueprint (the qualification is one chapter).

**Recommended structure:**
1. **The Opportunity** — why now is a great time to build a fitness career.
2. **The Problem** — most newly-qualified PTs leave with a certificate but no plan.
3. **The PT Launch Lab Method** — qualification + business skills + mentorship + community.
4. **The Roadmap** — visual journey "thinking about a career change" → "earning as a PT".
5. **Proof** — success stories matched to the visitor's avatar.
6. **Investment & Payment** — transparent pricing, the two payment options, expected ROI. *(NOT "finance".)*
7. **Next Step** — apply / book a call / enrol.

**Page sections (from notes):**
- **Hero:** "Become A Qualified Personal Trainer… And Build A Career That Lasts." — not just a certificate, a complete roadmap. CTA: View Payment Options · Book Call.
- **Social proof strip:** ★★★★★ · 500+ students · hiring partners · ~~Finance Available~~ **flexible payment plans** · NCFE Approved.
- **Who this is for** (icons): career changer · gym enthusiast · returning parent · already in fitness.
- **What makes us different** — a **comparison table**, not a feature list:

  | Most Providers | PT Launch Lab |
  |---|---|
  | Qualification only | Qualification + business mentoring |
  | Finish and leave | Ongoing community |
  | Generic support | Live coaching |
  | Learn theory | Build your career |

- **Everything included** (stacked visually): qualification · business mentoring · community · live coaching · career support · **payment options** · templates · networking · hiring partners · student app.
- **Graduate journey** timeline: join → study → qualify → business mentoring → first client → career.
- **Graduate stories** — three only (career changer / young PT / parent), **video first**.
- **What's inside** — real screenshots: portal · app · lessons · assessments · support · community.
- **Payment** *(was "Finance")* — instead of "finance available", show the **weekly cost** vs coffee / gym membership / streaming, then average PT income → frame as an investment. Two plans only: pay in full £1,599, or £599 deposit + 5 × £200.
- **FAQ** — answer **objections**, not curriculum: Can I do this while working? · How long? · No gym experience? · Too old? · Will you help me get clients? · Will employers recognise it? · Payment options?
- **Final CTA:** "Ready to build your fitness career?" (not "Buy now").

---

## Post-click email sequence (if they don't buy)
Day 1: Why PT Launch Lab exists · Day 2: Graduate story · Day 4: Business mentoring · Day 6: Inside the course · Day 8: **Payment options** *(was "How finance works")* · Day 10: Book a call.

> Note: overlaps with the **career_planner nurture track** already built (4 emails @ 0/4/5/6 days, see ads growth-OS memory). Decide whether this retarget sequence replaces/extends it or runs for a different audience (e.g. non-calculator warm visitors).

---

## Assets required
- **Engineering:** Career Blueprint landing page · dynamic testimonials · comparison table · video hosting · FAQ accordion · ROI calculator embed · CRM events.
- **Design:** graduate graphics · comparison graphics · timeline · icons · mobile layouts.
- **Video:** founder story · graduate stories · course walkthrough · community walkthrough · mentor clips · assessment footage · lifestyle footage.
- **Photography:** students · tutors · gyms · community · behind the scenes.
- **Copy:** sales page · ads · emails · FAQs · meta descriptions · schema.

---

## Reconciliation with what already exists (so we don't rebuild)
- **Audiences:** "Career Planner (engaged 180d)" `52550446045718` already built; email-list custom audience `52549805886118`; live-registration audience exists; buyers-exclusion `52549805883518`. Need to add: 75%/results-viewed calculator events, salary-calculator users, career-pages-viewed (custom audiences off existing pixel events).
- **Proof:** graduates DB + `<ProofStrip>` + `/graduates` already built (Proof Engine) — feeds the avatar-matched "Proof" section directly.
- **Nurture:** career_planner track live — reuse/extend rather than build fresh.
- **Salary calculator** + **quiz** + **/live** already capture the warm pool this ad retargets.
- **Net-new (the real work):** the Career Blueprint sales page + documentary video/photography + the retarget creative + the comparison-table/ROI components.

## Suggested sequence
1. Build the **Career Blueprint landing page** (the destination — nothing else works without it).
2. Stand up the **retarget audiences** in Meta (custom audiences off existing pixel events).
3. Produce **creative** (documentary video is the long pole — static can bridge in the meantime).
4. Wire the **retarget campaign** (paused draft, same pattern as the Career Planner ad).
5. Decide nurture: extend career_planner track vs a dedicated retarget sequence.
