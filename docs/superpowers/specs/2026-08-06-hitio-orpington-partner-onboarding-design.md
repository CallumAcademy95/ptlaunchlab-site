# HITIO Gym Orpington — partner onboarding

**Date:** 2026-08-06
**Status:** Approved, not yet implemented
**Partner:** HITIO Gym Orpington · RTRM Fitness Ltd · Director Manisha Nagpal

---

## 1. Context

RTRM Fitness Ltd signed the gym partnership agreement on 2026-08-06. They are
the ninth partner and the first to be a **franchisee** rather than an
independent gym — HITIO Gym is a franchise brand, and RTRM owns the Orpington
site.

Whether the deal extends to other RTRM sites, or to other HITIO franchisees, is
not yet confirmed. Callum is asking. This spec deliberately covers **Orpington
only**, structured so a sister site can be added later without unpicking
anything: the slug names the site, not the brand.

**Partner facts:**

| | |
|---|---|
| Trading name | HITIO Gym Orpington |
| Legal entity | RTRM Fitness Ltd |
| Director / signatory | Manisha Nagpal |
| Contact email | manisha.nagpal@hitiogym.com |
| Address | Nugent Shopping Park, Unit 13A, Cray Ave, Orpington BR5 3RP |
| Website | https://www.hitiogym.com/gym/orpington/ |
| Gym hours | Mon–Thu 05:00–22:00 · Fri 05:00–21:00 · Sat–Sun 05:00–18:00 |
| Staffed hours | Mon–Fri 09:00–19:00 · Sat–Sun 09:00–16:00 |

**Brand**, read from their live theme configuration rather than guessed:

| Token | Value |
|---|---|
| Primary / button | `#e70034` |
| Button hover | `#b9002a` |
| Background | `#1a1a23` |
| Button text | `#ffffff` |
| Logo | `https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png` — 168×46 PNG |

**The logo is a pure-white wordmark.** Every opaque pixel in the asset is
`#ffffff` (2,153 of them, verified by sampling the raw buffer). It is invisible
on any light background. This constrains every asset produced below.

---

## 2. Decisions locked

- **Scope:** Orpington only. Slug `hitio-orpington`, path `/hitio-orpington-academy`.
- **Commission terms:** `instalment_2` — the column default, and correct for a
  v3.0 signing. £500 inclusive of VAT per successfully enrolled learner, held
  until the second instalment clears, subject to clawback. The eight existing
  partners keep `on_enrolment` (grandfathered); nothing about them changes.
- **Pricing:** standing £200 member discount (£1,399 PIF / £599 deposit) **and**
  a launch promo run in two waves (£500 off, then £300 off).
- **Materials:** the full set, matching what the other eight partners have.
- **Login:** issued to manisha.nagpal@hitiogym.com, owner role.

---

## 3. Two findings that shaped this spec

### 3.1 The standing £200 discount has never been redeemed

Every partner carries three Stripe promotion codes: `<GYM>PT` or
`<GYM>PTDISCOUNT` at £200 off, `<GYM>500`, and `<GYM>300`. Redemption counts
across the live Stripe account:

| Code group | Redemptions |
|---|---|
| All eight £200 partner codes (`SUPERFLEXPT`, `XCELERATEPT`, `GYMNGOPT`, `MOFPTDISCOUNT`, `MBGPTDISCOUNT`, `6FITPTDISCOUNT`, `EBORPTDISCOUNT`, `IWGPTDISCOUNT`) | **0** |
| £500 launch codes | 7 |
| £300 launch codes | 3 |

Every partner sale to date came through a launch promo. The evergreen £200 offer
has converted nobody across eight gyms in roughly three months. This is why the
launch promo is treated as a first-class part of HITIO's build rather than an
afterthought.

### 3.2 The advertised price is not the enforced price

`GymConfig.fullPrice` is `1399` on every partner page, but
`PAYMENT_LINK_PRICES` in `app/lib/stripeCheckout.ts` maps the shared partner
link to the **£1,599** price with `allowPromotionCodes: true`. `promoCode`
reaches Stripe as *metadata only* — never as `discounts[0][promotion_code]`.

So the £200 is applied only if the member types the code into Stripe's checkout
page themselves. A member quoted £1,399 on a branded page can pay £1,599. The
zero redemption count in 3.1 is consistent with this happening in practice.

