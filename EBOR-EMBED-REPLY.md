# Draft reply — Ebor Fitness / Nat (embedding the academy page)

**Context:** Nat emailed Miles asking to embed `/ebor-fitness` into their Wix
site and reported that Wix would not allow it. She was right — the site blocked
framing on every route. Rather than open the full landing page up, we built a
purpose-made banner at `/embed/ebor-fitness`.

**Before sending:** this depends on the embed work being deployed to production.
Check `https://ptlaunchlab.co.uk/embed/ebor-fitness` loads first.

---

Subject: **Re: Website Issue — sorted, here's your snippet**

Hi Nat,

Good spot, and you were right — that was our end, not Wix. Our pages were set
to block being embedded anywhere, so nothing you did in the editor was ever
going to work.

Rather than just switch that off, we've built you something better: a PT Academy
banner made specifically to sit inside your site. It uses your logo and your
colours, and the button opens your academy page in a new tab so you don't lose
anyone off your own site.

**No, you don't need to design a full page.** It's one line of code and about
five minutes.

Here it is:

```html
<iframe src="https://ptlaunchlab.co.uk/embed/ebor-fitness"
        width="100%" height="220" frameborder="0" scrolling="no"
        title="Ebor Fitness PT Academy"></iframe>
```

**In Wix:**

1. Open the Wix Editor on the page you want it on
2. **Add Elements** (the + on the left) → **Embed Code** → **Embed HTML**
3. Click the box that appears, then **Enter Code**
4. Paste the code above, hit **Apply**
5. Drag it to full width and pull the bottom edge down until the whole banner
   shows (about 220px)
6. **Publish**

Keep the height at 220 — it's built to fit that on both desktop and mobile, and
making it shorter will clip the button on phones.

**Where I'd put it:** homepage, just under your main hero image. That's where
it'll get seen by every member. A line of your own above it helps, something
like *"Thinking about becoming a personal trainer? We run a PT Academy right
here at Ebor."*

Two things worth knowing:

- It adds **no cookies and no tracking** to your site, so it doesn't change
  anything for your cookie policy.
- If the wording ever needs changing, tell us — we update it our end and it
  changes on your site automatically. You won't need to touch it again.

I've attached the full instructions in case you'd rather someone else on the
team does it, and they cover Squarespace and WordPress too if you ever move.

If it doesn't behave, send me a screenshot and the page link rather than
wrestling with it.

Cheers,
Miles

---

**Attach:** `partner-playbook/website-embed.md`

**Also worth doing:** the other eight partners have never been told they can do
this — there was nothing in the playbook about their own websites at all. Same
snippet, different slug. Table of all nine is in the playbook file.
