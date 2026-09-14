# Partner promo calendar — 12 months, reusable

**Date:** 2026-09-14
**Status:** design approved, not built
**Scope:** Task 1 of 3. The calendar and its creative/copy system. The October
partner automation is deliberately out of scope — separate spec.

---

## 1. What this is

One 12-month promo calendar, rendered per gym for all 9 live partners (plus the `demo`
tenant for previews), reusable every year. Each month carries an offer, a social set,
a member email and a DM reply script. Defined by **month and week-of-month, never fixed dates**, so Black Friday
and Easter move without a rewrite.

Audience is **the gym's own members and followers** — people already training there.
Not cold local traffic.

Five of the twelve months already exist as playbook campaigns (January, Meet Your
Future Trainer, Coach Spotting, Discovery Evening, Success Story Month). Seven are new.

---

## 2. The evidence that drives the design

Queried against the live Stripe account 2026-09-14 — 59 promotion codes:

| Code type | Discount off £1,599 | Lifetime redemptions |
|---|---|---|
| Standing `…PTDISCOUNT` / `…PT` (9 gyms, all ACTIVE) | £200 (12.5%) | **0** |
| Partner launch `…500` / `…300` | £500 / £300 (31% / 19%) | **9** |

Nine standing codes, live for months, zero uses between them. All nine partner
redemptions came through a £500 or £300 code — consistent with the 9 rows in
`pp_sales`.

This independently confirms the offer research
(`video-research/synthesis/leadgen-offers.md`): Hormozi, first-hand, *"I hate the
idea of a 10 or 20% discount. There's no point"* [40, 12:14] and *"discounts have to
be 50% or higher for a real change in behaviour"* [34, 36:15]. Both resolve the same
way: **don't shave the core offer — peel a component off and give it away at 90-100%.**

That matches the awarding-body constraint exactly. Assessment and certification
cannot be discounted or diluted. Mentorship, consultations, taster sessions and CPD
are unregulated and are PTLL's to give.

**Consequence: the £200 standing discount stops being a promo and becomes the price.**
As an offer it demonstrably does nothing. A month that leads with £200 off is a month
with no offer.

---

## 3. Decisions locked

| Decision | Ruling |
|---|---|
| Shared vs per-gym | **One calendar**, brand-tokenised per gym |
| Promo type | **Mixed** — 4 money months, 8 give-a-component-away months |
| Money months | **January, April, September, Black Friday** |
| Pack contents | Social set + captions + **member email** + WhatsApp line + DM script |
| Career angle | **Gym's own truth only**, organic + email; gated on graphics and Meta copy |

---

## 4. Offer architecture

| Months | Offer | Effective price |
|---|---|---|
| Jan / Apr / Sep | £500 off | £1,099 |
| Nov (Black Friday) | £600 off | **£999** |
| The other eight | One component, free, in full | £1,399 |

