# PT Launch Lab — Career Path Quiz

An interactive lead qualification funnel built into the Next.js site.
Live at: `/quiz`

---

## How It Works

1. **Intro screen** — Branded welcome + "Find My Path" CTA.
2. **5 questions** — One per screen, click-to-select, progress bar, back/forward navigation.
3. **Email capture** — Name + email required before results are revealed.
4. **Scoring** — Each answer adds weighted points to one or more result buckets.
5. **Result screen** — Personalised path, description, recommended next step, and two CTAs (book a call + download guide).
6. **Lead saved** — Submission saved to `data/leads.json` via a Next.js API route.

---

## Scoring System

Each answer option in `quiz-config.ts` carries a `scores` object:

```ts
{ label: 'Online coach', scores: { online: 3 } }
{ label: 'Fat loss focused', scores: { online: 1, hybrid: 1 } }
```

All answer scores are summed across the 5 questions. The result with the
highest total wins. Ties are broken by priority order:
`alreadyQualified > hybrid > online > onFloor`

### Result Buckets

| Key                | Path                          |
|--------------------|-------------------------------|
| `onFloor`          | On-Floor PT Path              |
| `online`           | Online Coach Path             |
| `hybrid`           | Hybrid Coach Path             |
| `alreadyQualified` | Already Qualified — Needs Direction |

---

## File Structure

```
app/
  quiz/
    page.tsx          → Next.js page (metadata wrapper)
    QuizApp.tsx       → Main quiz client component (state + screens)
    ResultScreen.tsx  → Result display component
    quiz-config.ts    → Questions, scoring, result type definitions ← edit here

  api/
    quiz-submission/
      route.ts        → POST handler: validates + saves lead to data/leads.json

data/
  leads.json          → Append-only flat file of all quiz submissions

QUIZ_README.md        → This file
```

---

## Customising Questions

Open `app/quiz/quiz-config.ts` and edit the `questions` array.

Each question has:
- `id` — number (cosmetic, used for display)
- `question` — the question text
- `options` — array of `{ label: string; scores: Partial<Record<ResultKey, number>> }`

**To add a question:** append a new object to the `questions` array.
**To change scoring:** adjust the numbers in the `scores` object of each option.
**To add a result type:** add a new key to `ResultKey`, update the `results` record, and update the scoring in `calculateResult`.

---

## Customising Results

Edit the `results` record in `quiz-config.ts`. Each result has:

| Field              | Description                                        |
|--------------------|----------------------------------------------------|
| `key`              | Internal identifier                                |
| `title`            | Main heading shown on result screen                |
| `badge`            | Pill text (e.g. "Online Coaching Path")            |
| `tagline`          | One-line strapline under the title                 |
| `description`      | 2–3 sentence explanation                           |
| `nextStep`         | Actionable recommendation shown in highlighted box |
| `guideTitle`       | Name of the free resource offered                  |
| `guideDescription` | Short description of the guide                     |

---

## Lead Data (`data/leads.json`)

Each saved lead looks like:

```json
{
  "id": "uuid",
  "timestamp": "2026-03-12T10:00:00.000Z",
  "name": "Jamie",
  "email": "jamie@email.com",
  "result": "online",
  "answers": [
    { "label": "Online coach" },
    { "label": "Fat loss focused" },
    { "label": "Flexibility" },
    { "label": "Want to move my coaching online" },
    { "label": "Unsure I can make money from this" }
  ],
  "source": "quiz-funnel",
  "status": "new",
  "followedUp": false,
  "tags": ["quiz-result:online"]
}
```

---

## Connecting to PTLL-OS CRM

The API route (`app/api/quiz-submission/route.ts`) is structured for easy CRM
integration. To connect to a real CRM:

1. Replace or augment the `fs.writeFileSync` call with a CRM API request.
2. The `Lead` interface already maps to common CRM fields: `name`, `email`,
   `source`, `status`, `followedUp`, `tags`.
3. The `tags` array (e.g. `["quiz-result:online"]`) allows automatic
   segmentation in most CRMs.

Example CRM integration point:

```ts
// After building newLead:
await fetch('https://your-crm.com/api/contacts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.CRM_API_KEY}` },
  body: JSON.stringify(newLead),
});
```

---

## Local Development

```bash
cd ptlaunchlab-site
npm run dev
# Visit http://localhost:3000/quiz
```

The quiz saves leads to `data/leads.json` during local development.

> **Note:** On Vercel (production), the filesystem is read-only. Before
> deploying, connect a real database or CRM. Options: PlanetScale, Supabase,
> Airtable, or a webhook to your CRM.
