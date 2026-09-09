# Partner Embed Widget — Design

**Date:** 2026-09-09
**Status:** Approved, in implementation

## Problem

Ebor Fitness asked to embed their partner landing page (`/ebor-fitness`) into
their Wix site. It fails, and it fails for a reason only we can lift: every
route on the site ships `X-Frame-Options: DENY` and CSP `frame-ancestors
'none'`, set in `next.config.ts` against `source: "/(.*)"`.

Allowing the full landing page to be framed would be the wrong fix:

- **It does not achieve the partner's goal.** Iframed content is not credited
  to the parent page, so the partner's own domain ranks for nothing extra.
- **It breaks tracking.** Meta Pixel and GA4 cannot use first-party storage in
  a cross-origin iframe on Safari or Firefox. Partner leads would go dark or
  misattribute.
- **It looks broken on mobile.** Wix iframes are fixed-height and cannot
  auto-resize to cross-origin content, so a full landing page produces a page
  scrolling inside a page. Most gym traffic is mobile.
- **It does not scale.** Allowlisting each partner's domain means a code change
  and a deploy per partner, forever.

There is also a gap behind the request: the 45-file `partner-playbook/` covers
posters, emails, social and objection scripts, and says nothing at all about
putting the academy on the partner's own website.

## Solution

A purpose-built `/embed/[gym]` route: a small, fixed-height promo banner that
partners paste into any site builder as one line of HTML. Framing is allowed on
that path only.

### Routes

```
app/embed/[gym]/route.ts     the card itself (what gets iframed)
app/lib/gyms/<slug>.ts       one config per partner (extracted)
app/lib/gyms/index.ts        GYMS registry: slug -> GymConfig
```

**A route handler, not a page.** `app/layout.tsx` loads CookieYes, GA4,
Microsoft Clarity and the Meta Pixel on every page it wraps. A `page.tsx` under
it would fire our pixel from inside the partner's site and drop a consent banner
into their page — handing them a cookie-consent obligation they never agreed to.
A route handler bypasses the root layout, so the card ships zero JavaScript and
sets zero cookies. This was found during implementation; the design intent
("no tracking dependency") is unchanged.

`generateStaticParams` over the registry. Unknown slug -> `notFound()`.
`_gym-template` is excluded (placeholder data). `demo-academy` is included so
the embed can be demonstrated to prospective partners.

### Header carve-out

| Path | X-Frame-Options | frame-ancestors |
|---|---|---|
| `/((?!embed/).*)` | `DENY` | `'none'` |
| `/embed/:path*` | *omitted* | `https:` |

Two deliberate choices:

- **`X-Frame-Options` is omitted, not relaxed.** It has no multi-origin form —
  `ALLOW-FROM` is dead in every current browser. Leaving `DENY` in place would
  override `frame-ancestors` in some engines and the embed would keep failing.
- **A negative lookahead, not a second overriding entry.** Header-merge
  precedence is not something to depend on for a security header. Exactly one
  rule matches any given path.

`frame-ancestors https:` permits any HTTPS site to frame `/embed/*`. That is
the point — no allowlist, ever.

In **development only**, the value additionally permits `http://localhost:*` and
`http://127.0.0.1:*`. Without it the browser-level framing test could not run at
all — an http origin is rejected by `https:` — and the suite would be reduced to
asserting on a header string, which is exactly the failure mode that test exists
to catch. `tests/embedHeaders.test.mts` pins that the production value stays
exactly `frame-ancestors https:`. It is safe on this route specifically because
the route has no form, no cookie, no auth, no PII and one outbound link. There
is nothing on it to clickjack. Every other path keeps `DENY`.

The embed route also gets a **stripped CSP**: no pixel, no GA4, no CookieYes, no
Calendly. Just `'self'` plus `img-src https:` for the logo. Nothing to consent
to, so no cookie-banner obligation lands on the partner's page.

### The card

Compact banner: logo, gym name, headline, one proof line, one CTA. Server
rendered, zero JavaScript, colours taken from the existing `GymConfig` so each
card inherits its gym's branding automatically.

CTA opens the partner landing page **top-level in a new tab**
(`target="_blank"`), so the partner does not lose the visitor from their own
site.

**Sizing.** Wix iframes are fixed-height and cannot auto-resize cross-origin, so
the card must survive one height at every width. It fills `height: 100%` with
vertically centred content, and the snippet specifies **220px** — sized so the
headline can wrap to two lines at 320px without clipping.

```html
<iframe src="https://ptlaunchlab.co.uk/embed/ebor-fitness"
        width="100%" height="220" frameborder="0" scrolling="no"
        title="Ebor Fitness PT Academy"></iframe>
```

### Attribution

The CTA carries `?utm_source=partner-embed&utm_medium=embed&utm_campaign=<slug>`.
`app/lib/gtag.ts` already stores first/last touch and stamps it onto every GA4
event, so per-partner embed performance is measurable with **no tracking code
inside the iframe at all**.

Commission attribution is untouched: it runs off `gymSlug` on the enrol page,
which the visitor reaches through the normal landing page.

### Registry extraction

Ten mechanical moves: the config literal out of `page.tsx`, into
`app/lib/gyms/<slug>.ts`, page imports it. No values change.

Verification is a **diff of the config object literal** before and after the
move — byte-identical modulo the declaration line — plus a successful build.
Proving the data is unchanged is stronger than inferring it from rendered output.

Two naming traps are encoded as tests rather than remembered:

- route slug != gym slug (`/ebor-fitness` -> `"ebor"`,
  `/hitio-orpington-academy` -> `"hitio-orpington"`)
- `canonicalPath` must match the folder name

## Tests

- **`tests/gymRegistry.test.mts`** (7) — every partner folder has a registry
  entry and vice versa; `canonicalPath` matches the folder; the placeholder
  template is not a partner; unknown slugs resolve to nothing; slugs are
  url-safe.
- **`tests/embedHeaders.test.mts`** (6) — `/embed/*` carries no
  X-Frame-Options; production `frame-ancestors` is exactly `https:` with no
  localhost leak; the embed CSP runs no scripts; no other route was made
  framable.
- **`e2e/embed-framing.spec.ts`** (5) — drives a real cross-origin iframe: the
  card renders and shows its content, the full landing page stays blocked, the
  CTA carries its UTM and opens top-level, the card ships no script and sets no
  cookie, an unknown gym 404s.

All three suites were mutation-tested — a gym removed from the registry, a
broken `canonicalPath`, and `X-Frame-Options` reinstated on `/embed/*` each
fail the intended assertion and only that one.

## Deliverables

- `app/embed/[gym]/page.tsx` + `app/lib/gyms/` registry
- `next.config.ts` header carve-out
- `partner-playbook/website-embed.md` — snippet plus click-by-click for Wix,
  Squarespace and WordPress
- Draft reply to Ebor Fitness

## Out of scope

- Surfacing the snippet in the partner portal (5 of 9 partners have never
  signed in; email does the work)
- An internal all-partners preview page