**This is specced as a separate follow-up, not bundled into the HITIO deploy**
(see §9). It touches the money path for all nine partners and deserves its own
change, its own test-mode verification, and its own rollback story. Onboarding a
partner should not be the vehicle for it.

---

## 4. Partner record

One row in `pp_partners`:

```
slug                  hitio-orpington
gym_name              HITIO Gym Orpington
status                active
landing_page_path     /hitio-orpington-academy
promo_code            HITIOPT
commission_terms      instalment_2        (column default — do not override)
contact_name          Manisha Nagpal
contact_email         manisha.nagpal@hitiogym.com
legacy_referral_names ["HITIO Gym Orpington", "HITIO Gym", "HITIO Orpington",
                       "RTRM Fitness", "RTRM Fitness Ltd"]
is_demo               false
```

`legacy_referral_names` is deliberately generous. The enrolment sheet's
`Heard About/gym` column is hand-typed and is the only source of gym attribution
for anything that predates the `gym_slug` metadata — a learner writing "HITIO
Gym" must still join to this partner.

Bank details are left empty. The portal prompts for them and the partner enters
them; first-time entry deliberately sends no notification, whereas any later
change emails every account login and admin as an anti-fraud measure.

---

## 5. Access

Created through `/admin/partners`, which calls `auth.admin.createUser` and sends
the welcome email:

- Email: manisha.nagpal@hitiogym.com
- Role: `owner`
- `must_change_password: true` — forces the password change on first sign-in

This shares `auth.users` with the PT coaching app. That is safe because
`getPartnerSession` returns null for any auth user without a `pp_partner_users`
row.

---

## 6. Academy landing page

Two files, cloned from `app/_gym-template/`:

- `app/hitio-orpington-academy/page.tsx` — `GymConfig` + `GymAcademyPage`
- `app/hitio-orpington-academy/enrol/page.tsx` — partner config + `EnrolmentFlow`

### 6.1 GymConfig

```ts
gymName:      "HITIO Gym Orpington"
logoUrl:      "https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png"
logoAlt:      "HITIO Gym Orpington"
logoWidth:    168      // REQUIRED — wide wordmark
logoHeight:   46       // without both, it is forced into the 52x52 square tile
primaryColor: "#e70034"
darkAccent:   "#ed4b51"
heroBg:       "#1a1a23"
location:     "Orpington, South East London"
promoCode:    "HITIOPT"
discountAmount: 200
fullPrice:    1399
depositPrice: 599
canonicalPath: "/hitio-orpington-academy"
```

`logoWidth` and `logoHeight` must both be set. `GymConfig` switches to the
fixed-height/auto-width treatment only when both are present; omitting either
crushes a 168×46 wordmark into a square tile.

`primaryColor` `#e70034` is their own button colour and carries white text
legibly, consistent with how Xcelerate uses `#D81A3F`. `darkAccent` `#ed4b51`
lifts the hero accent line off the near-black hero.

### 6.2 Copy direction

The positioning leans on what is genuinely distinctive about this gym rather
than generic gym-page filler. Orpington is a **family-run martial arts and
fitness gym** — BJJ, Muay Thai, kickboxing, boxing, Taekwondo, Karate, plus
crosstraining, yoga and Pilates, and children's classes from age 5. A learner
qualifying here trains somewhere with an established coaching culture, which is
a stronger argument than equipment lists.

Stats strip candidates: `5am–10pm` opening, martial arts disciplines on site,
group training studio, 3 hours free parking with EV charging.

Every member-facing word follows the white-label rule in
`partner-playbook/idea-its-your-academy.md`: **it is HITIO's academy.** We are
not named in front of a member. Credibility comes from "nationally recognised,
regulated qualification", not from us. Staff hand off to "the academy team".

### 6.3 Enrol page

Partner config mirroring the Superflex shape:

```ts
gymSlug:     "hitio-orpington"
gymReferral: "HITIO Gym Orpington"
promoCodes: {
  HITIOPT: { label: "HITIO Member Discount", discountAmount: 200,
             fullPrice: 1399, depositPrice: 599,
             fullStripeLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
             depositStripeLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05" },
}
```

Both are the shared partner links already used by all eight existing partners
and mapped in `PAYMENT_LINK_PRICES`. Do not mint new payment links: an unmapped
link falls through `priceForLink` to the raw Payment Link fallback, which skips
the code-controlled `success_url` and drops the buyer on stripe.com without ever
reaching the enrolment form. Eight paying customers were lost that way between
November 2025 and July 2026.

