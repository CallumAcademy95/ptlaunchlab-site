# Partner Course Guide PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one shared PDF in the partner portal that explains how Praxel works, what a learner does and sees, what the course covers, what the practicals mean for a host gym, and where a partner's role stops.

**Architecture:** A print-styled HTML document in `ptlaunchlab-site` rendered to A4 PDF by a committed Playwright script. Screenshots are captured from a labelled demo learner on the live PTLL Praxel tenant, committed as PNGs, and the demo account is deleted afterwards. The finished PDF is uploaded to the private `partner-resources` bucket as a `pp_resources` row with `partner_id = null`, under a new `delivery` category.

**Tech Stack:** Next.js / TypeScript (`ptlaunchlab-site`), Playwright (already a dev dependency), Supabase (Postgres + Storage), Node scripts run with `npx tsx` (ptlaunchlab-site) and `node --use-system-ca --env-file=.env.local` (albaco-lms).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-17-partner-course-guide-pdf-design.md`. Read it before Task 1.
- Brand: navy `#070D1B`, card `#102342`, gold `#F5C518`; headings Barlow Condensed, body Poppins.
- Document is A4 portrait, 8 pages, screenshot-led. Short blocks, no long prose.
- One document for all partners. No per-gym variants.
- PTLL Praxel tenant slug `ptll`, tenant id `3d7be695-2b2b-417e-844b-2a084f3068c9`, course id `b1dd9ac1-fe65-4982-946c-3ad374948f91`, learner host `https://ptll.praxel.co.uk`.
- Practical facts, verified 2026-08-17 and to be re-verified in Task 7: **Unit 10** = video evidence, 1–10 clips, 90 minutes max, **plus** a programme card. **Unit 6** = programme card only, **no filming**.
- No real learner's screen, name or data appears in the PDF.
- The demo learner is removed in Task 10. It must not survive the work.
- Node in `albaco-lms` needs `--use-system-ca` (TLS interception on this machine) — see the existing scripts.
- Nothing is uploaded to the partner-resources bucket until Callum has read pages 7 and 8 (Task 8 gate).

## File Structure

**`ptlaunchlab-site`** (document, build, delivery)

| Path | Responsibility |
|---|---|
| `docs/partner-guide/course-guide.html` | The document. One `<section class="page">` per page. |
| `docs/partner-guide/course-guide.css` | Print styling: A4 page box, brand tokens, page-break rules. |
| `docs/partner-guide/assets/` | Screenshots (PNG), PTLL logo, Praxel logo, NCFE logo. |
| `scripts/capture-praxel-screens.mts` | Logs into Praxel as the demo learner, writes PNGs into `assets/`. |
| `scripts/build-partner-course-guide.mts` | HTML → `docs/partner-guide/partner-course-guide.pdf`. Fails on a missing asset. |
| `scripts/upload-partner-course-guide.mts` | Uploads the PDF and inserts the shared `pp_resources` row. |
| `supabase/migrations/20260817_pp_resources_delivery_category.sql` | Adds `delivery` to the category check constraint. |
| `app/lib/partner-resources.ts` | Add the `delivery` entry to `RESOURCE_CATEGORIES`. |

**`albaco-lms`** (demo learner only)

| Path | Responsibility |
|---|---|
| `scripts/create-test-learner.mjs` | Modified: `--tenant` / `--course` flags so it can target PTLL. |
| `scripts/seed-partner-guide-progress.mjs` | Gives the demo learner mid-course progress worth photographing. |

---

### Task 1: Point the test-learner script at any tenant

`create-test-learner.mjs` already creates a labelled learner with a known password and tears it
down cleanly with `--remove`. It is hardcoded to the `albaco` tenant. Parameterise it rather
than writing a second script that would drift from the teardown logic.

**Files:**
- Modify: `C:\Projects\albaco-lms\scripts\create-test-learner.mjs`

**Interfaces:**
- Produces: a demo learner reachable at `https://ptll.praxel.co.uk` — email
  `partner-guide-demo@ptll-demo.local`, password `PartnerGuide-2026!`, name
  `Demo Learner (DEMO — safe to delete)`. Tasks 2 and 3 sign in as this account.

- [ ] **Step 1: Read the script end to end**

