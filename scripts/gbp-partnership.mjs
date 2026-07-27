// Renders the gym partnership infographic.
//
//   node --use-system-ca scripts/gbp-partnership.mjs
//
// Replaces the previous version, which had eleven competing boxes and read as
// AI-generated clutter. This one carries a single number (£500), the five-step
// mechanism, one reassurance line and one call to action — in that order of
// visual weight, so a gym owner glancing at it gets the offer in two seconds.
//
// 1600x1200 (4:3) — the ratio Google wants for post images, rendered large so it
// stays sharp when reused in email or on WhatsApp.

import { readFileSync } from "node:fs";
import { renderHtml, FONTS, BRAND } from "./render-image.mjs";

const W = 1600;
const H = 1200;
const OUT = "public/gbp/gym-partnership.jpg";

const logoSvg = readFileSync("public/logo-hover.svg", "utf8")
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/<svg /, '<svg preserveAspectRatio="xMinYMid meet" ');

const STEPS = [
  ["We promote", "To your members, prospects and ex-members"],
  ["They enrol", "Through your unique link or QR code"],
  ["We qualify", "NCFE Level 2 and 3, delivered online"],
  ["We place", "Back into your gym as a qualified PT"],
  ["You get paid", "£500 per learner, upfront"],
];

const html = `<!doctype html>
<html><head><meta charset="utf-8">${FONTS}
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  body{
    background:radial-gradient(115% 85% at 15% 8%, #14284b 0%, #0b1730 45%, ${BRAND.navy} 100%);
    font-family:'Poppins',sans-serif;color:#fff;overflow:hidden;
  }
  /* space-between rather than a single auto margin, so slack distributes across
     the whole column instead of pooling into one dead band */
  .wrap{height:100%;padding:64px 76px 58px;display:flex;flex-direction:column;
        justify-content:space-between}

  .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:44px}
  .logo svg{height:76px;width:auto;display:block}
  .eyebrow{
    font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:25px;
    letter-spacing:.20em;text-transform:uppercase;color:${BRAND.gold};
    border:1px solid rgba(245,197,24,.45);padding:11px 22px;border-radius:3px;
  }

  h1{
    font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:88px;
    line-height:.95;text-transform:uppercase;letter-spacing:.005em;
  }
  h1 .gold{color:${BRAND.gold}}
  .lede{font-size:24px;color:rgba(255,255,255,.72);margin-top:20px;line-height:1.45;max-width:900px}

  /* hero number */
  .hero{
    margin:8px 0;display:flex;align-items:center;gap:44px;
    background:linear-gradient(90deg, rgba(16,35,66,.95) 0%, rgba(16,35,66,.35) 100%);
    border-left:5px solid ${BRAND.gold};
    padding:34px 44px;border-radius:4px;
  }
  .num{
    font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:150px;
    line-height:.82;color:${BRAND.gold};letter-spacing:-.01em;
  }
  .num-side .a{
    font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:40px;
    text-transform:uppercase;letter-spacing:.05em;line-height:1.1;
  }
  .num-side .b{font-size:22px;color:rgba(255,255,255,.68);margin-top:8px}

  /* steps */
  .steps{display:flex;gap:0}
  .step{flex:1;padding-right:26px;position:relative}
  .step:not(:last-child):after{
    content:'';position:absolute;top:17px;right:13px;width:10px;height:10px;
    border-top:2px solid rgba(245,197,24,.5);border-right:2px solid rgba(245,197,24,.5);
    transform:rotate(45deg);
  }
  .n{
    font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:23px;
    color:${BRAND.navy};background:${BRAND.gold};width:36px;height:36px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:15px;
  }
  .step h3{
    font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:31px;
    text-transform:uppercase;letter-spacing:.03em;margin-bottom:7px;
  }
  .step p{font-size:16px;line-height:1.45;color:rgba(255,255,255,.6)}

  .reassure{
    display:flex;align-items:center;gap:30px;margin:0 0 26px;
    font-family:'Barlow Condensed',sans-serif;font-weight:500;font-size:25px;
    letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.72);
  }
  .reassure span{display:flex;align-items:center;gap:11px}
  .tick{color:${BRAND.gold};font-size:21px}
  .hr{height:1px;background:rgba(255,255,255,.13)}

  .cta{display:flex;align-items:center;justify-content:space-between;padding-top:28px}
  .cta .btn{
    background:${BRAND.gold};color:${BRAND.navy};
    font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:33px;
    text-transform:uppercase;letter-spacing:.05em;padding:19px 40px;border-radius:4px;
  }
  .cta .url{
    font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:30px;
    letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.85);
  }
  .cta .url small{display:block;font-family:'Poppins',sans-serif;font-weight:400;
    font-size:15px;letter-spacing:0;text-transform:none;color:rgba(255,255,255,.5);margin-top:5px}
</style></head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="logo">${logoSvg}</div>
      <div class="eyebrow">Gym Partnership Programme</div>
    </div>

    <h1>The smarter way<br>to <span class="gold">grow your gym</span></h1>
    <p class="lede">We turn your members, prospects and ex-members into qualified personal trainers — working on your gym floor.</p>

    <div class="hero">
      <div class="num">£500</div>
      <div class="num-side">
        <div class="a">Per learner<br>enrolled</div>
        <div class="b">Paid upfront. No cost to you.</div>
      </div>
    </div>

    <div class="steps">
      ${STEPS.map(
        ([h, p], i) => `<div class="step">
        <div class="n">${i + 1}</div><h3>${h}</h3><p>${p}</p></div>`,
      ).join("")}
    </div>

    <div class="reassure">
      <span><i class="tick">✓</i> No set-up fees</span>
      <span><i class="tick">✓</i> No recurring fees</span>
      <span><i class="tick">✓</i> No financial risk</span>
    </div>
    <div class="hr"></div>

    <div class="cta">
      <div class="btn">Book a 15-minute call</div>
      <div class="url">ptlaunchlab.co.uk/gym-partnership
        <small>500+ personal trainers hired · NCFE and Ofqual regulated</small>
      </div>
    </div>
  </div>
</body></html>`;

const meta = await renderHtml(html, {
  width: W,
  height: H,
  out: OUT,
  name: "gym-partnership",
});
console.log(`partnership: ${OUT} — ${meta.width}x${meta.height}`);
