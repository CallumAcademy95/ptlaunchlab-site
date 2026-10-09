// app/lib/careerPlannerEmail.ts
// Instant "Your PT Career Plan" email, sent the moment the plan is shown.
// Deterministic, no AI. Makes no discount or deadline claim: there are none.
import type { CareerPlanV2 } from "./careerPlannerV2.ts";

const NAVY = "#072B4A"; const NAVY_DEEP = "#051D33"; const CARD = "#0D3559"; const GOLD = "#F5C518"; const SOFT = "#B4C2D6";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const UTM = "utm_source=email&utm_medium=lifecycle&utm_campaign=career_planner_v2";
const CALL = `https://ptlaunchlab.co.uk/book-call?${UTM}`;
const COURSE = `https://ptlaunchlab.co.uk/courses?${UTM}`;

const MENTORSHIP = [
  "A client profile worksheet to work out who you want to coach",
  "A 1:1 business call when you reach the business stage",
  "Recorded business training",
  "Live group Q&As",
  "Branded coaching templates: progress tracker, phase planner, logbook and meal planner",
];

function section(label: string, body: string): string {
  return `<tr><td style="padding:14px 20px;background:${CARD};border-radius:8px">
<div style="font:600 11px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${GOLD}">${esc(label)}</div>
<div style="font:15px/1.5 Arial,sans-serif;color:#fff;margin-top:4px">${body}</div></td></tr><tr><td style="height:10px"></td></tr>`;
}

export function buildCareerPlanEmail(firstName: string, plan: CareerPlanV2): { subject: string; html: string; text: string } {
  const first = firstName.trim() || "there";
  const subject = `${first}, here's your PT Career Plan`;
  const t = plan.timeline;
  const text = [
    `Hi ${first},`,
    "",
    `Here's your PT Career Plan. ${plan.headline}`,
    "",
    `YOUR GOAL\n${plan.goal}`,
    "",
    `YOUR ROUTE\n${plan.route}`,
    "",
    `YOUR TIMELINE\nStart: ${t.start}\nQualify: ${t.qualify} (the course takes 8–16 weeks)\nThen: ${t.next}`,
    "",
    `YOUR BIGGEST CONCERN: ${plan.concern.title.toUpperCase()}\n${plan.concern.answer}`,
    "",
    "WHAT YOU GET",
    "NCFE Level 2 and Level 3 (Ofqual regulated, CIMSPA recognised), studied online with a personal tutor.",
    "Business mentorship included:",
    ...MENTORSHIP.map((m) => `- ${m}`),
    "",
    `SESSION RATES IN ${plan.rateRange.region.toUpperCase()}\nPTs typically charge £${plan.rateRange.low}–£${plan.rateRange.high} a session (PT Launch Lab estimate).`,
    "",
    `Want to talk it through? Book a 15-minute call: ${CALL}`,
    `See what the course covers: ${COURSE}`,
    "",
    "Callum",
    "PT Launch Lab",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:${NAVY_DEEP}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY_DEEP}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${NAVY};border-radius:12px;padding:24px">
<tr><td style="font:700 26px Arial,sans-serif;color:#fff;padding:0 20px 6px">Your PT Career Plan, ${esc(first)}</td></tr>
<tr><td style="font:16px Arial,sans-serif;color:${GOLD};padding:0 20px 18px">${esc(plan.headline)}</td></tr>
${section("Your goal", esc(plan.goal))}
${section("Your route", esc(plan.route))}
${section("Your timeline", `Start: ${esc(t.start)}<br>Qualify: ${esc(t.qualify)} <span style="color:${SOFT}">(the course takes 8–16 weeks)</span><br>Then: ${esc(t.next)}`)}
${section(`Your biggest concern: ${plan.concern.title}`, esc(plan.concern.answer))}
${section("What you get", `NCFE Level 2 and Level 3 (Ofqual regulated, CIMSPA recognised), studied online with a personal tutor.<br><br><b>Business mentorship included:</b><br>${MENTORSHIP.map((m) => `• ${esc(m)}`).join("<br>")}`)}
${section(`Session rates in ${plan.rateRange.region}`, `PTs typically charge £${plan.rateRange.low}–£${plan.rateRange.high} a session <span style="color:${SOFT}">(PT Launch Lab estimate)</span>`)}
<tr><td style="padding:10px 20px"><a href="${CALL}" style="display:inline-block;background:${GOLD};color:${NAVY};font:700 15px Arial,sans-serif;padding:12px 20px;border-radius:6px;text-decoration:none">Book a 15-minute call</a>
&nbsp; <a href="${COURSE}" style="color:#fff;font:15px Arial,sans-serif">See what the course covers</a></td></tr>
<tr><td style="font:14px Arial,sans-serif;color:${SOFT};padding:18px 20px 0">Callum<br>PT Launch Lab</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, html, text };
}