`C:\Projects\albaco-lms\scripts\create-test-learner.mjs`. Note how it resolves the tenant, how
it resolves the course by `code`, and everything `--remove` deletes. The teardown list is the
part that matters — Task 10 depends on it being complete.

- [ ] **Step 2: Add the flags**

Replace the fixed constants near the top:

```js
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const TENANT = arg('tenant', 'albaco')
const COURSE_CODE = arg('course', 'NCFE-L3-GIPT')
// Per-tenant identity, so a PTLL demo account can never collide with the AlbaCo one.
const EMAIL = TENANT === 'albaco' ? 'ia-test-learner@albaco-demo.local' : `partner-guide-demo@${TENANT}-demo.local`
const PASSWORD = TENANT === 'albaco' ? 'TestLearner-2026!' : 'PartnerGuide-2026!'
const NAME = TENANT === 'albaco' ? 'IA Test Learner (TEST — safe to delete)' : 'Demo Learner (DEMO — safe to delete)'
```

Then change the tenant and course lookups to use them:

```js
const { data: t } = await admin.from('tenants').select('id').eq('slug', TENANT).single()
const { data: course } = await admin.from('courses').select('id, title')
  .eq('tenant_id', t.id).eq('code', COURSE_CODE).single()
```

- [ ] **Step 3: Verify the default is unchanged**

Run:
```bash
cd /c/Projects/albaco-lms
node --use-system-ca --env-file=.env.local scripts/create-test-learner.mjs --remove
```
Expected: either "removed the test learner" or "not present — nothing to remove". Neither
errors. This proves the AlbaCo path still resolves.

- [ ] **Step 4: Create the PTLL demo learner**

Run:
```bash
node --use-system-ca --env-file=.env.local scripts/create-test-learner.mjs --tenant=ptll
```
Expected: success output naming the PTLL course, *NCFE Level 3 Diploma in Gym Instructing and
Personal Training*.

If it fails on the course lookup, the PTLL course's `code` is not `NCFE-L3-GIPT`. Find the real
value and pass `--course=<code>`:
```bash
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select code, title from courses where id = 'b1dd9ac1-fe65-4982-946c-3ad374948f91'"
```

- [ ] **Step 5: Prove it landed on the right tenant**

Run:
```bash
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select p.email, p.tenant_id, e.status from profiles p join enrolments e on e.learner_id = p.id where p.email = 'partner-guide-demo@ptll-demo.local'"
```
Expected: one row, `tenant_id` = `3d7be695-2b2b-417e-844b-2a084f3068c9`.

**If it reports zero rows, stop.** A demo learner on the wrong tenant is a fake enrolment in
someone's live reporting — remove it with `--remove` before going further.

- [ ] **Step 6: Commit**

```bash
cd /c/Projects/albaco-lms
git add scripts/create-test-learner.mjs
git commit -m "Let the test-learner script target any tenant"
```

---

### Task 2: Give the demo learner something worth photographing

A blank account screenshots as a blank account: empty progress bars, no feedback, nothing that
shows a partner what the course feels like. Seed a mid-course state.

**Files:**
- Create: `C:\Projects\albaco-lms\scripts\seed-partner-guide-progress.mjs`

**Interfaces:**
- Consumes: the demo learner from Task 1.
- Produces: an enrolment showing units 1 and 2 approved, unit 3 in progress with partial
  answers, and one assessor feedback comment visible to the learner.

- [ ] **Step 1: Learn the shapes before writing anything**

Read `C:\Projects\albaco-lms\lib\completion.ts` and
`C:\Projects\albaco-lms\app\dashboard\submissions\[id]\actions.ts`. Then inspect a real
submission and a real assessment so the seeded rows match production shape exactly:

```bash
cd /c/Projects/albaco-lms
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select column_name, data_type from information_schema.columns where table_name in ('submissions','assessments') order by table_name, ordinal_position"
```

Write the script against what you see, not against what this plan guesses.

- [ ] **Step 2: Write the seed script**

Model the file on `scripts/seed-demo-learner.mjs` — same env loading, same `--remove` support,
same `ok()` logging. Skeleton:

