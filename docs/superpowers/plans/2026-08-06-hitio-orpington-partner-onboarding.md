# HITIO Gym Orpington Partner Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring HITIO Gym Orpington live as the ninth gym partner — portal access, a branded academy landing page, Stripe discount codes, and the full materials set.

**Architecture:** Additive throughout. A new `pp_partners` row, two new page files cloned from `app/_gym-template/`, three new Stripe promotion codes, one new `gym-brands.json` entry, and generated assets uploaded to the existing private `partner-resources` bucket. No schema changes, no migrations, and no changes to the shared checkout path — the eight existing partners are untouched by every task here.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgREST + Storage + Auth), Stripe REST API, Playwright, `tsx` for scripts, `sharp` + headless Chrome for image rendering.

**Spec:** `docs/superpowers/specs/2026-08-06-hitio-orpington-partner-onboarding-design.md`

## Global Constraints

Every task's requirements implicitly include these.

- **NO LIVE WRITES. This is absolute.** Implementers write code and run
  **dry-runs only**. Never run a command with `--apply`. Never create,
  update or delete a row in Supabase, a coupon or promotion code in Stripe,
  an object in Storage, or an auth user. Never create a partner login and
  never send an email. Every such step below is marked **[GATED]**: prepare
  it, run the dry-run, paste the output into your report, and stop there.
  Callum approves each write himself. HITIO signed today and Manisha Nagpal
  is a real person at a real company — a mistake that reaches them is not
  recoverable by editing a file. `npm run test:e2e` is exempt and safe: its
  harness forces the Stripe **test** key, blanks `RESEND_API_KEY` so no mail
  can send, and blanks the Zapier sheet hook.

- **White-label rule.** Member-facing copy never names PT Launch Lab. It is HITIO's academy. Staff hand off to "the academy team". Credibility comes from "nationally recognised, regulated qualification", never from our name. Read `partner-playbook/idea-its-your-academy.md` before writing any partner-facing copy. The audit script enforces this on playbook files (`scripts/audit-partner-platform.mts:170`).
- **`gymSlug` is immutable once live.** It is `hitio-orpington` everywhere. Every sale ever attributed to this partner joins on it. `gymReferral` ("HITIO Gym Orpington") is display-only and is NOT safe to join on.
- **Never mint new Stripe payment links.** Use the two shared links below. An unmapped link falls through `priceForLink()` to the raw Payment Link fallback, skipping the code-controlled `success_url` and dropping the buyer on stripe.com without ever reaching the enrolment form. That cost eight paying customers between Nov 2025 and Jul 2026.
  - PIF: `https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f`
  - Deposit: `https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05`
- **The HITIO logo is a pure-white wordmark**, 168×46, every opaque pixel `#ffffff`. It is invisible on light backgrounds. Every asset places it on dark or carries no logo.
- **`logoWidth: 168` and `logoHeight: 46` must BOTH be set** in `GymConfig`. The fixed-height/auto-width treatment activates only when both are present; omitting either forces the wordmark into a 52×52 square tile.
- **`commission_terms` must stay at the column default `instalment_2`.** Do not pass it explicitly and do not copy `on_enrolment` from an existing partner — that is the grandfathered v1.0 deal.
- **Brand tokens:** primary `#e70034`, hover/dark `#b9002a`, accent `#ed4b51`, background `#1a1a23`, logo/button text `#ffffff`.
- **Scripts load env from `.env.local`** with the inline parser used by every script in `scripts/`. Node needs `--use-system-ca` on this machine or TLS fails.
- **Baseline:** `npx tsx scripts/audit-partner-platform.mts` currently reports **PASS — 0 failures, 3 warnings**. It must never report more failures than 0, and warnings must not increase beyond the one expected new warning noted in Task 1.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `scripts/onboard-hitio.mts` | Create (Create) — one-off, idempotent, dry-run-by-default seeding of the partner row and the three Stripe promotion codes | 1, 2 |
| `app/hitio-orpington-academy/page.tsx` | Create — `GymConfig` + `GymAcademyPage` | 3 |
| `app/hitio-orpington-academy/enrol/page.tsx` | Create — `PartnerConfig` + `EnrolmentFlow` | 3 |
| `e2e/hitio-attribution.spec.ts` | Create — asserts the checkout session carries `gym_slug` in both metadata locations | 4 |
| `scripts/gym-brands.json` | Modify — add the `hitio-orpington` entry | 5 |
| `Partner Assets/hitio-orpington/` | Create — generated posters, handout, promo graphics, signed agreement | 6 |
| `app/components/GymPartners.tsx` | Modify (`:5-14`, `:41-44`) — add HITIO, reconcile roster and count | 7 |

---

### Task 1: Partner record

Creates the `pp_partners` row. Ordered first so that the academy page in Task 3 resolves to a partner the moment it exists.

**Files:**
- Create: `scripts/onboard-hitio.mts`

**Interfaces:**
- Consumes: nothing.
- Produces: a `pp_partners` row with `slug = "hitio-orpington"`. Task 3's pages join to it via `gymSlug`. Task 5's `gym-brands.json` entry must use the same slug. Task 7's login attaches to its `id`.

