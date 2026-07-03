// ─────────────────────────────────────────────────────────────────────────────
// Instant "Your PT Career Escape Plan" email.
// Deterministic transactional email sent the moment someone unlocks their result
// on /career-planner — delivers their personalised plan to their inbox while
// intent is hot and opens the nurture relationship. No AI: fast + reliable.
// ─────────────────────────────────────────────────────────────────────────────

export interface EscapePlanResult {
  readinessScore?: number;
  readinessBand?: string;
  quitMonths?: number;
  year1Income?: number;
  steadyIncome?: number;
  recommendedRoute?: string;
  financeOption?: string;
  businessModel?: string;
  paybackSessions?: number;
  paybackNote?: string;
}

const NAVY = "#072B4A";
const NAVY_DEEP = "#051D33";
const CARD = "#0D3559";
const GOLD = "#F5C518";
const SOFT = "#B4C2D6";

const gbp = (n?: number) =>
  typeof n === "number" && isFinite(n) ? "£" + Math.round(n).toLocaleString("en-GB") : "—";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function quitPhrase(months?: number): string {
  if (typeof months !== "number" || !isFinite(months)) return "on a realistic timeline";
  if (months <= 2) return "in the next couple of months";
  return `in around ${months} months`;
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.09);color:${SOFT};font-size:15px;">${esc(label)}</td>
      <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.09);color:#ffffff;font-size:17px;font-weight:700;text-align:right;">${esc(value)}</td>
    </tr>`;
}

export function buildEscapePlanEmail(
  name: string,
  r: EscapePlanResult
): { subject: string; html: string; text: string } {
  const first = (name || "").split(/\s+/)[0] || "there";
  const score = typeof r.readinessScore === "number" ? `${r.readinessScore}/100` : "—";
  const band = r.readinessBand || "";
  const bookCall = "https://ptlaunchlab.co.uk/book-call?utm_source=email&utm_medium=lifecycle&utm_campaign=career_planner_result";

  const subject = `${first}, here's your PT Career Escape Plan`;

  const rows = [
    row("Readiness score", `${score}${band ? ` · ${band}` : ""}`),
    row("Go full-time", quitPhrase(r.quitMonths).replace(/^in /, "")),
    row("Year-1 income", gbp(r.year1Income)),
    row("Year 2–3 potential", gbp(r.steadyIncome)),
    r.recommendedRoute ? row("Recommended route", r.recommendedRoute) : "",
    r.businessModel ? row("Best-fit model", r.businessModel) : "",
    r.financeOption ? row("How to pay", r.financeOption) : "",
  ].join("");

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${NAVY_DEEP};">
  <div style="display:none;max-height:0;overflow:hidden;">Your readiness score, realistic quit date and year-1 income — plus your next step.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY_DEEP};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${NAVY};border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="height:6px;background:${GOLD};"></td></tr>
        <tr><td style="padding:32px 34px 8px;">
          <div style="color:${GOLD};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your PT Career Escape Plan</div>
          <h1 style="margin:10px 0 0;color:#ffffff;font-size:26px;line-height:1.2;">Hi ${esc(first)} — here's what your answers show.</h1>
          <p style="color:${SOFT};font-size:16px;line-height:1.6;margin:14px 0 0;">
            This is an honest, personalised read based on where you are right now. It's a starting point, not a promise — but it shows the path is more real than most people assume.
          </p>
        </td></tr>
        <tr><td style="padding:22px 34px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid rgba(245,197,24,0.35);border-radius:12px;padding:6px 20px;">
            ${rows}
          </table>
        </td></tr>
        ${
          r.paybackNote
            ? `<tr><td style="padding:10px 34px 0;"><p style="color:${SOFT};font-size:14px;line-height:1.6;margin:0;">${esc(r.paybackNote)}</p></td></tr>`
            : ""
        }
        <tr><td style="padding:24px 34px 8px;">
          <a href="${bookCall}" style="display:inline-block;background:${GOLD};color:${NAVY};font-size:17px;font-weight:800;text-decoration:none;padding:15px 30px;border-radius:100px;">Talk it through on a free call →</a>
          <p style="color:${SOFT};font-size:14px;line-height:1.6;margin:16px 0 0;">
            A 15-minute, no-pressure chat with someone actually in the industry. We'll walk through your plan, answer the real questions, and tell you honestly if it's the right move — and if it's not, we'll say so.
          </p>
          <p style="color:${SOFT};font-size:14px;line-height:1.6;margin:14px 0 0;">
            As a thank-you for planning it out, you've unlocked <strong style="color:#ffffff;">£200 off</strong> the NCFE Level 3 course if you decide to enrol.
          </p>
        </td></tr>
        <tr><td style="padding:22px 34px 30px;">
          <p style="color:#8FA4BD;font-size:13px;line-height:1.6;margin:0;">
            Just reply to this email if you've got a question — a real person reads it.<br>
            PT Launch Lab · The only PT course run by gym owners who actually hire trainers
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const text = [
    `Hi ${first}, here's your PT Career Escape Plan.`,
    ``,
    `Readiness score: ${score}${band ? ` (${band})` : ""}`,
    `Go full-time: ${quitPhrase(r.quitMonths)}`,
    `Year-1 income: ${gbp(r.year1Income)}`,
    `Year 2-3 potential: ${gbp(r.steadyIncome)}`,
    r.recommendedRoute ? `Recommended route: ${r.recommendedRoute}` : "",
    r.businessModel ? `Best-fit model: ${r.businessModel}` : "",
    r.financeOption ? `How to pay: ${r.financeOption}` : "",
    r.paybackNote ? `\n${r.paybackNote}` : "",
    ``,
    `Talk it through on a free call: ${bookCall}`,
    `You've unlocked £200 off the NCFE Level 3 course if you enrol.`,
    ``,
    `Just reply if you have a question — a real person reads it.`,
    `PT Launch Lab`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