```js
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const EMAIL = 'partner-guide-demo@ptll-demo.local'
const TENANT = '3d7be695-2b2b-417e-844b-2a084f3068c9'
const COURSE = 'b1dd9ac1-fe65-4982-946c-3ad374948f91'
const REMOVE = process.argv.includes('--remove')
const ok = (m) => console.log('✓ ' + m)

const { data: learner } = await admin.from('profiles').select('id').eq('email', EMAIL).single()
const { data: enrolment } = await admin.from('enrolments').select('id').eq('learner_id', learner.id).single()
const { data: units } = await admin.from('units').select('id, ordinal').eq('course_id', COURSE).order('ordinal')
const unit = (n) => units.find((u) => u.ordinal === n).id

if (REMOVE) {
  const { data: subs } = await admin.from('submissions').select('id').eq('enrolment_id', enrolment.id)
  for (const s of subs ?? []) await admin.from('assessments').delete().eq('submission_id', s.id)
  await admin.from('submissions').delete().eq('enrolment_id', enrolment.id)
  ok('removed seeded progress')
  process.exit(0)
}
// …inserts follow, one unit at a time, each row carrying tenant_id: TENANT
```

It must:

1. Resolve the demo learner by email `partner-guide-demo@ptll-demo.local` and their enrolment.
2. For units 1 and 2 (ordinal 1, 2 of course `b1dd9ac1-…`): insert a `submissions` row with
   plausible `answers`, then an `assessments` row recording a pass.
3. For unit 3: insert a submission with roughly half its answers filled and no assessment, so
   the unit reads as in progress.
4. On unit 2's assessment, set feedback text a partner should see the tone of, e.g.
   *"Good detail on the joint actions. For the last question, name the muscle as well as the movement."*
5. Support `--remove`, deleting only what it created.

Every insert must set `tenant_id` to the PTLL tenant. A row without it is invisible to the app
and a liability in a multi-tenant table.

- [ ] **Step 3: Run it**

```bash
node --use-system-ca --env-file=.env.local scripts/seed-partner-guide-progress.mjs
```
Expected: one ✓ line per seeded object, no errors.

- [ ] **Step 4: Confirm it renders, not just that it inserted**

Open `https://ptll.praxel.co.uk` in a browser, sign in as `partner-guide-demo@ptll-demo.local`
/ `PartnerGuide-2026!`, and look at `/dashboard` and `/learn`.

Expected: units 1 and 2 show as complete, unit 3 partially done, and unit 2's feedback is
readable by the learner.

A green script and an empty dashboard is the failure this step exists to catch. If progress
does not render, the seeded rows are the wrong shape — fix the script, do not photograph an
empty screen.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-partner-guide-progress.mjs
git commit -m "Seed mid-course progress for the partner-guide demo learner"
```

---

### Task 3: Capture the screenshots

**Files:**
- Create: `C:\Projects\ptlaunchlab-site\scripts\capture-praxel-screens.mts`
- Create: `C:\Projects\ptlaunchlab-site\docs\partner-guide\assets\` (PNG output)

**Interfaces:**
- Consumes: the seeded demo learner from Task 2.
- Produces: `dashboard.png`, `unit-list.png`, `unit-page.png`, `workbook-task.png`,
  `feedback.png`, `library.png` in `docs/partner-guide/assets/`. Tasks 5 and 7 place these by
  filename.

Every screen is captured from the learner account, including the course-content ones. The spec
allows the admin preview route for those, but a partner is being shown what their member sees —
so the learner's own view is the more honest source, and it is one login instead of two.

- [ ] **Step 1: Write the capture script**

```ts
/**
 * Screenshots the learner's view of Praxel for the partner course guide.
 *
 *   PRAXEL_DEMO_EMAIL=... PRAXEL_DEMO_PASSWORD=... npx tsx scripts/capture-praxel-screens.mts
 *
 * Credentials come from the environment, never the repo: this signs into the
 * live platform. The account is the labelled demo learner created by
 * albaco-lms/scripts/create-test-learner.mjs --tenant=ptll, and it is deleted
 * once the guide is built.
 */
import { chromium } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";

const HOST = process.env.PRAXEL_HOST ?? "https://ptll.praxel.co.uk";
const EMAIL = process.env.PRAXEL_DEMO_EMAIL;
const PASSWORD = process.env.PRAXEL_DEMO_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set PRAXEL_DEMO_EMAIL and PRAXEL_DEMO_PASSWORD");

