// Shared HTML -> JPEG renderer for brand graphics.
//
// Headless Chrome screenshots the markup, sharp compresses it. Used by
// gbp-cover.mjs and gbp-partnership.mjs. Chrome is used rather than sharp's SVG
// path because librsvg cannot see Barlow Condensed or Poppins on this machine —
// Chrome fetches them from Google Fonts and lays out text properly.

import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

export async function renderHtml(html, { width, height, out, quality = 92, name = "render" }) {
  const dir = path.dirname(out);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const tmpHtml = path.join(os.tmpdir(), `ptll-${name}.html`);
  const tmpPng = path.join(os.tmpdir(), `ptll-${name}.png`);
  writeFileSync(tmpHtml, html, "utf8");

  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      // Give webfonts time to load and paint before the shot is taken.
      "--virtual-time-budget=12000",
      `--screenshot=${tmpPng}`,
      `file:///${tmpHtml.replace(/\\/g, "/")}`,
    ],
    { stdio: "pipe" },
  );

  await sharp(tmpPng).jpeg({ quality, mozjpeg: true }).toFile(out);
  const meta = await sharp(out).metadata();
  unlinkSync(tmpPng);
  return meta;
}

export const FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">`;

export const BRAND = {
  navy: "#070D1B",
  card: "#102342",
  gold: "#F5C518",
};