- [ ] **Step 1: Run the audit to capture the pre-state**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/audit-partner-platform.mts`

Expected: `PASS — 0 failures, 3 warning(s)`, and no `hitio-orpington` anywhere in the output. Record the exact warning count; Task 1 adds exactly one (`hitio-orpington: no login yet`, cleared in Task 8) plus one for missing bank details, which is correct and expected until the partner enters them.

- [ ] **Step 2: Write the onboarding script**

Create `scripts/onboard-hitio.mts`:

```ts
/**
 * One-off onboarding for HITIO Gym Orpington (RTRM Fitness Ltd).
 *
 *   npx tsx scripts/onboard-hitio.mts            # dry run — shows the plan
 *   npx tsx scripts/onboard-hitio.mts --apply    # write it
 *
 * Idempotent on slug and on promotion code: re-running updates the partner row
 * in place and skips any Stripe code that already exists. Safe to run twice.
 *
 * Deliberately NOT generalised into a reusable onboard-partner tool. HITIO is
 * the first franchisee rather than an independent gym, and whether the deal
 * extends to sister sites is unconfirmed — building for a scale nobody has
 * confirmed is how you get tooling that fits no real case. Generalise when the
 * second site actually lands.
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");

const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SK = process.env.STRIPE_SECRET_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const SLUG = "hitio-orpington";

// commission_terms is deliberately absent: the column defaults to
// instalment_2, which is the v3.0 deal HITIO signed on 2026-08-06. Passing it
// explicitly invites a later copy-paste of on_enrolment, which is the
// grandfathered v1.0 deal belonging to the original eight partners.
const PARTNER = {
  slug: SLUG,
  gym_name: "HITIO Gym Orpington",
  status: "active",
  landing_page_path: "/hitio-orpington-academy",
  promo_code: "HITIOPT",
  contact_name: "Manisha Nagpal",
  contact_email: "manisha.nagpal@hitiogym.com",
  // Generous on purpose. The enrolment sheet's "Heard About/gym" column is
  // hand-typed and is the only source of gym attribution for anything
  // predating the gym_slug metadata. A learner writing "HITIO Gym" must still
  // join to this partner.
  legacy_referral_names: [
    "HITIO Gym Orpington",
    "HITIO Gym",
    "HITIO Orpington",
    "HITIO",
    "RTRM Fitness",
    "RTRM Fitness Ltd",
  ],
  is_demo: false,
};

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const [existing] = await api(`pp_partners?slug=eq.${SLUG}&select=id,gym_name,commission_terms`);

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${PARTNER.gym_name} (/${SLUG})\n`);
console.log(existing ? `  partner row EXISTS (${existing.id}) — will update in place` : "  partner row will be CREATED");
console.log(`  landing page   ${PARTNER.landing_page_path}`);
console.log(`  promo code     ${PARTNER.promo_code}`);
console.log(`  contact        ${PARTNER.contact_name} <${PARTNER.contact_email}>`);
console.log(`  referral names ${PARTNER.legacy_referral_names.length}`);

if (!APPLY) {
  console.log("\nNothing written. Add --apply.");
  process.exit(0);
}

const [partner] = existing
  ? await api(`pp_partners?slug=eq.${SLUG}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(PARTNER),
    })
  : await api("pp_partners", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(PARTNER),
    });

console.log(`\npartner ${existing ? "updated" : "created"}: ${partner.id}`);
console.log(`commission_terms: ${partner.commission_terms}`);

if (partner.commission_terms !== "instalment_2") {
  console.error(
    `\n  WRONG TERMS: expected instalment_2 (the v3.0 deal signed 2026-08-06), got "${partner.commission_terms}".` +
      `\n  on_enrolment is the grandfathered v1.0 deal and belongs only to the original eight partners.`,
  );
  process.exit(1);
}
```

- [ ] **Step 3: Dry-run it**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/onboard-hitio.mts`

Expected: prints `DRY RUN — HITIO Gym Orpington (/hitio-orpington)`, says the partner row will be CREATED, and writes nothing. Confirm with a re-run of the audit that `hitio-orpington` still does not appear.

- [ ] **Step 4: [GATED] STOP — do not apply**

**Do not run `--apply`.** Callum runs it himself after reviewing your dry-run.

Paste the full dry-run output into your report, and state what you expect
`--apply` to produce: `partner created: <uuid>` followed by
`commission_terms: instalment_2`. Note in the report that if it ever prints
`WRONG TERMS` and exits 1, the column default has changed and that needs
understanding before going further — the guard exists precisely so this cannot
pass silently.

The idempotence path (re-running updates in place rather than creating a second
row) is likewise a claim for your report, not something to demonstrate against
production.

- [ ] **Step 5: Verify the script reads the live state correctly**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/audit-partner-platform.mts`

This is read-only and safe. Expected: unchanged from Step 1 — `0 failures`, and
still no `hitio-orpington`, because nothing has been written. Confirming the
audit is unchanged is how you prove the dry run wrote nothing.

State in your report that after Callum applies, the audit should show `0
failures` with exactly two new warnings, both correct and both cleared later:
- `hitio-orpington: no bank details` (the partner enters these themselves)
- `hitio-orpington: no login yet` (cleared in Task 7)

- [ ] **Step 6: Commit**

```bash
git add scripts/onboard-hitio.mts
git commit -m "Add HITIO Gym Orpington as the ninth gym partner

RTRM Fitness Ltd signed on 2026-08-06. First franchisee rather than an
independent gym, so the slug names the site and not the brand — a sister site
can be added later without unpicking the attribution.

commission_terms is left to the column default (instalment_2, the v3.0 deal)
rather than passed explicitly, and the script fails loudly if it comes back as
anything else. on_enrolment is the grandfathered v1.0 deal and belongs only to
the original eight."
```

---

### Task 2: Stripe promotion codes

Three codes matching the house pattern. The launch codes matter more than the standing one: across the eight existing partners the £200 codes have zero redemptions between them, while the £500/£300 launch codes account for every partner sale to date.

**Files:**
- Modify: `scripts/onboard-hitio.mts`

**Interfaces:**
- Consumes: `SK` (`STRIPE_SECRET_KEY`) already read in Task 1.
- Produces: active promotion codes `HITIOPT`, `HITIO500`, `HITIO300`. Task 3's `PartnerConfig` names `HITIOPT`. Task 6's launch graphics quote £500 and £300.

- [ ] **Step 1: Confirm the coupons still exist and are valid**

The three gym-partner coupons were resolved while writing this plan. Confirm they are unchanged before using them:

```bash
node --use-system-ca -e "
const fs=require('fs');
for(const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)\$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^[\"']|[\"']\$/g,'');}
const H={Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY};
for(const id of ['buPzSnaF','vgLNHktz','CDD4796b'])
  fetch('https://api.stripe.com/v1/coupons/'+id,{headers:H}).then(r=>r.json())
    .then(c=>console.log(id, c.error?('ERROR '+c.error.message):('£'+c.amount_off/100+' '+c.name+' '+(c.valid?'valid':'INVALID'))));"
```

Expected exactly:

| Coupon id | Amount | Name |
|---|---|---|
| `buPzSnaF` | £200 | Gym Partner Discount |
| `vgLNHktz` | £500 | GYM PARTNER SHIP START CODES 500 |
| `CDD4796b` | £300 | GYM PARTNER SHIP START CODE 300 |

All three must report `valid`. Reuse these — do not create new coupons. Duplicates make the Stripe dashboard unreadable and make per-partner redemption reporting impossible to total. Note there are also **invalid** £300/£500 coupons (`FgD7dtW0`, `KregaIBK`) from a May campaign; do not use those.

- [ ] **Step 2: Append the promotion-code block to the script**

Add to the end of `scripts/onboard-hitio.mts`:

```ts
// ─── Stripe promotion codes ──────────────────────────────────────────────────
// Three codes, matching the pattern every other partner has: a standing member
// discount plus the two launch waves described in
// partner-playbook/campaign-launch-promo.md (£500 for weeks 1-2, £300 for
// weeks 3-4).
//
// Worth knowing while running this: across the eight existing partners the
// £200 standing codes have ZERO redemptions between them, while the £500/£300
// launch codes account for every partner sale made to date. The launch promo
// is the one that actually converts.
const CODES = [
  { code: "HITIOPT",  coupon: "buPzSnaF", note: "standing member discount (£200)" },
  { code: "HITIO500", coupon: "vgLNHktz", note: "launch promo, weeks 1-2 (£500)" },
  { code: "HITIO300", coupon: "CDD4796b", note: "launch promo, weeks 3-4 (£300)" },
];

const stripe = async (path: string, body?: Record<string, string>) => {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${SK}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body ? { body: new URLSearchParams(body).toString() } : {}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`stripe ${path}: ${j.error?.message}`);
  return j;
};

console.log("\nStripe promotion codes:");
for (const c of CODES) {
  const found = await stripe(`promotion_codes?code=${encodeURIComponent(c.code)}&limit=1`);
  if (found.data?.length) {
    console.log(`  ${c.code.padEnd(10)} already exists (${found.data[0].active ? "active" : "INACTIVE"}) — skipped`);
    continue;
  }
  const made = await stripe("promotion_codes", { coupon: c.coupon, code: c.code });
  console.log(`  ${c.code.padEnd(10)} created — ${c.note} (${made.id})`);
}
```

- [ ] **Step 3: [GATED] STOP — do not apply**

**Do not run `--apply`.** Creating promotion codes mutates the live Stripe
account. Callum runs it.

Run the dry run instead and paste its output into your report:
`NODE_OPTIONS=--use-system-ca npx tsx scripts/onboard-hitio.mts`

State in your report that `--apply` should produce three `created` lines, and
that a re-run should report all three as `already exists (active) — skipped`.

- [ ] **Step 4: Confirm the three codes do NOT already exist**

Run:

```bash
node --use-system-ca -e "
const fs=require('fs');
for(const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)\$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^[\"']|[\"']\$/g,'');}
const H={Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY};
fetch('https://api.stripe.com/v1/promotion_codes?limit=100',{headers:H}).then(r=>r.json()).then(j=>{
  for(const c of j.data) if(c.code.startsWith('HITIO'))
    console.log(c.code, c.active?'ACTIVE':'off', '£'+(c.coupon.amount_off/100)+' off');
});"
```

Expected **now, before any apply**: no output at all. A `HITIO*` code already
existing would mean someone created it by hand — report that rather than
proceeding, because the script would then skip it and the coupon behind it is
unverified.

After Callum applies, the same command should print exactly three lines:
`HITIOPT ACTIVE £200 off`, `HITIO500 ACTIVE £500 off`, `HITIO300 ACTIVE £300 off`.
Put that expectation in your report.

- [ ] **Step 5: Commit**

```bash
git add scripts/onboard-hitio.mts
git commit -m "Create HITIO's three Stripe promotion codes

HITIOPT at £200 standing, HITIO500 and HITIO300 for the two launch waves the
playbook describes. Reuses the existing coupons rather than minting new ones so
redemptions stay totalable per partner, and skips any code that already exists
so the script stays safe to re-run."
```

---

### Task 3: Academy landing page and enrol page

**Files:**
- Create: `app/hitio-orpington-academy/page.tsx`
- Create: `app/hitio-orpington-academy/enrol/page.tsx`
- Reference: `app/_gym-template/page.tsx`, `app/superflex-academy/enrol/page.tsx`

**Interfaces:**
- Consumes: the `pp_partners` row from Task 1 (joined on `gymSlug`), `HITIOPT` from Task 2, `GymConfig` from `app/lib/gymPartnerConfig.ts`, `PartnerConfig` from `app/enrol/shared.tsx`.
- Produces: the route `/hitio-orpington-academy`, which Task 5's QR codes and Task 6's posters point at, and which Task 4's e2e test drives.

- [ ] **Step 1: Write the landing page**

Create `app/hitio-orpington-academy/page.tsx`:

```tsx
import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

const config: GymConfig = {
  gymName: "HITIO Gym Orpington",
  logoUrl: "https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png",
  logoAlt: "HITIO Gym Orpington",
  // Both dimensions are REQUIRED. The wordmark is 168×46; with either missing,
  // GymConfig falls back to the 52×52 square tile and crushes it.
  logoWidth: 168,
  logoHeight: 46,

  // Their own palette, read off the live site's theme config rather than eyeballed.
  primaryColor: "#e70034",  // their button colour — carries white text legibly
  darkAccent: "#ed4b51",    // lifts the hero accent line off the near-black hero
  heroBg: "#1a1a23",        // their own background, not a generic black

  heroHeadline: [
    "Become a Qualified",
    "Personal Trainer",
    "At HITIO Gym Orpington",
  ],
  heroSubline: "Train. Qualify. Earn.",
  location: "Orpington, South East London",

  promoCode: "HITIOPT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,

  // Positioning leans on what is actually distinctive here — a family-run
  // martial arts and fitness gym with a real coaching culture already in the
  // building. Equipment lists are what every other gym page says.
  positioningSubline:
    "Built inside HITIO Gym Orpington — a family-run gym where coaching is already what the place does.",
  whyThisGymHeading: "Learn Inside HITIO Gym Orpington",
  gymIntro:
    "You qualify on a floor that already runs coached sessions every day, from Brazilian jiu-jitsu to strength and conditioning.",

  stripeFullLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",  // shared payment links
  stripeDepositLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05", // gym tracked via enrolment form

  stats: [
    { value: "5am",     label: "Open From, Seven Days" },
    { value: "BJJ",     label: "Muay Thai, Boxing, Taekwondo" },
    { value: "Studio",  label: "Dedicated Group Training Space" },
    { value: "3hrs",    label: "Free Parking On Site" },
  ],

  gymHighlights: [
    "A family-run gym that coaches every day — jiu-jitsu, Muay Thai, kickboxing, boxing, Taekwondo and karate",
    "Full free-weight, cardio and functional training zones, plus a dedicated group training studio",
    "Open from 5am seven days a week, so client sessions fit around whatever else you do",
    "Three hours' free parking with EV charging, and strong bus links into Orpington",
  ],

  metaTitle: "HITIO PT Academy Orpington | Become a Qualified Personal Trainer",
  metaDescription:
    "Train, qualify and earn at HITIO Gym Orpington. Get £200 off your Level 2 & 3 PT qualification as a HITIO member. Mentorship included.",
  canonicalPath: "/hitio-orpington-academy",
};

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function HitioOrpingtonAcademyPage() {
  return <GymAcademyPage config={config} />;
}
```

- [ ] **Step 2: Write the enrol page**

Create `app/hitio-orpington-academy/enrol/page.tsx`:

```tsx
import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | HITIO PT Academy Orpington",
  description:
    "Claim your £200 HITIO member discount and start your Level 2 & 3 PT qualification today.",
  robots: { index: false },
};

// ─── HITIO Orpington partner config ──────────────────────────────────────────
// gymSlug is the stable join key and must NEVER change: every sale ever
// attributed to this partner is keyed on it. gymReferral is display only.
const HITIO_PARTNER = {
  gymSlug: "hitio-orpington",
  gymReferral: "HITIO Gym Orpington",
  promoCodes: {
    "HITIOPT": {
      label: "HITIO Member Discount",
      discountAmount: 200,
      fullPrice: 1399,
      depositPrice: 599,
      fullStripeLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      depositStripeLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
    },
  },
};

export default function HitioOrpingtonEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav. Black, because the HITIO wordmark is
          pure white and disappears on anything lighter. */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png"
              alt="HITIO Gym Orpington"
              width={132}
              height={36}
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">HITIO PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Orpington</p>
            </div>
          </div>
          <div className="bg-[#e70034] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            HITIOPT
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set, promo available */}
      <EnrolmentFlow partner={HITIO_PARTNER} standalone />

      {/* Minimal footer */}
      <div className="bg-[#061F36] border-t border-[#1A3A5C] py-6 px-6 text-center">
        <p className="text-[#4A6280] text-xs">
          PT Launch Lab · NCFE Accredited Centre No. 9002788 ·{" "}
          <a href="/terms" className="hover:text-[#8CA3BF] transition-colors">Terms</a>
          {" "}·{" "}
          <a href="/privacy" className="hover:text-[#8CA3BF] transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
}
```

Note the top bar drops the `rounded-lg` class the Superflex page uses. That treatment suits a square mark and would clip a 168×46 wordmark's corners.

The footer names PT Launch Lab, which is correct and matches every other partner enrol page — by this point the member is signing an NCFE enrolment and needs to know who the accredited centre is. The white-label rule governs *marketing* copy, not the legal footer of a checkout.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: clean. A failure naming `logoWidth` or `logoAlt` means `GymConfig` has drifted from the spec — read `app/lib/gymPartnerConfig.ts` and reconcile rather than deleting the field.

- [ ] **Step 4: Lint**

Run: `npm run lint`

Expected: clean. The `<img>` in the enrol page needs its `eslint-disable-next-line @next/next/no-img-element` comment; every other partner enrol page carries the same.

- [ ] **Step 5: Verify the page joins to the partner**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/audit-partner-platform.mts`