const OUT = path.join(process.cwd(), "docs", "partner-guide", "assets");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// Desktop width with a 2x device scale — a screenshot that looks fine on screen
// prints as mush at 150dpi.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await page.goto(`${HOST}/login`);
await page.getByLabel(/email/i).fill(EMAIL);
await page.getByLabel(/password/i).fill(PASSWORD);
await page.getByRole("button", { name: /sign in|log in/i }).click();
await page.waitForURL(/\/(dashboard|learn|induction)/, { timeout: 30_000 });

async function shot(name: string, url: string) {
  await page.goto(`${HOST}${url}`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`✓ ${name}.png`);
}

await shot("dashboard", "/dashboard");
await shot("unit-list", "/learn");
await browser.close();
```

- [ ] **Step 2: Run it for the two easy screens**

```bash
cd /c/Projects/ptlaunchlab-site
PRAXEL_DEMO_EMAIL=partner-guide-demo@ptll-demo.local PRAXEL_DEMO_PASSWORD='PartnerGuide-2026!' npx tsx scripts/capture-praxel-screens.mts
```
Expected: `✓ dashboard.png`, `✓ unit-list.png`.

If the login selectors do not match, open `https://ptll.praxel.co.uk/login` and read the form
markup, then fix the locators. Do not add `waitForTimeout` — fix the selector.

- [ ] **Step 3: Add the four deeper screens**

The unit routes are `/learn/<unitId>`, so the ids have to come from the database rather than be
guessed. Fetch them once:

```bash
cd /c/Projects/albaco-lms
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select ordinal, id from units where course_id = 'b1dd9ac1-fe65-4982-946c-3ad374948f91' and ordinal in (2,3,10) order by ordinal"
```

Unit 3 is the in-progress one (workbook task screenshot), unit 2 carries the assessor feedback
(feedback screenshot), unit 10 is the practical. Add them to the script as constants and extend
it:

```ts
const UNIT_IN_PROGRESS = process.env.PRAXEL_UNIT_IN_PROGRESS!;  // unit 3
const UNIT_WITH_FEEDBACK = process.env.PRAXEL_UNIT_FEEDBACK!;   // unit 2

await shot("unit-page", `/learn/${UNIT_IN_PROGRESS}`);
await shot("library", "/library");

// The workbook task and the feedback panel are regions, not whole pages — a
// full-page shot of either prints too small to read.
await page.goto(`${HOST}/learn/${UNIT_IN_PROGRESS}`);
await page.waitForLoadState("networkidle");
await page.locator("form, [data-task], main section").first()
  .screenshot({ path: path.join(OUT, "workbook-task.png") });

await page.goto(`${HOST}/learn/${UNIT_WITH_FEEDBACK}`);
await page.waitForLoadState("networkidle");
await page.getByText(/feedback/i).first().scrollIntoViewIfNeeded();
await page.locator("main").screenshot({ path: path.join(OUT, "feedback.png") });
```

The two `locator` selectors above are a starting guess. Open each page first, find the element
that actually wraps the task and the feedback, and use that — a screenshot of the wrong region
is a silent failure that only shows up in the printed PDF.

- [ ] **Step 4: Look at every PNG**

Open all six. Check: no real learner's name anywhere, text legible at print size, nothing
half-rendered, no error toast in shot.

- [ ] **Step 5: Commit**

```bash
git add scripts/capture-praxel-screens.mts docs/partner-guide/assets
git commit -m "Capture the learner's view of Praxel for the partner guide"
```

---

### Task 4: The document shell — cover and the 60-second version

**Files:**
- Create: `C:\Projects\ptlaunchlab-site\docs\partner-guide\course-guide.html`
- Create: `C:\Projects\ptlaunchlab-site\docs\partner-guide\course-guide.css`
- Create: `C:\Projects\ptlaunchlab-site\scripts\build-partner-course-guide.mts`
- Copy: `C:\Projects\albaco-lms\public\praxel-mark-bright.png` → `docs/partner-guide/assets/praxel.png`
- Copy: `C:\Projects\ptlaunchlab-site\public\logo.png` → `docs/partner-guide/assets/ptll.png`
- Copy: `C:\Projects\ptlaunchlab-site\public\logos\ncfe.png` → `docs/partner-guide/assets/ncfe.png`

