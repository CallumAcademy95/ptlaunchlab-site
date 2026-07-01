# Meta Custom Audiences — WS1 blockers #1 & #2

Get the **past-customer list** and the **full email list** onto Meta so we can
retarget them and build a value-based 1% lookalike of people who actually paid.
Tool: [`../scripts/meta-audiences.mjs`](../scripts/meta-audiences.mjs).

> **Windows TLS:** prefix every command with `node --use-system-ca` (Node fetch
> fails cert validation on this network otherwise).

Correct ad account = **`act_37869536`** (holds the PTLL pixel + real RT audiences).
NOT `act_3635881119973565` (that's the Ultimate Shred gym account).

---

## Two upload routes

**A — Manual (simplest, highest match, no token).** Generate a normalised-raw
CSV, then in Ads Manager → **Audiences → Create Audience → Custom Audience →
Customer list**, upload it. Meta does the canonical hashing + matching.

**B — API push (automated).** Add `--push --name="…" --account=act_37869536
--token=EAA…`. Values are hashed client-side before they leave the machine.
Needs a token with `ads_management` (use a System User token for reuse — the
Vercel `META_CAPI_ACCESS_TOKEN` is CAPI-only and won't work here).

---

## Blocker #1 — Past customers (enrolled learners)

Best source is the **Stripe API** (everyone who paid, with name + phone + country
→ high match rate). The old `ptll-buyers-stripe-2026-05-29.csv` is email-only and
stale — regenerate:

```bash
STRIPE_SECRET_KEY=sk_live_... node --use-system-ca scripts/meta-audiences.mjs stripe \
  --out=meta-audiences/ptll-buyers.csv
# then upload ptll-buyers.csv via route A, OR add:
#   --push --name="PTLL · Buyers (all-time)" --account=act_37869536 --token=EAA...
```

No Stripe key to hand? Export customers from the Stripe Dashboard
(Customers → Export) and run `file` on it instead:

```bash
node --use-system-ca scripts/meta-audiences.mjs file <stripe-export>.csv \
  --out=meta-audiences/ptll-buyers.csv
```

→ In Ads Manager, build a **1% value-based Lookalike** off this audience. A
lookalike of real payers beats any engagement lookalike.

## Blocker #2 — Full email list

Pull straight from MailerLite (leads, quiz, prospectus, podcast, live):

```bash
MAILERLITE_TOKEN=... node --use-system-ca scripts/meta-audiences.mjs mailerlite \
  --out=meta-audiences/ptll-email-list.csv
# optional single group:  --group=<GROUP_ID>   (Live Sessions = 191617669489756012)
# optional direct push:   --push --name="PTLL · Email list" --account=act_37869536 --token=EAA...
```

Unsubscribed / bounced / junk subscribers are skipped automatically.

---

## Command reference

| Command | What it does |
|---|---|
| `file <path.csv>` | Normalise any export (auto-detects email/phone/name/country columns) |
| `mailerlite [--group=ID]` | Pull subscribers from the MailerLite Connect API |
| `stripe` | Pull paying customers from the Stripe API |
| `--hash` | Emit SHA-256 hashed values (default is normalised raw for route A) |
| `--out=<path>` | Output path (default `meta-audiences/ptll-<cmd>-<date>.csv`) |
| `--push --name= --account= --token=` | Create (idempotent by name) + fill the audience via API |

Verified working on the existing buyers export (16 contacts → clean Meta schema).