`gymSlug` is the stable join key and must never change once live — every sale
ever attributed to this partner is keyed on it. `gymReferral` is display only.

---

## 7. Stripe promotion codes

Three codes created against the existing coupons, matching the house pattern:

| Code | Discount | Use |
|---|---|---|
| `HITIOPT` | £200 | Standing member discount |
| `HITIO500` | £500 | Launch promo, weeks 1–2 |
| `HITIO300` | £300 | Launch promo, weeks 3–4 |

The launch waves are described in `partner-playbook/campaign-launch-promo.md`,
which is already written and shared with every partner. It insists on a real end
date; the promo graphics produced in §8 must carry one.

---

## 8. Materials

Full set, imported to the private `partner-resources` bucket via
`scripts/import-partner-assets.mts` (idempotent on gym + title), served through
60-second signed URLs.

| Asset | Detail |
|---|---|
| TV slides | 10 × 1920×1080 JPEG via `scripts/gym-tv-slides.mjs`, from a new `gym-brands.json` entry |
| QR posters | Pointing at `/hitio-orpington-academy` |
| Member handout | Learner-facing, white-label |
| Promo graphics | Including **£500-off and £300-off launch variants** |
| Editable PPTX | So they can amend in-house |
| Signed agreement | Filed as their `legal` resource |

**Every asset must place the logo on a dark background**, or carry no logo. The
white wordmark is invisible otherwise. Either design to dark throughout — which
suits their `#1a1a23` brand anyway — or request a colour/dark variant from
Manisha Nagpal. Designing to dark is the default; asking is the fallback if a
light-background asset proves necessary.

`gym-brands.json` entry:

```json
"hitio-orpington": {
  "gymName": "HITIO Gym Orpington",
  "primaryColor": "#e70034",
  "darkAccent": "#ed4b51",
  "heroBg": "#1a1a23",
  "logoUrl": "https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png",
  "promoCode": "HITIOPT",
  "discountAmount": 200,
  "fullPrice": 1399,
  "depositPrice": 599,
  "location": "Orpington, South East London",
  "canonicalPath": "/hitio-orpington-academy"
}
```

The playbook needs no per-partner work — all 48 entries are shared.

---

## 9. Partner logo strip

`app/components/GymPartners.tsx` holds a hand-curated `gymPartners` array that
has drifted from `pp_partners`:

- Lists Leodis 24/7 Gym, 1079 Fitness and Ultimate Shred — none are partners
- Omits Superflex, Xcelerate and Gym n Go — all three are
- Caption reads "6 partner gyms" above 8 logos

Add HITIO and reconcile the roster and the count against `pp_partners`. The
white logo is fine here: the section sits on the dark `bg-base`.

Ultimate Shred is a judgement call — it is Callum's own gym and the NCFE centre,
not a referral partner. Flag rather than silently remove.

---

## 10. Out of scope

| Deferred | Why |
|---|---|
| Stripe auto-applied discount (§3.2) | Touches the money path for all nine partners. Separate change, separate verification. |
| Sister sites / franchise-wide model | Scope unconfirmed. Slug is structured so this costs nothing later. |
| `scripts/onboard-partner.mts` tooling | Approach B, deferred until multi-site scale is confirmed. |
| Re-papering v2.0 signers on v3.0 | Pre-existing open item, unrelated to this partner. |

---

## 11. Verification

The build is done when, checked in a browser and not merely built:

1. `/hitio-orpington-academy` renders with the wordmark at its correct aspect
   ratio, not squashed into a square tile.
2. The page is legible in both the hero and the light sections — specifically,
   the logo is never placed on white.
3. `/hitio-orpington-academy/enrol` reaches Stripe with `gym_slug=hitio-orpington`
   in **both** session metadata and `subscription_data.metadata`, verified on a
   real test-mode checkout. The deposit plan is a subscription; the instalment
   webhook only sees the latter.
4. Signing in as manisha.nagpal@hitiogym.com forces a password change, then
   resolves to the HITIO partner and shows their academy link, QR and promo code.
5. Resources shows the full imported set, and each download resolves through a
   signed URL.
6. The homepage logo strip shows HITIO, and the caption count matches the number
   of logos.

Steps 1, 2 and 6 require actually looking at the pages. A green build has
previously hidden defects of exactly this kind.
