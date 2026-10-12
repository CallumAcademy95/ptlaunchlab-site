import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const PAGE = "app/components/GymAcademyPage.tsx";
const BANNED = [/klarna/i, /interest-free/i, /interest free/i, /pay in 3/i];

// ATP Fitness Felixstowe's branches, verbatim from origin/master (6e28a1d).
// Phase 3c must not change a byte of them.
const ATP_BLOCKS = [
  `            {atp ? (
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-6 py-3 mb-8" style={{ backgroundColor: dark }}>
                <span className="text-white font-black text-xl uppercase tracking-wide">{ATP_SIX_MONTH_TOTAL}</span>
                <span className="text-white text-sm font-bold">Save {ATP_CODE_SAVING} with your ATP member code</span>
              </div>
            ) : (`,
  `            <a href={enrolPath}
              className="inline-block px-10 py-4 rounded-full font-black uppercase tracking-wide text-base hover:opacity-90 transition-all shadow-xl"
              style={{ backgroundColor: dark, color: bg }}>
              Enrol Now →
            </a>`,
  `            {atp ? (
              <p className="text-gray-600 text-base mb-10">
                Most PT qualifications cost {TYPICAL_COST_LABEL}. ATP members save {ATP_CODE_SAVING} with their member code.
              </p>
            ) : (`,
  `            {atp ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl p-8 border-2 shadow-sm" style={{ borderColor: c.primaryColor }}>
                  <p className="font-black uppercase text-xs tracking-widest mb-2" style={{ color: c.primaryColor }}>One Payment</p>
                  <p className="text-black font-black text-2xl mb-1">Pay in Full</p>
                  <p className="font-black text-4xl mb-1" style={{ color: c.primaryColor }}>{ATP_SIX_MONTH_TOTAL}</p>
                  <p className="text-gray-400 text-sm mb-4">Nothing further to pay</p>
                  <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-white text-sm text-center hover:opacity-90 transition-all" style={{ backgroundColor: c.primaryColor }}>
                    Enrol Now →
                  </a>
                </div>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <p className="font-black uppercase text-xs tracking-widest text-gray-400 mb-2">Spread the Cost</p>
                  <p className="text-black font-black text-2xl mb-1">6-Month Plan</p>
                  <p className="font-black text-4xl text-black mb-1">{ATP_DEPOSIT}<span className="text-lg text-gray-400 font-bold"> today</span></p>
                  <p className="text-gray-400 text-sm mb-4">then {ATP_LADDER.sixMonth.instalments} monthly payments of {ATP_INSTALMENT}, {ATP_SIX_MONTH_TOTAL} in total</p>
                  <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-sm text-center border-2 hover:opacity-80 transition-all" style={{ borderColor: c.primaryColor, color: c.primaryColor }}>
                    Start the 6-Month Plan →
                  </a>
                </div>
              </div>
              <p className="mt-6 text-black font-bold">
                ATP member? Save {ATP_CODE_SAVING} with your member code. Ask the team at {c.gymName} for yours.
              </p>
              </>
            ) : (`,
  `        <GymCallbackForm gymSlug={c.gymSlug} gymName={c.gymName} accent={c.primaryColor} />`,
  `              {atp
                ? \`\${ATP_SIX_MONTH_TOTAL} in full or over 6 months · ATP members save \${ATP_CODE_SAVING} with their code\``,
  `            <a href={enrolPath}
              className="inline-block bg-white font-black uppercase tracking-wide text-base px-12 py-5 rounded-full hover:opacity-90 transition-all shadow-xl mb-5"
              style={{ color: c.primaryColor }}>
              Apply Now →
            </a>`,
];

