// Renders the Google Business Profile cover photo.
//
//   node --use-system-ca scripts/gbp-cover.mjs
//
// Builds an HTML layout using the real brand assets (logo-hover.svg, NCFE mark)
// and brand fonts, screenshots it with headless Chrome at 1920x1080, then writes
// public/gbp/cover.jpg.
//
// 1920x1080 because GBP covers are 16:9 with a 1024x576 minimum — rendering well
// above the floor keeps it sharp on high-density screens. Content is kept inside
// a generous margin since Google crops covers differently across Search, Maps
// and mobile.

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT_DIR = "public/gbp";
const OUT = path.join(OUT_DIR, "cover.jpg");
const W = 1920;
const H = 1080;

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const logoSvg = readFileSync("public/logo-hover.svg", "utf8")
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/<svg /, '<svg preserveAspectRatio="xMinYMid meet" ');

const ncfe = readFileSync("public/logos/ncfe.png").toString("base64");

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; }
  body {
    background:
      radial-gradient(120% 90% at 18% 12%, #14284b 0%, #0b1730 42%, #070D1B 100%);
    font-family:'Poppins',sans-serif;
    color:#fff;
    position:relative;
    overflow:hidden;
  }
  /* single restrained gold diagonal, bottom-right, low opacity */
  .accent {
    position:absolute; right:-260px; bottom:-420px;
    width:1100px; height:1100px;
    border:2px solid rgba(245,197,24,.30);
    transform:rotate(28deg);
  }
  .accent2 {
    position:absolute; right:-160px; bottom:-380px;
    width:1100px; height:1100px;
    border:2px solid rgba(245,197,24,.14);
    transform:rotate(28deg);
  }
  .wrap { position:relative; height:100%; padding:96px 110px; display:flex; flex-direction:column; }
  .logo { height:132px; }
  .logo svg { height:132px; width:auto; display:block; }
  .mid { margin-top:auto; margin-bottom:auto; }
  h1 {
    font-family:'Barlow Condensed',sans-serif;
    font-weight:700;
    font-size:132px;
    line-height:.94;
    letter-spacing:.01em;
    text-transform:uppercase;
  }
  h1 .gold { color:#F5C518; }
  .rule { width:132px; height:5px; background:#F5C518; margin:36px 0 30px; }
  p.sub {
    font-size:31px; font-weight:400; line-height:1.5;
    color:rgba(255,255,255,.82); max-width:1080px;
  }
  .foot { display:flex; align-items:center; gap:34px; }
  /* NCFE supply the mark in dark ink, so it needs a light chip to read on navy */
  .ncfe { background:#fff; border-radius:8px; padding:12px 20px; display:flex; align-items:center; }
  .ncfe img { height:46px; width:auto; display:block; }
  .divider { width:1px; height:46px; background:rgba(255,255,255,.22); }
  .marks { font-size:23px; letter-spacing:.16em; text-transform:uppercase;
           color:rgba(255,255,255,.62); font-weight:500; }
  .site { margin-left:auto; font-family:'Barlow Condensed',sans-serif;
          font-weight:600; font-size:36px; letter-spacing:.06em;
          color:#F5C518; text-transform:uppercase; }
</style></head>
<body>
  <div class="accent"></div>
  <div class="accent2"></div>
  <div class="wrap">
    <div class="logo">${logoSvg}</div>
    <div class="mid">
      <h1>Qualify. Coach.<br><span class="gold">Change lives.</span></h1>
      <div class="rule"></div>
      <p class="sub">NCFE and Ofqual-regulated personal trainer qualifications,<br>studied online from anywhere in the UK.</p>
    </div>
    <div class="foot">
      <div class="ncfe"><img src="data:image/png;base64,${ncfe}" alt="NCFE"></div>
      <div class="divider"></div>
      <div class="marks">Ofqual regulated &nbsp;·&nbsp; CIMSPA recognised</div>
      <div class="site">ptlaunchlab.co.uk</div>
    </div>
  </div>
</body></html>`;

const tmpHtml = path.join(os.tmpdir(), "ptll-gbp-cover.html");
const tmpPng = path.join(os.tmpdir(), "ptll-gbp-cover.png");
writeFileSync(tmpHtml, html, "utf8");

execFileSync(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  `--window-size=${W},${H}`,
  "--virtual-time-budget=12000",
  `--screenshot=${tmpPng}`,
  `file:///${tmpHtml.replace(/\\/g, "/")}`,
], { stdio: "pipe" });

await sharp(tmpPng).jpeg({ quality: 92, mozjpeg: true }).toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`cover: ${OUT} — ${meta.width}x${meta.height}`);
unlinkSync(tmpPng);
