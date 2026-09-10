# Put Your PT Academy On Your Own Website

**Who this is for:** any partner gym with its own website — Wix, Squarespace,
WordPress, Shopify, Webflow, or anything else that lets you add a block of HTML.

**What it does:** adds a branded PT Academy banner to your site. It carries your
logo and your colours, and the button opens your academy page in a new tab, so
you never lose the visitor from your own site.

**How long it takes:** about five minutes. No developer needed.

---

## Your snippet

Copy this exactly. Replace nothing except what your account manager has told
you — the address below is already yours.

```html
<iframe src="https://ptlaunchlab.co.uk/embed/YOUR-GYM-SLUG"
        width="100%" height="220" frameborder="0" scrolling="no"
        title="PT Academy"></iframe>
```

| Gym | Use this address |
|---|---|
| 6fit Gyms | `https://ptlaunchlab.co.uk/embed/6fit-academy` |
| Ebor Fitness | `https://ptlaunchlab.co.uk/embed/ebor-fitness` |
| Gym N Go | `https://ptlaunchlab.co.uk/embed/gym-n-go-academy` |
| HITIO Gym Orpington | `https://ptlaunchlab.co.uk/embed/hitio-orpington-academy` |
| Iron Wolf Gym | `https://ptlaunchlab.co.uk/embed/ironwolf-gym` |
| Ministry of Fitness | `https://ptlaunchlab.co.uk/embed/mof-gym` |
| Musclebound Gym | `https://ptlaunchlab.co.uk/embed/muscle-bound-academy` |
| Superflex | `https://ptlaunchlab.co.uk/embed/superflex-academy` |
| Xcelerate | `https://ptlaunchlab.co.uk/embed/xcelerate-academy` |

**Keep `height="220"`.** The banner is built to fit that height on every screen
size from a narrow phone to a wide desktop. Making it shorter will cut the
button off on mobile.

---

## Wix

1. Open your site in the **Wix Editor**.
2. Go to the page where you want the banner — most gyms use the homepage, below
   the hero, or a **Personal Training** page.
3. Click **Add Elements** (the **+** on the left).
4. Choose **Embed Code** → **Embed HTML**. A box labelled *HTML iframe* appears
   on the page.
5. Click the box, then click **Enter Code**.
6. Paste your snippet from above. Click **Apply**.
7. Drag the box to full width and drag its bottom edge until the whole banner
   shows — roughly 220px tall.
8. Click **Publish**.

**If you have Wix Studio** the element is called **Embed** → **Embed HTML**;
everything else is the same.

---

## Squarespace

1. Edit the page and click an insert point (**+**).
2. Choose **Code**.
3. Delete the placeholder content in the box.
4. Paste your snippet. Leave the mode set to **HTML**.
5. Untick **Display Source** if it is ticked.
6. Click **Save**.

---

## WordPress

**Block editor (Gutenberg):**

1. Edit the page, click **+** to add a block.
2. Search for **Custom HTML** and select it.
3. Paste your snippet.
4. **Update** the page.

**Classic editor:** switch from *Visual* to *Text*, paste the snippet where you
want it, and update.

**If your theme strips the code**, use a plugin that permits raw HTML, or ask
whoever maintains your site to paste it into the page template.

---

## Where to put it

In order of how well they work for us so far:

1. **Homepage, below the hero.** Highest traffic, seen by every member.
2. **A "Careers" or "Work With Us" page.** Catches people already thinking about
   working in fitness.
3. **Your Personal Training page.** People reading about PT sessions are one
   step from wondering about becoming one.

Add a short line of your own copy above it. Something like:

> **Thinking about becoming a personal trainer?** We run a PT Academy here at
> the gym — qualify with us, train on our floor, and interview with us at the end.

---

## Troubleshooting

**The box is empty / shows nothing.**
Check the address is exactly right, including `https://` and no trailing slash.
Some builders quietly strip the code on save — reopen the editor and confirm
your snippet is still there.

**The button is cut off at the bottom.**
The container is too short. Set the height to 220px and make sure the embed
element itself is at least that tall — some builders have both an inner height
and an outer box height.

**It looks squashed on mobile.**
Make sure `width="100%"` is present, and that you have not set a fixed pixel
width on the containing section.

**It still does not work.**
Send us a link to the page and a screenshot. Do not spend an afternoon on it.

---

## Common questions

**Will this slow my site down?**
No. It is a single static banner with no JavaScript, no tracking scripts and no
external fonts.

**Does it set cookies or need a consent banner?**
No. The banner sets no cookies and runs no analytics. It adds nothing to your
cookie policy obligations.

**Can I change the wording or the colours?**
The colours already come from your brand settings. If the wording is wrong for
your gym, tell us and we will change it centrally — it updates on your site
straight away without you touching anything.

**Can I just link to the page instead?**
Yes, and that works well too. Link to your academy page and use your own button.
The embed exists so that you do not have to design anything.

**Will this help my own website's Google ranking?**
No — and neither would embedding the full page, because Google credits that
content to our domain, not yours. If you want your own site to rank for PT
courses in your area, write a short page of your own about the academy and link
to it. Ask us and we will help with the copy.