Expected: a new line `ok    hitio-orpington-academy → hitio-orpington` under "Gym pages → partner rows", and still `0 failures`. If it reports `has no pp_partners row — sales log as UNATTRIBUTED`, the slug in the enrol page does not match Task 1's row; fix the page, never the row.

- [ ] **Step 6: Build**

Run: `npm run build`

Expected: succeeds, and both `/hitio-orpington-academy` and `/hitio-orpington-academy/enrol` appear in the route list.

- [ ] **Step 7: Commit**

```bash
git add app/hitio-orpington-academy
git commit -m "Add the HITIO Gym Orpington academy page

Their own palette rather than a generic black-and-red: #e70034 buttons on the
#1a1a23 they actually use. logoWidth/logoHeight are both set because the HITIO
mark is a 168x46 wordmark, and GymConfig only switches out of the 52x52 square
tile when it has both.

Positioning leans on the martial arts coaching already running in the building
rather than an equipment list, which is the one thing this gym has that the
other eight partner pages cannot claim."
```

---

### Task 4: End-to-end attribution test

The partner platform joins sales on `gym_slug` in Stripe metadata. Deposits are subscriptions, and the instalment webhook only ever sees `subscription_data.metadata` — so a slug written to session metadata alone silently loses every deposit sale. This test makes that failure loud.