test("the ATP blocks are still on origin/master as written here (skipped without git)", (t) => {
  let master: string;
  try {
    master = execSync(`git show origin/master:${PAGE}`, { cwd: new URL("..", import.meta.url), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    t.skip("origin/master not available");
    return;
  }
  for (const b of ATP_BLOCKS) assert.ok(master.replace(/\r\n/g, "\n").includes(b), `not on origin/master: ${b.slice(0, 80)}`);
});

test("ATP Felixstowe: every ATP block is byte-identical", () => {
  const p = src(PAGE).replace(/\r\n/g, "\n");
  for (const b of ATP_BLOCKS) assert.ok(p.includes(b), `ATP block changed: ${b.slice(0, 80)}`);
  // The ATP-only buttons are reached through atp ternaries, not rendered for every gym.
  assert.match(p, /\{atp \? \(\n {12}<a href=\{enrolPath\}\n {14}className="inline-block px-10/, "hero Enrol Now is ATP-only");
  assert.match(p, /\{atp \? \(\n {12}<a href=\{enrolPath\}\n {14}className="inline-block bg-white/, "final Apply Now is ATP-only");
});

test("no site pop-up on the gym page: no CallLink, TwoWayCTA or CallModal", () => {
  const p = src(PAGE);
  assert.doesNotMatch(p, /CallLink|TwoWayCTA|CallModal|useCallModal/);
});

test("hero: pay-in-full price row and two gym-attributed buttons", () => {
  const p = src(PAGE);
  assert.match(p, /data-cta-source="gym-hero"/);
  const hero = p.slice(p.indexOf('data-cta-source="gym-hero"'), p.indexOf("── HOOK ──"));
  assert.match(hero, /href=\{enrolPath\}[\s\S]*?>\s*Enrol now\s*</);
  assert.match(hero, /href="#ring-me"[\s\S]*?>\s*Book a free call\s*</);
  const priceRow = p.slice(p.indexOf("{COURSE_PRICE_LABEL}"), p.indexOf('data-cta-source="gym-hero"'));
  assert.match(priceRow, /Everything included/);
  assert.match(priceRow, /Flexible ways to pay at checkout/);
  assert.match(priceRow, /Member price \{memberPriceLabel\} in full/);
  assert.ok(p.indexOf('data-cta-source="gym-hero"') < p.indexOf('"Level 2 + Level 3 PT Qualification"'), "buttons sit under the price row, above the checklist, so they are in the first screen");
});

test("ATP keeps its exact hero classes where the non-ATP hero is tightened for mobile", () => {
  const p = src(PAGE).replace(/\r\n/g, "\n");
  for (const cls of [
    'atp ? "relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24" :',
    'atp ? "flex items-center gap-3 mb-8" :',
    'atp ? "text-white/60 text-lg font-semibold uppercase tracking-widest mb-8" :',
  ]) assert.ok(p.includes(cls), cls);
  assert.match(p, /\{atp \? \(\n {12}<a href=\{enrolPath\}[\s\S]{0,300}?Enrol Now →\n {12}<\/a>\n {12}\) : null\}/, "hero Enrol Now renders for ATP only");
});

test("pricing: one featured pay-in-full card, then the monthly link and the call link", () => {
  const p = src(PAGE);
  assert.equal((p.match(/data-featured/g) ?? []).length, 1, "exactly one featured card");
  const card = p.slice(p.indexOf("data-featured"), p.indexOf("Prefer {MONTHLY_PAYMENTS}"));
  for (const s of ["Pay in full", "{COURSE_PRICE_LABEL}", "{memberPriceLabel}", "Everything included", "Flexible ways to pay at checkout"]) assert.ok(card.includes(s), s);
  assert.match(card, /href=\{enrolPath\}[\s\S]*?>\s*Enrol now\s*</);
  assert.match(p, /href=\{enrolPath\}[\s\S]{0,400}?Prefer \{MONTHLY_PAYMENTS\} monthly payments of \{MONTHLY_PRICE_LABEL\}\? See payment options →/);
  assert.match(p, /href="#ring-me"[\s\S]{0,400}?Not sure\? Book a free call/);
  assert.match(p, /source="gym-pricing-monthly"[\s\S]{0,300}?Prefer \{MONTHLY_PAYMENTS\}/, "the monthly link has its own source");
  assert.doesNotMatch(p, /Pay Monthly/, "no second card");
});

test("the monthly price appears only in the monthly link", () => {
  const p = src(PAGE);
  assert.equal((p.match(/\{MONTHLY_PRICE_LABEL\}/g) ?? []).length, 1);
  assert.doesNotMatch(p, /\$\{MONTHLY_PRICE_LABEL\}|\/month|MONTHLY_PLAN_TOTAL_PENCE/);
});

test("final CTA: everything-included line and the two buttons", () => {
  const p = src(PAGE);
  const fin = p.slice(p.indexOf("── FINAL CTA ──"), p.indexOf("</main>"));
  assert.match(fin, /`\$\{COURSE_PRICE_LABEL\}, everything included`/);
  assert.match(fin, /href=\{enrolPath\}[\s\S]*?>\s*Enrol now\s*</);
  assert.match(fin, /href="#ring-me"[\s\S]*?>\s*Book a free call\s*</);
});

test("every Book a free call goes to the gym's ring-me form, which exists", () => {
  const p = src(PAGE);
  assert.doesNotMatch(p, /\/book-call|CALL_HREF|ENROL_HREF/, "no site-wide call or enrol hrefs");
  assert.match(p, /<GymCallbackForm gymSlug=\{c\.gymSlug\}/);
  assert.match(src("app/components/GymCallbackForm.tsx"), /id="ring-me"/);
  assert.match(src("app/components/GymCallbackForm.tsx"), /intent="gym_callback"/);
});

test("sticky bar: gym hrefs, watches the gym hero, hides from lg, not on ATP", () => {
  const p = src(PAGE);
  const m = p.match(/\{!atp && \(?\s*<StickyCtaBar([\s\S]*?)\/>/);
  assert.ok(m, "StickyCtaBar rendered for non-ATP only");
  const props = m![1];
  assert.match(props, /watchSelector="\[data-cta-source='gym-hero'\]"/);
  assert.match(props, /source="gym-sticky"/);
  assert.match(props, /hideFrom="lg"/);
  assert.match(props, /enrolHref=\{enrolPath\}/);
  assert.match(props, /callHref="#ring-me"/);
  assert.match(props, /gym=\{c\.gymSlug\}/);
});

test("StickyCtaBar: enrolHref and callHref props; callHref renders a plain anchor, defaults unchanged", () => {
  const s = src("app/components/cta/StickyCtaBar.tsx");
  assert.match(s, /enrolHref\?: string;/);
  assert.match(s, /callHref\?: string;/);
  assert.match(s, /href=\{enrolHref \?\? ENROL_HREF\}/);
  assert.match(s, /callHref \? \(\s*<a\s+href=\{callHref\}/);
  assert.match(s, /<CallLink/, "default still opens the pop-up");
  assert.match(s, /source = "home-sticky"/);
  assert.match(s, /hideFrom = "md"/);
});

test("tracking: every new gym button sends cta_click with the gym", () => {
  const p = src(PAGE);
  const links = p.match(/<GymCtaLink[\s\S]*?>/g) ?? [];
  assert.ok(links.length >= 7, `expected at least 7 tracked gym links, got ${links.length}`);
  for (const l of links) {
    assert.match(l, /source="gym-(hero|pricing|pricing-monthly|final)"/, l);
    assert.match(l, /action="(enrol|call)"/, l);
    assert.match(l, /gym=\{c\.gymSlug\}/, l);
  }
  const g = src("app/components/GymCtaLink.tsx");
  assert.match(g, /^"use client";/);
  assert.match(g, /trackEvent\("cta_click", \{ source, action, gym \}\)/);
  assert.doesNotMatch(g, /CallLink|useCallModal/);
});

test("banned words are absent", () => {
  for (const f of [PAGE, "app/components/GymCtaLink.tsx", "app/components/cta/StickyCtaBar.tsx"]) {
    const s = src(f);
    for (const b of BANNED) assert.doesNotMatch(s, b, `${f}: ${b}`);
  }
});

test("chat bubble hides below md behind ANY page's hero CTA, not just home's", () => {
  const c = src("app/components/Chatbot.tsx");
  assert.match(c, /const HERO_CTA = "\[data-cta-source\$='-hero'\]";/);
  assert.equal((c.match(/querySelector\(HERO_CTA\)/g) ?? []).length, 2, "both hero lookups use HERO_CTA");
  assert.doesNotMatch(c, /data-cta-source='home-hero'/);
});

test("chat Talk to the Team goes to the gym's #ring-me form when the page has one", () => {
  const c = src("app/components/Chatbot.tsx");
  assert.match(c, /action === "call"[\s\S]{0,200}?document\.getElementById\("ring-me"\)/);
  assert.match(c, /href: "\/book-call"/, "other pages still go to /book-call");
});
