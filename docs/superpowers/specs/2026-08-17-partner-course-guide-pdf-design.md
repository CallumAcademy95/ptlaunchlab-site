# Partner course guide PDF — design

**Date:** 2026-08-17
**Status:** approved, not implemented

## Why

A gym partner asked how they help a learner on the course. They teach nothing and assess
nothing, so the honest answer is narrow — but it is not "nothing", and right now no document
says it. Nine partners are referring members onto a course whose shape they cannot see.

Two failures follow from that gap. Staff cannot answer a member's questions, so a live lead
goes cold at the front desk. And, worse, partners fill the silence themselves: material already
in their hands promises "at least one guaranteed interview with a partner gym", a claim the v3.0
agreement does not support — Clause 2.2 makes the gym "solely a distribution and referral
partner". A document that explains the course is also the document that draws that line.

## What we are building

One PDF, identical for every partner, in the portal's Resource Drive. PT Launch Lab brand,
Praxel logo. A4 portrait, about eight pages, screenshot-led — short blocks of text, no
paragraphs of prose.

It is orientation plus guardrails. It explains how Praxel works, what the learner does and
sees, what the course covers, and what the practicals mean for a gym hosting them. It then
states plainly what a partner should not do.

It is **not** a support playbook: no per-stage scripts, no check-in cadence, no conversation
prompts for a stalled learner. That was considered and cut. Every one of those needs
maintaining as the course changes, and none of it is what the partner asked for.

## Page plan

| # | Page | Carries |
|---|---|---|
| 1 | Cover | Title, who it is for, what it answers |
| 2 | The 60-second version | NCFE L3 Diploma, 12 units, online study plus practicals in a gym · who does what: PTLL teaches and assesses, the gym refers and hosts · the one thing to remember |
| 3 | How Praxel works | What the platform is, how a learner gets in, what greets them. Annotated dashboard screenshot |
| 4 | What a learner actually does | The loop: induction → diagnostic → unit → workbook tasks → submit → assessor feedback → next unit. Flow strip plus a unit screen |
| 5 | What they see | 3–4 annotated screenshots: unit list with progress, a workbook task, the feedback panel, the library or guide |
| 6 | What the course covers | All 12 units as a scannable grid, practical units flagged |
| 7 | Practicals in your gym | Unit 10's filmed session, what usable footage looks like, space and kit, needing a real client, other members' privacy, the programme card. Unit 6 flagged as card-only |
| 8 | Where you fit | What a partner genuinely helps with, against what they must never do · who to contact |

### Page 7 — the facts as they stand today

Verified against the live PTLL course (`b1dd9ac1-fe65-4982-946c-3ad374948f91`), not from notes:

- **Unit 10, Delivering Personal Training Sessions** — video evidence, 1 to 10 clips, 90
  minutes maximum, plus a programme card (`.pdf,.doc,.docx,image/*`).
- **Unit 6, Instructing and Supervising Gym-Based Exercise Programmes** — programme card
  only. **No filming.** A gym will assume both units mean filming; they do not.

Every claim on this page must be re-checked against the learner's own screen at build time, not
against the database alone. It is the page a gym will act on.

### Page 8 — the boundary

Helps with: space and equipment, a willing real client, somewhere quiet to film, encouragement,
a nudge when someone has gone quiet, telling PTLL when a learner is struggling.

Never: teaching course content, marking or assessing anything, signing anything off, completing
or correcting a learner's work, promising an interview or a job.

## How it is built

Three committed pieces in `ptlaunchlab-site`:

- `docs/partner-guide/course-guide.html` and `course-guide.css` — the document, print-styled
  for A4 with `printBackground` and explicit page breaks.
- `docs/partner-guide/assets/` — screenshots as PNGs, plus the Praxel logo.
- `scripts/build-partner-course-guide.mts` — Playwright chromium, `page.pdf()`. One command
  re-issues the PDF.

HTML rather than `pdfkit` (the house tool for the enrolment pack and the partnership agreement)
because this document is screenshot-heavy and designed; laying that out programmatically in
`pdfkit` is slow and fragile. Playwright is already a dev dependency.

## Screenshots

Captured from a demo learner on the live PTLL tenant (`3d7be695-2b2b-417e-844b-2a084f3068c9`).
The tenant holds 16 profiles and 15 enrolments, all real people — no real learner's screen goes
into a document sent to nine gyms.

A seed script in `albaco-lms` creates the demo learner mid-course — earlier units complete, one
unit in progress, at least one task carrying assessor feedback — so the dashboard, the progress
bars and the feedback panel all have something real to show. Course-content
screens come from the admin preview route (`app/admin/courses/[id]/preview/[unitId]`), which
renders no learner data at all, so only the dashboard and progress screens need the account.

**The demo account is created, captured, then removed.** A permanent fake learner in production
would land in enrolment counts, assessor dashboards, risk and attendance reporting, and
EQA evidence, and could be picked up by nudge crons. The seed script makes re-capture cheap, so
nothing is gained by leaving it in place. Screenshots are committed as PNGs; re-issuing the
document later does not require the account to still exist.

## How it reaches partners

- A migration adds a seventh resource category, `delivery`, to the
  `pp_resources` check constraint, with the matching entry in `RESOURCE_CATEGORIES`
  (`app/lib/partner-resources.ts`): label "Supporting your learners", blurb "What the course
  involves and how to help".
- The PDF is uploaded to the private `partner-resources` bucket and given a `pp_resources` row
  with `partner_id = null`, so all nine partners see it. `version` is `v1.0`.

The existing `training` category was the alternative, but it is "Selling the course" — the
opposite end of the learner journey. This shelf is expected to grow (a practicals one-pager, a
partner FAQ), which justifies its own category rather than a misfiled row.

Today the Drive holds 73 resources, of which exactly one is shared across all partners (the Gym
partner handbook). This becomes the second.

## Verification

- Build the PDF and read every page: clipped or stretched screenshots, orphaned headings, text
  running off the page, screenshots too small to read at print size.
- Walk the live portal signed in as a partner and download the file. A `pp_resources` row that
  inserted cleanly is not proof a partner can get the document.

## Gate

Callum reads pages 7 and 8 before the file goes into the bucket. Nine gyms will act on the
practicals wording, and page 8 corrects material some of them already hold.

## Out of scope

- Per-gym branded variants. One document, PT Launch Lab brand, Praxel logo.
- Correcting the "guaranteed interview" claim in partners' existing live material. Page 8 states
  the boundary; retiring the old assets is separate work.
- Any change to the course, the platform, or the practical requirements themselves.