**Interfaces:**
- Produces: `buildGuide()` behaviour — `npx tsx scripts/build-partner-course-guide.mts` writes
  `docs/partner-guide/partner-course-guide.pdf` and exits non-zero if any `<img src>` is
  missing from disk. Tasks 5–8 add pages and re-run it unchanged.

- [ ] **Step 1: Write the build script, including the asset check**

```ts
/**
 * Renders the partner course guide to PDF.
 *
 *   npx tsx scripts/build-partner-course-guide.mts
 *
 * The missing-asset check is the point of doing this in code: a broken <img>
 * renders as blank white in a PDF, and blank white in a document sent to nine
 * gyms is indistinguishable from a design decision.
 */
import { chromium } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DIR = path.join(process.cwd(), "docs", "partner-guide");
const HTML = path.join(DIR, "course-guide.html");
const PDF = path.join(DIR, "partner-course-guide.pdf");

const html = readFileSync(HTML, "utf8");
const missing = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((src) => !src.startsWith("data:") && !existsSync(path.join(DIR, src)));
if (missing.length) {
  console.error("Missing assets:\n  " + missing.join("\n  "));
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle" });
await page.pdf({ path: PDF, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`✓ ${PDF}`);
```

- [ ] **Step 2: Prove the asset check fails loudly**

Temporarily add `<img src="assets/does-not-exist.png">` to a scratch copy of the HTML, run the
build, and confirm it exits non-zero listing that file. Remove the line.

Expected: `Missing assets: assets/does-not-exist.png`, exit code 1.

- [ ] **Step 3: Write the CSS page box**

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600&display=swap');

@page { size: A4 portrait; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --navy: #070D1B;
  --card: #102342;
  --gold: #F5C518;
  --ink: #0B1524;
  --soft: #5A6B82;
}

body { font-family: Poppins, sans-serif; color: var(--ink); }

.page {
  width: 210mm; height: 297mm;
  padding: 16mm 15mm;
  page-break-after: always;
  position: relative;
  overflow: hidden;          /* a page that overflows silently steals the next one */
}
.page:last-child { page-break-after: auto; }

h1, h2, h3 { font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; }
h2 { font-size: 30pt; line-height: 1; margin-bottom: 6mm; }
p, li { font-size: 10.5pt; line-height: 1.55; }