November is the only point in the year the price starts with a 9. That is what stops
the other three money months cannibalising it, and Black Friday is the one month a
price moving costs no brand damage — which matters because the brand voice bans
scarcity language (`reference_ptll_brand_system`: urgency is "Priority Intake
Incentive", never "LIMITED SLOTS").

### Pricing mechanics — three hard constraints

1. **Codes do not stack.** Stripe accepts one `discounts[0][promotion_code]`
   (`stripeCheckout.ts:409`). A monthly code **replaces** the standing £200. £1,099
   is the real price, not £1,399 minus £500.
2. **Money months are pay-in-full only.** `stripeCheckout.ts` blocks discounts on the
   £599 deposit path by design, keyed off `config.allowPromotionCodes`. Every
   money-month asset must say so.
3. **Applying a discount forces `allow_promotion_codes: false`** — Stripe rejects a
   session carrying both. The second code box is structurally impossible, which is
   correct and must not be "fixed".

### Peel-off components, and who delivers

| Component | Delivered by | Months |
|---|---|---|
| 1:1 career consultation (30 min) | PTLL | Feb, May |
| Taster session with a working coach | Gym | Mar |
| Extra mentorship block on enrolment | PTLL | Jul, Aug |
| Live Q&A | PTLL | Jun |

**Default is PTLL-delivered.** Five of nine partners have never signed into the portal
(`must_change_password` still true: 6fit, gym-n-go, ironwolf, mof, muscle-bound), so
any month that depends on partner action is a month that will not run at those five.
Gym-delivered components are an optional upgrade, never the mechanism.

---

## 5. The spine — one belief retired per month

From the need-to-believes framework [34, 16:47]: count what someone must believe
before buying, then retire them one at a time rather than shouting the same thing
twelve times.

- **B1** — someone like me can actually do this
- **B2** — it is a real, recognised qualification
- **B3** — I can fit it around my job
- **B4** — there is actually work at the end

NCFE accreditation collapses B2 for free and is currently underused. B4 is the
constrained one (see §7).

| Month | Campaign | Belief | Offer |
|---|---|---|---|
| **Jan** | New Year, New Career *(exists)* | B1 | **£500 off → £1,099** |
| Feb | You're Already Here | B3 | Free 1:1 career consultation |
| Mar | Meet Your Future Trainer *(exists)* | B4 | Free taster session with a working coach |
| **Apr** | Six Months From Now | B1 | **£500 off → £1,099** |
| May | Coach Spotting *(exists)* | B1 | Staff nominate → free consultation |
| Jun | Ask Us Anything | B2 | **No offer, deliberately** |
| Jul | Discovery Evening *(exists)* | B3 | Attend → extra mentorship block on enrolment |
| Aug | Train Together | B1 | Pair enrolment → extra mentorship each |
| **Sep** | Autumn Intake | B4 | **£500 off → £1,099** |
| Oct | Success Story Month *(exists)* | B2 | Proof — automations begin |
| **Nov** | Black Friday | all | **£600 off → £999** |
| Dec | Decide Before January | B3 | January place held on deposit |

June carries no offer on purpose. A year that asks every single month stops being
believed.

---

## 6. The copy system

Four rules, applied to every month's assets.

**Insight → Method → Solution, never solution-first.** Priestley: *"Salespeople who
fail jump straight to the solution."* Every caption opens on an insight unrelated to
selling. PTLL's natural insight is in its own podcast: **the qualification is the
commodity** — every provider awards the same NCFE; what separates people is what
happens after.

**The damaging admission** [34, 38:07] — *bad, bad, bad, **but** good*. Unsociable
hours, not everyone finishes, the theory is free online. Saying it first is what makes
the rest believable, and it is the only honest way to sell a course where not everyone
graduates.

**Three baskets in the DM script** — present situation, the prize, the problem —
before recommending anything. This is what converts "message us" into a conversation.
Without a reply script gym staff freeze on the first DM and the post is wasted. Every
month ships one.

**Emails ask for a reply, not a click.** PTLL's own record is roughly 10,000 sends and
one click (`project_ptll_email_zero_clicks`), and Apple MPP has made opens meaningless
since 2021 — both deliverability sources agree (`synthesis/email-marketing.md`). A
reply is both the intent signal and the start of the conversation, and these send from
the gym's warm list to people who know the sender.

### Banned, unchanged

No income claims. No session rates. No "it pays for itself". No scarcity language. No
emoji-hype. **Member-facing copy never names PT Launch Lab** — it is the gym's academy
("our next intake", "the academy team"). The white-label rule is absolute.

---

## 7. The career angle

`scripts/lib/ad-guards.mjs` blocks `\b(interview|guarantee|hir|recruit|job|vacanc)\w*\b`
from graphics and fenced copy blocks. Two reasons, both still valid:

- Agreement v3.0 Clause 2.2 makes the gym *"solely as a distribution and referral
  partner"*. The word *interview* appears nowhere in the agreement.
- Job framing trips **Meta's Employment Special Ad Category** — 15 km minimum radius,
  no interest targeting, no lookalikes — which would defeat the local targeting the
  packs exist for.

**Ruling: the gym may state what is true about its own gym**, in its own voice, in
organic captions and member emails — e.g. "three of our floor team qualified here".
That is the gym's own employment claim about its own business, not a PTLL guarantee.

- Graphics: stays gated. No change.
- Meta ad copy blocks: stays gated. No change.
- Organic captions + member email: carve-out, **implemented in `ad-guards.mjs`**, not
  left as a convention.
- Each gym must confirm in writing what it can honestly claim. A gym that confirms
  nothing gets the B4 months without the claim.

**Existing false material must be pulled.** Superflex's live handout promises *"at
least one guaranteed interview with a partner gym"*; the gym-n-go/xcelerate poster
carries *"GUARANTEED GYM INTERVIEW ON QUALIFICATION"*. Neither is contracted. HITIO's
assets were cleaned in August; the others were not.

---

## 8. Production

Rides the existing pipeline. No new architecture.

| Piece | Where |
|---|---|
| 12 months as data | `scripts/lib/promo-calendar.mjs` — same copy-as-data pattern as `ad-concepts.mjs` |
| 216 graphics | extend `scripts/gym-ad-creatives.mjs` — 9 partners × 12 months × (1080×1080 + 1080×1920) |
| 12 campaign entries | `partner-playbook/campaign-*.md` — 5 rewritten, 7 new |
| Upload | `scripts/upload-gym-ad-packs.mts`, `pack` = playbook slug so graphics render inside the month's entry |

Copy is **12 sets brand-tokenised per gym**, not 120 hand-written. Town, colours,
logo, promo code and the gym's own career line substitute in.

**Per month, per gym:** feed graphic · story graphic · caption · 3 hook variants ·
story-poll wording · member email · WhatsApp/SMS line · DM reply script.

### Two traps in the existing scripts

- **A re-render does not reach partners without `--replace`.** The skip fires before
  the storage PUT, so a plain re-run prints "skipped" and changes nothing.
- Every script needs `node --use-system-ca`.

### Stripe codes

36 new codes — 4 money months × 9 live partners. The `demo` tenant gets no Stripe
codes. Prefix-scoped validation means they work
without a deploy, **but the prefix must match**: Iron Wolf is `IWG` + `IRONWOLF`,
Muscle Bound is `MBG` + `MUSCLEBOUND` (`app/lib/partnerPromo.ts`). A code minted under
the wrong prefix is refused for that gym.

Naming: `<PREFIX>JAN500`, `<PREFIX>APR500`, `<PREFIX>SEP500`, `<PREFIX>BF600`.
Year-agnostic so the calendar is reusable.

---

## 9. Prerequisite fixes

The calendar is wrong without these.

1. **Ebor's page.** `app/lib/gyms/ebor-fitness.ts` has `fullPrice: 1599` and no
   `promoCode`, while `EBORPTDISCOUNT` is ACTIVE in Stripe and `partnerPromo.ts` maps
   Ebor to it. The page advertises £1,599; checkout would charge £1,399. Fix the page
   to £1,399 + `promoCode`.
2. **`gym-brands.json` is stale** — it shows Ebor `promoCode: null` and is the TV-slide
   renderer's config, not the page config. Do not treat it as the source of truth for
   pricing; `app/lib/gyms/*.ts` and Stripe are.
3. **The claim-gate carve-out** in `ad-guards.mjs` (§7).
4. **Pull the false interview material** from Superflex, gym-n-go and xcelerate (§7).

---

## 10. Out of scope

- **The October partner automation.** Separate spec. One note that constrains it: five
  of nine partners have never signed in, so an email whose only CTA is "open your
  Resource Drive" fails for over half of them. Assets and copy go **in** the email;
  the portal is the upgrade path.
- Meta ad delivery, budgets, or partners' own ad accounts. PTLL is a creative supplier
  only; partners run ads with their own money from their own accounts.
- Publishing completion/outcome data. Correct sequence is fix → measure → publish, and
  the completion problems are not fixed.

---

## 11. Open risks

- **Four money months a year on a regulated qualification is still perpetual
  discounting** at a 3-month cadence. The £999 November is the release valve; if
  Jan/Apr/Sep underperform, cut April first.
- **No attribution on the peel-off months.** The ad packs already ship with no per-gym
  UTM, so an enrolment surfaces only as a promo-code redemption weeks later. The
  monthly codes fix this for the four money months and leave the other eight
  unattributed.
- **`SUMMER500PTLL` is still ACTIVE** and uncapped — a live £500 code outside the
  calendar that undercuts every peel-off month.
- **Consent for recognisable people** in gym photos is still unconfirmed across all
  partners.
- Agreement v3.0 has never been legally reviewed.
