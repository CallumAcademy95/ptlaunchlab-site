// scripts/lib/ad-markup.mjs
/**
 * The shared layout for every partner graphic.
 *
 * Lifted out of gym-ad-creatives.mjs so the monthly promo renderer paints
 * identical pixels rather than a second, drifting copy of the same CSS. Takes
 * an already-resolved logo URL rather than reading the disk, so it is a pure
 * function of its arguments and can be tested without any real assets.
 */
import { accentFor, contentBox, logoTreatmentFor } from "./ad-guards.mjs";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

export function adMarkup(brand, text, { w, h, photo, logoUrl }) {
  const accent = accentFor(brand);
  const bg = brand.heroBg || "#000000";
  const box = contentBox(w, h);
  const plate = logoTreatmentFor(brand) === "plate";
  const logo = logoUrl;
  const tall = h === 1920;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:${bg};font-family:Poppins,sans-serif;color:#fff;
  overflow:hidden;position:relative}
.photo{position:absolute;inset:0;background:url('${photo ?? ""}') center/cover no-repeat;
  filter:brightness(.32) saturate(.85)}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85))}
.stage{position:absolute;left:88px;right:88px;top:${box.top}px;bottom:${h - box.bottom}px;
  display:flex;flex-direction:column;justify-content:${tall ? "center" : "flex-end"}}
.logo{height:${tall ? 118 : 96}px;object-fit:contain;object-position:left center;display:block}
.logo-plate{align-self:flex-start;
  ${plate ? "background:#fff;padding:14px 20px;border-radius:14px;" : ""}}
.eyebrow{margin-top:${tall ? 40 : 30}px;font-family:Poppins;font-weight:600;letter-spacing:.16em;
  font-size:${tall ? 30 : 26}px;color:${accent}}
h1{margin-top:18px;font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.94;
  /* Tall stage is 904px wide (1080 - 88px margins each side). At 116px, Barlow
     Condensed 800's "YOU'RE ALREADY HERE" (concept A's first headline line)
     measures ~917px, so it wraps mid-thought and strands "HERE" alone on its
     own line on every gym's already-here-1080x1920.png. 108px measures ~854px
     for that same string — comfortably inside 904px with margin to spare —
     while every other headline line (already shorter) fits with room to spare
     at both sizes, so this is a size-only fix with no wording change. */
  font-size:${tall ? 108 : 92}px;letter-spacing:-.01em;text-transform:uppercase}
h1 .accent{color:${accent}}
.sub{margin-top:${tall ? 34 : 26}px;font-size:${tall ? 32 : 27}px;line-height:1.42;color:#E8EDF4;
  max-width:${tall ? 880 : 820}px}
.rule{margin-top:${tall ? 40 : 30}px;width:120px;height:7px;background:${accent};border-radius:4px}
.footer{margin-top:${tall ? 30 : 22}px;font-weight:600;font-size:${tall ? 30 : 25}px;color:#fff}
</style></head><body>
${photo ? `<div class="photo"></div><div class="scrim"></div>` : ""}
<div class="stage">
  <div class="logo-plate"><img class="logo" src="${logo}"></div>
  <div class="eyebrow">${text.eyebrow}</div>
  <h1>${text.headline.join("<br>")}<br><span class="accent">${text.accentLine}</span></h1>
  <div class="sub">${text.sub}</div>
  <div class="rule"></div>
  <div class="footer">${text.footer}</div>
</div>
</body></html>`;
}