**Files:**
- Create: `e2e/hitio-attribution.spec.ts`
- Reference: `e2e/helpers.ts`, `e2e/pay-first-enrolment.spec.ts`

**Interfaces:**
- Consumes: `BASE_URL`, `stripeGet`, `testKey` from `e2e/helpers.ts`; the route from Task 3.
- Produces: a regression gate. Nothing depends on it.

- [ ] **Step 1: Write the failing test**

Create `e2e/hitio-attribution.spec.ts`:

```ts
import { test, expect, type APIRequestContext } from "@playwright/test";
import { BASE_URL, readTestSession } from "./helpers";

// `StripeSession` in helpers.ts does not declare `mode` — it was written for
// the redirect tests, which never needed it. Widen locally rather than editing
// the shared type, so this spec cannot change what the existing specs see.
type SessionWithMode = { mode?: string; metadata?: Record<string, string> };

// ════════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS
//
// Partner commission joins on `gym_slug`. It has to be written into BOTH the
// Checkout Session metadata AND subscription_data.metadata, because a deposit
// plan is a subscription and the instalment webhook only ever sees the latter.
//
// A slug written to session metadata alone looks completely fine — the sale
// lands, the partner is credited, the portal shows it — right up until the
// second instalment clears and the commission that should have been released
// belongs to nobody.
// ════════════════════════════════════════════════════════════════════════════

const SLUG = "hitio-orpington";

/**
 * Create a session and return its id.
 *
 * /api/checkout fails SOFT by design — a fallback returns HTTP 200 with
 * `{ url: null, reason }` so that a buyer is never blocked from paying. That
 * means res.ok() proves nothing at all here. The `id` is the only thing that
 * tells you a real Checkout Session was created rather than the caller being
 * quietly handed the raw Payment Link.
 */
async function createSession(
  request: APIRequestContext,
  paymentLink: string,
  who: string,
): Promise<string> {
  const res = await request.post(`${BASE_URL}/api/checkout`, {
    data: {
      paymentLink,
      email: `hitio-${who}@example.invalid`,
      name: `HITIO ${who} Test`,
      gymReferral: "HITIO Gym Orpington",
      gymSlug: SLUG,
      promoCode: "HITIOPT",
    },
  });
  expect(res.ok()).toBe(true);
  const checkout = await res.json();
  expect(
    checkout.id,
    `checkout fell back to the raw Payment Link (reason: ${checkout.reason ?? "none given"})`,
  ).toBeTruthy();
  return checkout.id as string;
}

test.describe("HITIO Orpington attribution", () => {
  test("pay-in-full checkout carries gym_slug in session metadata", async ({ request }) => {
    const id = await createSession(
      request,
      "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      "pif",
    );

    const { body } = await readTestSession(id);
    expect(body.metadata?.gym_slug).toBe(SLUG);
    expect(body.metadata?.plan).toBe("PIF");
  });

  // WHY THIS ASSERTS A PROXY, AND NOT subscription_data DIRECTLY
  //
  // subscription_data is a CREATE-only parameter. Retrieving a Checkout
  // Session does not return it, and `subscription` is null until the payment
  // actually completes — so there is nothing to read back on an open session.
  //
  // In createCheckoutSession a single flag, `withInstalments`, gates BOTH
  // `mode: "subscription"` and the `subscription_data.metadata` block
  // (app/lib/stripeCheckout.ts:338-365), and `metadata.instalments` is set
  // from the same condition. So a session that comes back with
  // mode === "subscription" AND metadata.instalments set is proof that the
  // subscription_data block was sent with it. Asserting the proxy is honest
  // here; asserting subscription_data directly would be asserting a field
  // Stripe never returns, which passes or fails for the wrong reasons.
  test("deposit checkout takes the instalment-mandate path with the slug attached", async ({ request }) => {
    const id = await createSession(
      request,
      "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
      "deposit",
    );

    const { body } = await readTestSession(id);
    const session = body as unknown as SessionWithMode;

    expect(session.metadata?.gym_slug).toBe(SLUG);
    expect(session.metadata?.plan).toBe("deposit");

    // Both come from `withInstalments`, the same flag that attaches
    // subscription_data.metadata. Without that block the instalment webhook
    // cannot attribute the sale, and the commission released at instalment 2
    // belongs to nobody.
    expect(session.mode, "deposit did not become a subscription — no instalment mandate").toBe(
      "subscription",
    );
    expect(
      session.metadata?.instalments,
      "instalment count absent — subscription_data was not sent",
    ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail for the right reason**

Run: `npx playwright test hitio-attribution --reporter=list`

Expected: FAIL. Before Task 3 the route does not exist; after Task 3 it should pass. If it fails with a connection error, the dev server is not up — run `npm run e2e:server` in another shell first. If it fails because `stripeGet` or `StripeSession` is not exported, read `e2e/helpers.ts` and use what is actually there rather than adding exports.

- [ ] **Step 3: Make it pass**

No new implementation should be needed — Task 3's enrol page already passes `gymSlug`, and `createCheckoutSession` already writes it to both locations (`app/lib/stripeCheckout.ts:353-362` and `:375-390`). If the deposit assertion fails, that is a real bug in the shared checkout path affecting all nine partners: stop and report it rather than working around it in the test.

- [ ] **Step 4: Run the full suite for regressions**

Run: `npm run test:e2e`

Expected: the existing `pay-first-enrolment` and `payment-link-redirects` specs still pass. This is the guard that Task 3 has not disturbed the shared checkout path.

- [ ] **Step 5: Commit**

```bash
git add e2e/hitio-attribution.spec.ts
git commit -m "Test that HITIO sales carry gym_slug in both metadata locations

