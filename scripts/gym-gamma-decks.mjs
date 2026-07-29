/**
 * Branded Gamma decks for partner gyms.
 *
 *   node --use-system-ca scripts/gym-gamma-decks.mjs ebor     # one gym
 *   node --use-system-ca scripts/gym-gamma-decks.mjs          # all eight
 *
 * Same ten messages as the TV slides, built as a 16:9 Gamma presentation so a
 * gym can export it to video or edit it themselves. The JPEG slides cover the
 * looping screen; this covers everything that needs motion or editing.
 *
 * textMode 'preserve' matters: the copy below is deliberate and white-label —
 * it's the gym's academy, and letting Gamma rewrite it reintroduces the exact
 * generic language the playbook exists to avoid. cardSplit 'inputTextBreaks'
 * makes `---` the card boundary so one message stays on one card.
 *
 * Gamma themes are fixed palettes, so exact brand hex isn't possible over the
 * API. Each gym is mapped to its nearest standard theme. For exact colours,
 * build a custom theme in the Gamma UI and put its id in THEME below.
 *
 * Writes the resulting URLs to scripts/gym-gamma-decks.json.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const KEY = (env.match(/^GAMMA_API_KEY=(.*)$/m) || [])[1]?.trim();
if (!KEY) throw new Error("GAMMA_API_KEY missing from .env.local");

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const API = "https://public-api.gamma.app/v1.0/generations";
const OUT = new URL("./gym-gamma-decks.json", import.meta.url);

/** Nearest standard theme per gym. Swap for a custom theme id for exact brand. */
const THEME = {
  "6fit": "atacama",         // red on black — nearest high-contrast dark
  "ebor": "ash",             // mono, high contrast. Matches their black/white exactly.
  "gym-n-go": "blue-steel",  // dark navy/blue
  "ironwolf": "canaveral",   // dark + orange. Closest match of the lot.
  "mof": "alien",            // neon green
  "muscle-bound": "atacama", // red on black
  "superflex": "alien",      // green
  "xcelerate": "aurora",     // dark gradient, fuchsia/pink
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The deck copy. Nothing here names PT Launch Lab — it's the gym's academy,
 * and a member watching this on a screen should hear their own gym talking.
 */
function deckFor(brand) {
  const gym = brand.gymName;
  const url = `ptlaunchlab.co.uk${brand.canonicalPath}`;

  return [
    `# Become a qualified Personal Trainer\n\n### ${gym} Personal Training Academy\n\nRight here, in this gym. Around the job you already have.`,

    `# Some of you already coach\n\nYou spot for people. You fix someone's form. You get asked what to eat.\n\nThat's the part that can't be taught.`,

    `# Study around your job\n\nOnline and flexible, built for people already working full-time.\n\nYou don't quit anything to start.`,

    `# You don't need to be the fittest person in here\n\nGreat coaches aren't remembered for how they looked.\n\nThey're remembered for who they helped.`,

    `# You're not too old\n\nMost people who start are changing career in their thirties and forties.\n\nLife experience counts for a lot in this job.`,

    `# What it costs\n\n## £${brand.fullPrice} — or £${brand.depositPrice} to start\n\nPayment plans available. Ask at reception and we'll go through the options properly.\n\nNo pressure.`,

    `# The first step is just asking\n\nAny member of the team can tell you how it works.\n\nIt costs nothing to have the conversation.`,

    `# They started as members\n\nThe best Personal Trainers don't start qualified.\n\nThey start exactly where you're standing.`,

    `# What if Monday felt different?\n\nThe best 45 minutes of your day is the bit you squeeze in.\n\nIt doesn't have to be.`,

    `# Find out\n\n### ${url}\n\nTwo minutes to see whether it's right for you.${brand.promoCode ? `\n\nMembers' code: **${brand.promoCode}**` : ""}`,
  ].join("\n\n---\n\n");
}

async function generate(slug, brand) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "X-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      inputText: deckFor(brand),
      format: "presentation",
      // Use the copy as written. The whole point is that it's already right.
      textMode: "preserve",
      cardSplit: "inputTextBreaks",
      themeId: THEME[slug] ?? "atacama",
      cardOptions: { dimensions: "16x9" },
      textOptions: { language: "en-gb" },
      imageOptions: { source: "aiGenerated", model: "imagen-4-pro", style: "photorealistic gym interior, natural light, real people training, no text" },
      additionalInstructions:
        `This is ${brand.gymName}'s own in-gym Personal Training academy. ` +
        `Never mention any external training provider or education company. ` +
        `Images should look like a real UK gym, not stock fitness photography.`,
      sharingOptions: { workspaceAccess: "view", externalAccess: "view" },
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body.generationId;
}

async function poll(id) {
  // Decks take roughly a minute; a 10-minute ceiling is generous enough that
  // hitting it means something is actually wrong.
  for (let i = 0; i < 100; i++) {
    const r = await fetch(`${API}/${id}`, { headers: { "X-API-KEY": KEY } });
    const j = await r.json();
    if (j.status === "completed") return j;
    if (j.status === "failed") throw new Error(`generation failed: ${JSON.stringify(j).slice(0, 200)}`);
    await wait(6000);
  }
  throw new Error("timed out");
}

const only = process.argv[2];
const targets = Object.entries(BRANDS).filter(([slug]) => !only || slug === only);
if (!targets.length) {
  console.error(`No gym "${only}". Options: ${Object.keys(BRANDS).join(", ")}`);
  process.exit(1);
}

const saved = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

// Sequential, not parallel: these cost credits, and a failure halfway through a
// parallel run leaves you guessing which gyms actually got made.
for (const [slug, brand] of targets) {
  process.stdout.write(`${brand.gymName.padEnd(22)} theme=${(THEME[slug] ?? "atacama").padEnd(12)} `);
  try {
    const id = await generate(slug, brand);
    const done = await poll(id);
    saved[slug] = { gymName: brand.gymName, theme: THEME[slug], gammaUrl: done.gammaUrl, gammaId: done.gammaId };
    writeFileSync(OUT, JSON.stringify(saved, null, 2) + "\n");
    console.log(`${done.gammaUrl}   (${done.credits?.remaining ?? "?"} credits left)`);
  } catch (err) {
    console.log(`FAILED — ${err.message}`);
  }
}

console.log(`\nURLs in scripts/gym-gamma-decks.json`);
