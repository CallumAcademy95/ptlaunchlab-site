// Screenshot a page at desktop and mobile widths, or compare a page against
// earlier shots pixel by pixel.
//   node scripts/compare-gym-page.mjs shoot <baseUrl> <path> <outDir>
//   node scripts/compare-gym-page.mjs diff  <dirA> <dirB>
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
const [mode, a, b, c] = process.argv.slice(2);
const SIZES = [[1440, 900], [390, 844]];
if (mode === "shoot") {
  mkdirSync(c, { recursive: true });
  const br = await chromium.launch();
  for (const [w, h] of SIZES) {
    const p = await br.newPage({ viewport: { width: w, height: h } });
    await p.goto(a + b, { waitUntil: "networkidle" });
    await p.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
    await p.screenshot({ path: `${c}/${w}.png`, fullPage: true });
    await p.close();
  }
  await br.close();
} else if (mode === "diff") {
  let bad = 0;
  for (const [w] of SIZES) {
    const [x, y] = await Promise.all([a, b].map((d) => sharp(`${d}/${w}.png`).raw().toBuffer({ resolveWithObject: true })));
    const same = x.info.width === y.info.width && x.info.height === y.info.height && x.data.equals(y.data);
    console.log(`${w}px: ${same ? "IDENTICAL" : `DIFFERENT (${x.info.width}x${x.info.height} vs ${y.info.width}x${y.info.height})`}`);
    if (!same) bad++;
  }
  process.exit(bad ? 1 : 0);
}