A deposit plan is a subscription and the instalment webhook only sees
subscription_data.metadata. A slug written to session metadata alone looks
completely healthy until the second instalment clears and the released
commission belongs to nobody."
```

---

### Task 5: Brand entry and TV slides

**Files:**
- Modify: `scripts/gym-brands.json`
- Output (gitignored): `ad-assets/gym-tv/hitio-orpington/`

**Interfaces:**
- Consumes: `canonicalPath` from Task 3, `promoCode` from Task 2.
- Produces: ten 1920×1080 JPEGs that Task 6 uploads.

- [ ] **Step 1: Add the brand entry**

Add to `scripts/gym-brands.json`:

```json
"hitio-orpington": {
  "gymName": "HITIO Gym Orpington",
  "primaryColor": "#e70034",
  "darkAccent": "#ed4b51",
  "heroBg": "#1a1a23",
  "sectionBg": null,
  "logoUrl": "https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png",
  "promoCode": "HITIOPT",
  "discountAmount": 200,
  "fullPrice": 1399,
  "depositPrice": 599,
  "location": "Orpington, South East London",
  "heroSubline": "Train. Qualify. Earn.",
  "heroHeadline": [
    "Become a Qualified",
    "Personal Trainer",
    "At HITIO Gym\\nOrpington"
  ],
  "canonicalPath": "/hitio-orpington-academy"
}
```

- [ ] **Step 2: Validate the JSON**

Run: `node -e "const b=require('./scripts/gym-brands.json'); console.log(Object.keys(b).length,'gyms'); console.log(JSON.stringify(b['hitio-orpington'],null,2))"`

Expected: 10 gyms, and the HITIO entry printed back. A parse error here means a trailing comma.

- [ ] **Step 3: Render the slides**

Run: `node --use-system-ca scripts/gym-tv-slides.mjs hitio-orpington`

Expected: ten JPEGs in `ad-assets/gym-tv/hitio-orpington/`.

- [ ] **Step 4: Look at every slide**

Open all ten. Check specifically:

1. **The white wordmark is on dark on every slide.** This is the one that will bite — the logo is pure `#ffffff` and vanishes on any light panel. If the renderer places it on a light background, the fix is the brand entry (`heroBg`, `sectionBg`), not the renderer.
2. The wordmark is not stretched — it is 168×46 and must keep that ratio.
3. No slide names PT Launch Lab. These play on a screen in their gym; it is HITIO's academy.
4. The QR resolves to `https://ptlaunchlab.co.uk/hitio-orpington-academy` — scan one with a phone, do not assume.