.cover { background: var(--navy); color: #fff; }
.rule { height: 3px; background: var(--gold); width: 28mm; margin: 5mm 0; }
figure { margin: 4mm 0; }
figure img { width: 100%; border: 1px solid #DCE4EE; border-radius: 3mm; }
figcaption { font-size: 8.5pt; color: var(--soft); margin-top: 2mm; }
```

- [ ] **Step 4: Write pages 1 and 2**

Page 1 (`.page.cover`): PTLL logo, title *Your learner's course, explained*, a single line —
*What your members do once they enrol, what they'll see, and how you can help* — the Praxel and
NCFE logos at the foot, and a version line reading `v1.0 · August 2026`.

Page 2, *The 60-second version*, three blocks:
- **What it is** — NCFE Level 3 Diploma in Gym Instructing and Personal Training, 12 units,
  studied online on Praxel, with practical sessions filmed in a gym.
- **Who does what** — PT Launch Lab teaches, marks and awards. Your gym refers members and
  hosts the practical. Nobody at the gym marks anything.
- **The one thing to remember** — if a learner asks you a course question you are not sure
  about, send them to their tutor rather than guessing. Wrong answers cost them a resubmission.

- [ ] **Step 5: Build and read it**

```bash
npx tsx scripts/build-partner-course-guide.mts
```
Expected: `✓ …/partner-course-guide.pdf`. Open it: exactly 2 pages, logos visible, no text
touching the page edge, gold rule present.

- [ ] **Step 6: Commit**

```bash
git add docs/partner-guide scripts/build-partner-course-guide.mts
git commit -m "Partner course guide: cover and the 60-second version"
```

---

### Task 5: Pages 3–5 — how Praxel works, the learner's loop, what they see

**Files:**
- Modify: `docs/partner-guide/course-guide.html`
- Modify: `docs/partner-guide/course-guide.css` (flow strip only)

- [ ] **Step 1: Page 3 — How Praxel works**

Explain, in four short blocks beside the `dashboard.png` figure: Praxel is the learning
platform, the learner signs in at `ptll.praxel.co.uk`, everything lives there (units, tasks,
feedback, evidence), and they can work on a phone. Caption the screenshot *A learner's
dashboard — where they land every time they sign in.*

- [ ] **Step 2: Page 4 — What a learner actually does**

A horizontal flow strip, then the `unit-page.png` figure:

```
Induction → Diagnostic → Unit → Workbook tasks → Submit → Tutor feedback → Next unit
```

```css
.flow { display: flex; gap: 2mm; margin: 6mm 0; }
.flow div {
  flex: 1; background: var(--card); color: #fff; border-radius: 2mm;
  padding: 4mm 2mm; text-align: center; font-size: 8pt; font-weight: 600;
}
.flow div:nth-child(odd) { background: var(--navy); }
```

Under it, one line each on what the loop means in practice: units are worked in order, tasks
save as they go, a submitted unit waits on an assessor, and feedback can send a unit back for
another go — which is normal, not a failure.

- [ ] **Step 3: Page 5 — What they see**

A 2×2 grid of `unit-list.png`, `workbook-task.png`, `feedback.png`, `library.png`, each with a
one-line caption saying what a partner is looking at.

```css
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
```

- [ ] **Step 4: Build and read pages 3–5**

```bash
npx tsx scripts/build-partner-course-guide.mts
```
Expected: 5 pages. Every screenshot readable at print size, no figure split across a page
break, no caption orphaned from its image.

- [ ] **Step 5: Commit**

```bash
git add docs/partner-guide
git commit -m "Partner course guide: how Praxel works and what a learner sees"
```

---

### Task 6: Page 6 — what the course covers

**Files:**
- Modify: `docs/partner-guide/course-guide.html`

- [ ] **Step 1: Confirm the unit list against the live course**

```bash
cd /c/Projects/albaco-lms
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select ordinal, code, title from units where course_id = 'b1dd9ac1-fe65-4982-946c-3ad374948f91' order by ordinal"
```

Expected (verified 2026-08-17 — re-check, do not assume):

| # | Unit |
|---|---|
| 1 | Anatomy and Physiology for Exercise |
| 2 | Maximising the Customer Experience in a Gym Environment |
| 3 | Supporting Client Health and Well-being |
| 4 | Conducting Client Consultations and Gym Inductions |
| 5 | Planning and Reviewing Gym-Based Exercise Programmes |
| 6 | Instructing and Supervising Gym-Based Exercise Programmes |
| 7 | Applied Anatomy and Physiology for Activity, Health and Fitness |
| 8 | Client Motivation and Lifestyle Management |
| 9 | Programming Personal Training Sessions |
| 10 | Delivering Personal Training Sessions |
| 11 | Nutrition to Support a Physical Activity Programme |
| 12 | Business Acumen for Personal Trainers |

- [ ] **Step 2: Build the grid**

Two columns of six numbered cards. Units 6 and 10 carry a gold `IN THE GYM` tag; unit 10's tag
reads `IN THE GYM · FILMED`. Under the grid, one line: *Units 6 and 10 are the ones that happen
on a gym floor. Only unit 10 is filmed — see the next page.*

- [ ] **Step 3: Build and check**

```bash
npx tsx scripts/build-partner-course-guide.mts
```
Expected: 6 pages, all 12 units on one page, tags on 6 and 10 only.

- [ ] **Step 4: Commit**

```bash
git add docs/partner-guide
git commit -m "Partner course guide: the 12 units"
```

---

### Task 7: Page 7 — practicals in your gym

This is the page a gym acts on. Every claim gets verified against the learner's own screen
before it is written, not taken from this plan.

**Files:**
- Modify: `docs/partner-guide/course-guide.html`

- [ ] **Step 1: Re-verify the requirements from the database**

```bash
cd /c/Projects/albaco-lms
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select u.ordinal, u.title, pa.title as requirement, pa.accept, pa.min_clips, pa.max_clips, pa.max_minutes, pa.instructions_md from practical_assessments pa join units u on u.id = pa.unit_id where u.course_id = 'b1dd9ac1-fe65-4982-946c-3ad374948f91' order by u.ordinal"
```

Expected as of 2026-08-17: unit 10 video (1–10 clips, 90 min) + programme card; unit 6
programme card only. **If this has changed, the page follows the database, not the plan.**

- [ ] **Step 2: Read what the learner is actually told**

Sign in as the demo learner and open unit 10. Read the on-screen instructions in full. The PDF
must not contradict them — a gym told one thing and a learner told another is worse than no
document.

- [ ] **Step 3: Write the page**

Cover, in short blocks:
- **What is filmed** — unit 10 only: a real personal training session with a real client,
  uploaded as up to 10 clips totalling no more than 90 minutes.
- **Unit 6 is not filmed** — it needs a programme card, a document, not footage.
- **What the gym provides** — floor space and the equipment the session plan calls for, at a
  time when the space can actually be used.
- **The client is real** — a willing participant, not a friend miming. They should know they
  are being filmed and why.
- **Other members** — keep them out of frame. A phone on a tripod pointing at one station is
  usually enough; a busy walkway is not.
- **Sound matters** — the assessor has to hear the coaching. Background music and a shouted
  cue across a gym floor lose more submissions than bad camera angles.
- **The programme card** — the written plan for that same session, uploaded alongside the
  video.
- **Who signs it off** — a PT Launch Lab assessor, from the footage. Nobody at the gym assesses
  or countersigns anything.

- [ ] **Step 4: Build and check**

```bash
npx tsx scripts/build-partner-course-guide.mts
```
Expected: 7 pages, page 7 fits without overflow.

- [ ] **Step 5: Commit**

```bash
git add docs/partner-guide
git commit -m "Partner course guide: practicals in the gym"
```

---

### Task 8: Page 8 — where you fit, and the review gate

**Files:**
- Modify: `docs/partner-guide/course-guide.html`

- [ ] **Step 1: Write the two columns**

Left, **You genuinely help by**: providing space and equipment for the practical; finding a
willing client; giving them somewhere quiet to film; asking how it is going; telling us when
someone has gone quiet or is struggling; reminding them their tutor answers questions fastest.

Right, **Please leave to us**: teaching or explaining course content; marking, checking or
approving work; signing anything off; completing or correcting a learner's tasks; promising an
interview, a job or a placement.

Under both, one line: *Your agreement makes the gym a referral and distribution partner. That
is the whole of it — and it is genuinely useful.*

Foot of the page: who to contact, `info@ptlaunchlab.co.uk` and the partner portal address.

- [ ] **Step 2: Build the finished document**

```bash
npx tsx scripts/build-partner-course-guide.mts
```
Expected: exactly 8 pages.

- [ ] **Step 3: Read the whole PDF once, cover to back**

Check for: clipped or stretched screenshots, orphaned headings, text running past the page box,
any screenshot too small to read at print size, any real learner's name.

- [ ] **Step 4: Commit**

```bash
git add docs/partner-guide
git commit -m "Partner course guide: where the partner fits"
```

- [ ] **Step 5: GATE — Callum reads pages 7 and 8**

Send him the built PDF. Do not proceed to Task 9 until he has approved those two pages.
Nine gyms will act on the practicals wording, and page 8 contradicts material some of them
already hold.

---

### Task 9: Shelve it in the portal

**Files:**
- Create: `C:\Projects\ptlaunchlab-site\supabase\migrations\20260817_pp_resources_delivery_category.sql`
- Modify: `C:\Projects\ptlaunchlab-site\app\lib\partner-resources.ts:16-23`
- Create: `C:\Projects\ptlaunchlab-site\scripts\upload-partner-course-guide.mts`

**Interfaces:**
- Consumes: `docs/partner-guide/partner-course-guide.pdf` from Task 8.
- Produces: a `pp_resources` row with `partner_id = null`, `category = 'delivery'`,
  `version = 'v1.0'`, visible to all nine partners.

- [ ] **Step 1: Write the migration**

```sql
-- A seventh resource category. The guide explains the course a learner is on —
-- the opposite end of the journey from 'training', which is "Selling the course".
alter table pp_resources drop constraint if exists pp_resources_category_check;
alter table pp_resources add constraint pp_resources_category_check
  check (category in ('branding', 'print', 'digital', 'learner', 'legal', 'training', 'delivery'));
```

Confirm the constraint's real name first — it is generated, and dropping the wrong one silently
removes a different guard:

```sql
select conname from pg_constraint where conrelid = 'pp_resources'::regclass and contype = 'c';
```

- [ ] **Step 2: Add the category to the UI list**

In `app/lib/partner-resources.ts`, append to `RESOURCE_CATEGORIES`:

```ts
  { key: "delivery", label: "Supporting your learners", blurb: "What the course involves and how to help" },
```

- [ ] **Step 3: Apply the migration and typecheck**

```bash
cd /c/Projects/ptlaunchlab-site
npx tsc --noEmit
```
Expected: clean.

Migrations in this repo are applied **by hand in the Supabase SQL editor** — see
`PARTNER-PLATFORM-PLAN.md:73`. Run the `alter table` statements in the SQL editor for project
**`rbbudrdryuokujlsvwgm`** — the *fitness* org project, **not** the AlbaCo learner-data one.
Getting that wrong points the constraint at a database that has no `pp_resources` table.

Then confirm the constraint took:

```sql
select pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'pp_resources'::regclass and contype = 'c';
```
Expected: the check list now ends with `'delivery'`.

- [ ] **Step 4: Write the upload script**

Model it on `scripts/seed-demo-resources.mts` — same `.env.local` loading, same
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` headers, same bucket. It uploads
`docs/partner-guide/partner-course-guide.pdf` to `partner-resources` at
`shared/partner-course-guide-v1.pdf`, then inserts:

```ts
{
  partner_id: null,
  category: "delivery",
  title: "Your learner's course, explained",
  description: "How Praxel works, what your learner does, what the course covers, and what the practicals need from your gym.",
  storage_path: "shared/partner-course-guide-v1.pdf",
  mime: "application/pdf",
  file_size: <bytes>,
  version: "v1.0",
  sort_order: 1,
}
```

Guard it behind `--apply`, like the demo seeder, so a dry run is the default.

- [ ] **Step 5: Dry run, then apply**

```bash
npx tsx scripts/upload-partner-course-guide.mts
npx tsx scripts/upload-partner-course-guide.mts --apply
```
Expected: the dry run prints what it would do and writes nothing; `--apply` reports the upload
and the inserted row id.

- [ ] **Step 6: Walk the portal as a partner**

Sign in to the partner portal as a real partner account and go to the Resource Drive. Confirm:
a "Supporting your learners" section exists, the guide is in it, and **clicking it downloads a
readable PDF**.

A clean insert is not proof a partner can get the file — the download goes through a signed-URL
route that has to resolve the new category too.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260817_pp_resources_delivery_category.sql app/lib/partner-resources.ts scripts/upload-partner-course-guide.mts
git commit -m "Shelve the course guide under a new Supporting your learners category"
```

---

### Task 10: Remove the demo learner

The account exists only to be photographed. Left behind it becomes a fake enrolment in
reporting, an entry on an assessor's dashboard, and eventually a line in EQA evidence.

**Files:** none changed — this is an operation with a verification.

- [ ] **Step 1: Remove the seeded progress**

```bash
cd /c/Projects/albaco-lms
node --use-system-ca --env-file=.env.local scripts/seed-partner-guide-progress.mjs --remove
```

- [ ] **Step 2: Remove the account**

```bash
node --use-system-ca --env-file=.env.local scripts/create-test-learner.mjs --tenant=ptll --remove
```

- [ ] **Step 3: Prove it is gone**

```bash
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select count(*) from profiles where email = 'partner-guide-demo@ptll-demo.local'"
node --use-system-ca --env-file=.env.local scripts/run-sql.mjs --sql "select count(*) from enrolments where tenant_id = '3d7be695-2b2b-417e-844b-2a084f3068c9'"
```

Expected: the first returns 0. The second returns **15** — the count from before this work
started. Anything higher means demo data survived somewhere the teardown does not reach.

- [ ] **Step 4: Confirm the PDF still builds without the account**

```bash
cd /c/Projects/ptlaunchlab-site
npx tsx scripts/build-partner-course-guide.mts
```
Expected: 8 pages, unchanged. The screenshots are committed PNGs; the document must not depend
on a live account.

---

## Notes for whoever executes this

- Tasks 1–3 touch production data on the live Praxel tenant. Task 10 is not optional and is not
  "later" — it is part of the work.
- If Task 2's seeded progress will not render, do not photograph an empty dashboard and move
  on. An empty screenshot teaches a partner nothing, which defeats the document.
- The practical requirements in Task 7 changed once already this year. The database is the
  source of truth; this plan is a snapshot of it.
