// ─── Partner Embed Card ───────────────────────────────────────────────────────
// A small, fixed-height promo banner a gym partner pastes into their own site
// (Wix, Squarespace, WordPress) as a single <iframe>.
//
// WHY A ROUTE HANDLER AND NOT A PAGE
// A page.tsx would nest inside app/layout.tsx, which loads CookieYes, GA4,
// Microsoft Clarity and the Meta Pixel. Embedded on a partner's site that would
// fire our pixel from inside their page and drop a consent banner into it —
// handing them a cookie-consent obligation they never agreed to. A route
// handler bypasses the root layout entirely, so this document ships zero
// JavaScript and sets zero cookies.
//
// FRAMING
// /embed/* is the only path on the site allowed to be framed. next.config.ts
// omits X-Frame-Options there and sets `frame-ancestors https:`. That is safe
// on this route specifically: no form, no cookie, no auth, no PII, one
// outbound link. There is nothing here to clickjack.
// ─────────────────────────────────────────────────────────────────────────────

import { getGym, GYM_SLUGS } from "@/app/lib/gyms";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";

export const dynamic = "force-static";

export function generateStaticParams() {
  return GYM_SLUGS.map((gym) => ({ gym }));
}

/** Escape for HTML text and double-quoted attribute contexts. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function card(slug: string, c: GymConfig): string {
  const bg = c.heroBg ?? "#000000";
  const accent = c.darkAccent ?? c.primaryColor;
  // A near-black accent on a black card renders an invisible button. Fall back
  // to white so the CTA stays legible whatever a partner's brand colour is.
  const ctaBg = isNearlyBlack(accent) ? "#FFFFFF" : accent;
  const ctaFg = readableOn(ctaBg);

  const href =
    `https://ptlaunchlab.co.uk${c.canonicalPath}` +
    `?utm_source=partner-embed&utm_medium=embed&utm_campaign=${encodeURIComponent(slug)}`;

  const wordmark = Boolean(c.logoWidth && c.logoHeight);
  const logo = `<img src="${esc(c.logoUrl)}" alt="${esc(c.logoAlt ?? c.gymName)}"
      class="${wordmark ? "wordmark" : "mark"}" loading="lazy" decoding="async">`;

  const proof = ["Level 2 & 3", "NCFE Accredited", c.location].filter(Boolean).join(" · ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(c.gymName)} PT Academy</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:${esc(bg)};color:#fff;overflow:hidden;
  }
  .card{
    position:relative;height:100%;width:100%;
    display:flex;flex-direction:column;justify-content:center;gap:10px;
    padding:16px 20px;overflow:hidden;
  }
  .glow{
    position:absolute;inset:0;opacity:.25;pointer-events:none;
    background:radial-gradient(ellipse at 85% 50%, ${esc(accent)}, transparent 55%);
  }
  .inner{position:relative;z-index:1;display:flex;align-items:center;
    justify-content:space-between;gap:16px;flex-wrap:wrap}
  .left{display:flex;flex-direction:column;gap:8px;min-width:0;flex:1 1 240px}
  .brand{display:flex;align-items:center;gap:10px}
  .mark{width:34px;height:34px;border-radius:8px;object-fit:cover;flex:none}
  .wordmark{height:30px;width:auto;object-fit:contain;flex:none}
  .eyebrow{font-size:9px;letter-spacing:.14em;text-transform:uppercase;
    font-weight:600;color:rgba(255,255,255,.45);line-height:1.2}
  .gym{font-size:12px;font-weight:700;color:#fff;line-height:1.2}
  h1{font-size:21px;line-height:1.15;font-weight:800;text-transform:uppercase;
    letter-spacing:-.01em}
  h1 .hl{color:${esc(accent === bg ? "#FFFFFF" : accent)}}
  .proof{font-size:11px;color:rgba(255,255,255,.6);line-height:1.3}
  .cta{
    display:inline-block;flex:none;white-space:nowrap;text-decoration:none;
    background:${esc(ctaBg)};color:${esc(ctaFg)};
    font-size:14px;font-weight:800;padding:12px 22px;border-radius:100px;
  }
  .cta:hover{opacity:.9}
  @media (max-width:520px){
    .inner{flex-direction:column;align-items:stretch;gap:11px}
    /* flex-basis applies to the CROSS axis, so the row-layout flex:1 1 240px
       becomes a 240px MIN HEIGHT once this flips to column, which overflows
       the fixed iframe height and clips the brand row off the top and the CTA
       off the bottom. Reset it to content height. */
    .left{flex:0 0 auto;gap:7px}
    h1{font-size:18px}
    .proof{font-size:10px}
    .cta{width:100%;text-align:center;padding:11px 18px;font-size:13px}
  }
  /* Very narrow columns (Wix sidebars, 300px ad slots) */
  @media (max-width:340px){
    h1{font-size:16px}
    .mark{width:30px;height:30px}
  }
</style>
</head>
<body>
  <div class="card">
    <div class="glow"></div>
    <div class="inner">
      <div class="left">
        <div class="brand">
          ${logo}
          <div>
            <div class="eyebrow">Powered by PT Launch Lab</div>
            <div class="gym">${esc(c.gymName)} PT Academy</div>
          </div>
        </div>
        <h1>Become a <span class="hl">Qualified Personal Trainer</span></h1>
        <div class="proof">${esc(proof)}</div>
      </div>
      <a class="cta" href="${esc(href)}" target="_blank" rel="noopener">Find out more &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

/** True for colours dark enough to vanish against a black card. */
function isNearlyBlack(hex: string): boolean {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40;
}

/** Black or white text, whichever is readable on the given background. */
function readableOn(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140 ? "#0B1F38" : "#FFFFFF";
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gym: string }> },
) {
  const { gym } = await params;
  const config = getGym(gym);

  if (!config) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(card(gym, config), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