Without photos in `partner-photos/hitio-orpington/` the slides fall back to solid brand colour. That is acceptable but weaker; note in the handoff that real photographs of the Orpington floor would improve them, since "right here, in this gym" is the whole claim.

- [ ] **Step 5: Commit**

```bash
git add scripts/gym-brands.json
git commit -m "Add HITIO Orpington's brand entry for TV slides

Rendered output stays gitignored. Their palette is red on near-black, which
suits a white wordmark — every slide has to keep that logo on dark or it
disappears entirely."
```

---

### Task 6: Materials and upload

**Files:**
- Create: `Partner Assets/hitio-orpington/` (gitignored; Supabase Storage is the source of truth)

**Interfaces:**
- Consumes: slides from Task 5, codes from Task 2, route from Task 3.
- Produces: `pp_resources` rows scoped to the partner.

- [ ] **Step 1: Assemble the folder**

Build `Partner Assets/hitio-orpington/` containing:

| Asset | Notes |
|---|---|
| The ten TV slides | From `ad-assets/gym-tv/hitio-orpington/` |
| QR poster | Points at `/hitio-orpington-academy`. Print size — check `scripts/fix-poster-print-size.mts` for the existing sizing convention |
| Member handout | Learner-facing, white-label |
| Promo graphics | Standard £200, **plus £500-off and £300-off launch variants** |
| Editable PPTX | So they can amend in-house |
| Signed agreement | The v3.0 PDF from the 2026-08-06 signing — file it as `legal` |

