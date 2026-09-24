# Reddit Pain Miner — PT Launch Lab

A three-step content workflow: mine real pain points from Reddit, turn them into a fast "yap" reel, and capture leads with a comment-keyword CTA.

1. **Mine**: Claude reads the biggest subreddit in the niche and pulls out recurring problems in the audience's own words.
2. **Script**: those pains become a 40-second rhythmic reel.
3. **Capture**: the reel ends with "Comment X and I'll DM you…" to generate leads.

## Where to run it

Use the **Claude in Chrome** browser extension on a laptop. Open the subreddit in a tab first, then paste the prompt. Claude can read the live page, including comments.

Cloud sessions can't read Reddit reliably because Reddit blocks most server traffic. Claude with web search works as a fallback, but it only sees snippets of posts.

**Subreddits to mine:** r/personaltraining (primary), r/Fitness. Check that UK-specific PT subreddits exist and are active before using them. Swap the subreddit name in the prompt for each run.

---

## Step 1 — Pain Miner prompt

```
You are a market researcher for PT Launch Lab, a UK business that helps people qualify as personal trainers and land their first clients or gym role.

I have r/personaltraining open in this tab. Do the following:

1. Sort by Top → Past Year, then Top → All Time. Open the 25–30 highest-engagement posts where the poster is an aspiring PT, a newly qualified PT, or a PT in their first 2 years. Read the post AND the top comments.
2. Also search the subreddit for: "first clients", "no clients", "quit", "burnout", "course worth it", "Level 3", "gym rent", "self-employed", "PT course", "career change".
3. Extract every distinct pain point, fear, frustration, or desire. For each one, give me:
   - The pain in one plain sentence
   - 2–3 verbatim quotes (exact wording, with the post link)
   - How often it came up (count of posts/comments)
   - Emotional intensity 1–5 (anger, shame, fear, desperation = high)
   - Whether PT Launch Lab can credibly solve it (yes / partly / no)
4. Rank the top 10 pains by frequency × intensity.
5. Pull out a "language bank": 20 exact phrases, slang, and metaphors they use to describe their situation. I'll use these word-for-word in content.
6. List the top 5 myths or bad advice you see repeated, which I can push back on in content.
7. Finish with 5 hook ideas for Reels/TikTok, each built from a real pain and phrased the way the subreddit talks.

Rules: only use what's actually on the page. Don't invent quotes or stats. If a pain appears only once, flag it as "weak signal". Output as clean headed sections I can copy into a doc.
```

## Step 2 — Reel script prompt

Paste into the same chat after Step 1 finishes. Replace the bracketed lead magnet (for example, the quiz or partner guide) before running.

```
Using the #1 pain and the language bank, write a 40-second talking-head "yap" script (rhythmic, punchy, almost rap cadence) using this structure:

0–3s   — Hook naming the pain.
3–6s   — Show proof (visual or audio).
6–10s  — Re-hook with a new benefit.
10–12s — Preview the 3-step framework.
12–20s — Step 1 (leave an open loop).
20–28s — Step 2 (build curiosity).
28–36s — Step 3 (deliver the payoff).
36–40s — Pattern interrupt (screenshot or visual) + CTA: "Comment LAUNCH and I'll send you [lead magnet]."

Give me 3 versions, on-screen caption text for each beat, and the post caption.
```

## Step 3 — Capture

- Set up the comment-keyword auto-DM (for example, via ManyChat) for the CTA word before posting.
- Log each run's top pains and language bank so later reels, ads and emails can reuse them.