Every asset places the logo on dark or omits it.

- [ ] **Step 2: Write the launch graphics against the playbook**

The £500 and £300 graphics must carry a **real end date**, not "limited time" — `partner-playbook/campaign-launch-promo.md` is explicit that a date converts and a vague phrase does not, and that an offer quietly extended teaches members to ignore every future one. Get the intended dates from Callum before rendering; do not invent them.

- [ ] **Step 3: Dry-run the import**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/import-partner-assets.mts`

Expected: lists the HITIO files as new, scoped to `hitio-orpington`, and uploads nothing.

- [ ] **Step 4: [GATED] STOP — do not apply**

**Do not run `--apply`.** Uploading writes to the production storage bucket and
inserts `pp_resources` rows. Callum runs it.

Paste the dry-run listing into your report. Every line must be scoped to
`hitio-orpington` — anything landing at the shared/root scope would be visible
to all nine partners and must be reported, not applied.

- [ ] **Step 5: Verify the audit is still clean**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/audit-partner-platform.mts`

Read-only and safe. Expected: `0 failures` and no HITIO resources yet.

State in your report what should be true after Callum applies: a new isolation
line `ok    hitio-orpington  <n> resources · 0 sales`, `all <n> resource files
exist in storage`, and still `0 failures`. Flag prominently that a `can see N
resource(s) belonging to another gym` failure means a file landed at the wrong
scope and must be fixed immediately — one partner seeing another's material is
the single most embarrassing failure this platform has.

- [ ] **Step 6: Commit**

Only the script changes, if any — `Partner Assets/` is gitignored.

```bash
git commit --allow-empty -m "Import HITIO Orpington's materials to the resource drive

Assets live in Supabase Storage, not the repo. Launch graphics carry real end
dates rather than 'limited time', per the playbook — an offer with no date
converts nobody, and one that quietly extends teaches members to ignore the
next one."
```

---

### Task 7: [GATED] Portal login — CALLUM ONLY, NOT FOR A SUBAGENT

**This entire task is Callum's.** It creates an auth user and sends a welcome
email to Manisha Nagpal, a real director at a real company who signed today.
No subagent creates the login and no subagent sends the email.

Sequenced last of the access work so the partner's first sign-in lands on a
portal that already has their materials in it rather than an empty Resources tab.

**Files:** none.

**Interfaces:**
- Consumes: the partner row from Task 1.
- Produces: a `pp_partner_users` row, clearing the audit's `no login yet` warning.

The steps below are the runbook for Callum, not subagent instructions.

- [ ] **Step 1: Create the login**

`/admin/partners` → HITIO Gym Orpington → create a login for
`manisha.nagpal@hitiogym.com` as `owner`.

- [ ] **Step 2: Read the welcome email before trusting it**

Confirm it sent, and read it. It must state the £500 inclusive of VAT, the
release timing and the clawback. The confirmation email previously described the
old interview deal and never mentioned money at all.

- [ ] **Step 3: Verify the forced password change**

Sign in as the new account in a private window. Expected: redirected to
set-password before reaching the portal; after setting one, My Academy shows the
HITIO academy link, QR and `HITIOPT`.

**Do not skip this.** Password reset exists now, but a login that cannot complete
first sign-in is the worst possible first impression for a partner who signed today.

- [ ] **Step 4: Verify partner isolation in the live portal**

Signed in as HITIO, confirm Resources shows only HITIO material and Enrolments
shows zero — not another gym's learners.

- [ ] **Step 5: Verify with the audit**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/audit-partner-platform.mts`

Expected: `10 partner login(s)`, the `hitio-orpington: no login yet` warning gone,
`0 failures`. The bank-details warning correctly remains.

---

### Task 8: Partner logo strip

**Files:**
- Modify: `app/components/GymPartners.tsx:5-14` and the caption at `:41-44`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Check the roster against reality**

Run:

```bash
node --use-system-ca -e "
const fs=require('fs');
for(const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)\$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^[\"']|[\"']\$/g,'');}
const H={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY};
fetch(process.env.SUPABASE_URL+'/rest/v1/pp_partners?select=slug,gym_name,status,is_demo&order=slug',{headers:H})
 .then(r=>r.json()).then(rows=>rows.filter(p=>!p.is_demo).forEach(p=>console.log(p.slug.padEnd(18),p.gym_name)));"
```

The component currently lists Leodis 24/7 Gym, 1079 Fitness and Ultimate Shred — none are partners — and omits Superflex, Xcelerate and Gym n Go, which all are.

- [ ] **Step 2: Save the HITIO logo**

Save the wordmark to `public/logos/hitio-gym.png` from
`https://www.hitiogym.com/wp-content/uploads/2019/01/hitio_gym_logo1.png`.

It is white on transparent, which is correct for this section — it renders on the dark `bg-base`.

- [ ] **Step 3: Update the roster and the count**

In `app/components/GymPartners.tsx`, add to `gymPartners`:

```tsx
  { name: "HITIO Gym Orpington", src: "/logos/hitio-gym.png",  dark: true  },
```

Add the three missing partners if their logo files exist in `public/logos/`; if a file is missing, note it in the handoff rather than committing a broken `<Image src>`.

Then fix the caption at `:41-44`, which reads "6 partner gyms" above eight logos. Replace the hardcoded number with the actual partner count. **Do not** count Ultimate Shred toward it — it is Callum's own gym and the NCFE delivery centre, not a referral partner.

- [ ] **Step 4: Decide on the three non-partners**

Leodis 24/7, 1079 Fitness and Ultimate Shred are in the strip but not in `pp_partners`. They may be genuine relationships that predate the platform, or stale. **Flag them for Callum rather than removing them** — quietly deleting a gym's logo from the homepage is the kind of change that gets noticed by exactly the wrong person.

- [ ] **Step 5: Verify in a browser**

Run `npm run dev`, open the homepage. Check: HITIO appears, its white wordmark is visible against the dark section, the desktop grid does not wrap awkwardly with an extra logo, the mobile carousel cycles through the new count, and the caption number matches the logos on screen.

- [ ] **Step 6: Typecheck, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`

Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add app/components/GymPartners.tsx public/logos/hitio-gym.png
git commit -m "Add HITIO to the partner logo strip and fix the count

The caption claimed six partner gyms above eight logos. The roster had also
drifted from pp_partners — three gyms listed that are not partners, three
partners missing. Corrected the ones that are unambiguous and left the three
non-partners in place to be confirmed rather than quietly deleted."
```

---

### Task 9: Final verification walk

A green build has hidden defects of exactly this kind before. This task is done in a browser, not a terminal.

**Files:** none.

- [ ] **Step 1: Full audit**

Run: `NODE_OPTIONS=--use-system-ca npx tsx scripts/audit-partner-platform.mts`

Expected: `0 failures`. Warnings: the original 3, plus `hitio-orpington: no bank details`. Anything else needs explaining before ship.

- [ ] **Step 2: Full e2e**

Run: `npm run test:e2e`

Expected: all specs pass, including the new `hitio-attribution`.

- [ ] **Step 3: Walk the academy page**

Open `/hitio-orpington-academy` at desktop and mobile widths. Check:

1. The wordmark renders at its 168×46 ratio, not squashed into a square.
2. The logo is never on a light background anywhere down the page.
3. `#e70034` buttons carry legible white text.
4. Every CTA actually navigates — read the computed style off the DOM rather than assuming a class works. A primary button dead on desktop has shipped here before.
5. No member-facing text names PT Launch Lab outside the legal footer.

- [ ] **Step 4: Walk the enrol page to Stripe**

Open `/hitio-orpington-academy/enrol`, complete the form, click through to Stripe. Confirm the Stripe page loads at the right price and that the URL is a `checkout.stripe.com` session, **not** a raw `buy.stripe.com` link — the latter means `/api/checkout` fell back and the return URL is no longer under our control.

Do not complete a live payment. The e2e suite covers the paid path in test mode.

- [ ] **Step 5: [GATED] Walk the partner portal — Callum**

Requires the login from Task 7, so this is Callum's step. Sign in as
`manisha.nagpal@hitiogym.com` and check every section renders: My Academy (link,
QR, promo code), Enrolments (honest zero), Payments (no outstanding, bank
prompt), Resources (the full imported set, downloads resolve), Playbook (all 48
entries).

- [ ] **Step 6: Report**

Write up: what shipped, what was flagged and left alone (the three non-partner logos, any missing logo files, the absent gym photographs), and the two open items carried from the spec — the Stripe auto-applied discount, and the unresolved franchise scope question with RTRM.

---

## Deferred — not in this plan

| Item | Why |
|---|---|
| Stripe auto-applied discount (`discounts[0][promotion_code]`) | Touches checkout for all nine partners. Needs its own change, test-mode verification and rollback story. The pages advertise £1,399 while checkout is created against the £1,599 price with `allow_promotion_codes`, so the £200 applies only if the member retypes the code at Stripe — which is consistent with all eight £200 codes sitting at zero redemptions. |
| Sister sites / franchise-wide model | Scope unconfirmed with RTRM. The slug names the site, so this costs nothing later. |
| `scripts/onboard-partner.mts` generalisation | Deferred until a second site actually lands. |
| Re-papering v2.0 signers onto v3.0 | Pre-existing open item, unrelated to this partner. |
