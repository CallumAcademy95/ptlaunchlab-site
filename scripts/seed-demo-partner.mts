/**
 * Seed the demonstration partner portal.
 *
 *   npx tsx scripts/seed-demo-partner.mts                       # show the plan
 *   npx tsx scripts/seed-demo-partner.mts --apply
 *   npx tsx scripts/seed-demo-partner.mts --apply --login=you@x.com
 *   npx tsx scripts/seed-demo-partner.mts --destroy --apply     # remove it all
 *
 * Northgate Strength is invented. It exists so a prospective partner can be
 * walked through a portal that looks like a going concern rather than an empty
 * one — enrolments in several states, commission already paid, commission due,
 * and commission still accruing.
 *
 * Updated 27 Nov 2026 to the current gym terms (ladder commission, £999.99 in
 * full or 10 × £99.99, no promo codes), so it can be shown to prospects.
 *
 * Everything is flagged is_demo, so none of the invented money reaches the
 * admin totals or the audit. Re-runnable: it clears its own rows first.
 */

import { readFileSync } from "node:fs";
import crypto from "node:crypto";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=") || "true"];
  })
);
const APPLY = args.apply === "true";
const DESTROY = args.destroy === "true";
const LOGIN_EMAIL = (args.login as string) ?? "demo@ptlaunchlab.co.uk";

const U = process.env.SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const SLUG = "demo";
const GYM = "Northgate Strength";

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};

const NOW = new Date();
const day = (n: number) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
};

/**
 * Learners spread over the last quarter and this one, on the current terms:
 *   - £999.99 in full, or 10 × £99.99 monthly;
 *   - £400 (in full) / £250 (monthly) per learner, and from the 4th learner in
 *     a calendar quarter the Partner Accelerator rate, £500 / £300;
 *   - released 30 days after enrolment in full, or at the 5th monthly payment.
 * Days are relative to the day it is seeded, so the picture stays current: the
 * last quarter is settled (Accelerator top-ups included), and this quarter has
 * learners ready to pay, accruing and on the Accelerator rate. A demo where
 * everything is "paid" teaches a prospect nothing about how they get paid.
 *
 * monthlyPaid = monthly payments collected so far.
 */
type DemoLearner = { name: string; enrolled: number; plan: "PIF" | "deposit"; monthlyPaid?: number };
const LEARNERS: DemoLearner[] = [
  { name: "Rachel Okonkwo", enrolled: -140, plan: "PIF" },
  { name: "Daniel Whitfield", enrolled: -125, plan: "PIF" },
  { name: "Priya Raman", enrolled: -112, plan: "deposit", monthlyPaid: 4 },
  { name: "Callum Ferguson", enrolled: -96, plan: "PIF" },
  { name: "Hannah Price", enrolled: -78, plan: "PIF" },
  { name: "Sophie Mensah", enrolled: -50, plan: "PIF" },
  { name: "Marcus Bell", enrolled: -38, plan: "PIF" },
  { name: "Aisha Karim", enrolled: -27, plan: "deposit", monthlyPaid: 1 },
  { name: "Tom Whelan", enrolled: -14, plan: "PIF" },
  { name: "Jade Mistry", enrolled: -4, plan: "deposit", monthlyPaid: 1 },
];

const PIF_PRICE = 99_999;
const MONTHLY = 9_999;
const BASE = { PIF: 40_000, deposit: 25_000 } as const;
const BONUS = { PIF: 10_000, deposit: 5_000 } as const;
const quarterStart = (d: Date) => Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1);
const THIS_QUARTER = quarterStart(NOW);

const counts = new Map<number, number>();
const plan = LEARNERS.map((l) => {
  const enrolledAt = day(l.enrolled);
  const q = quarterStart(enrolledAt);
  const position = (counts.get(q) ?? 0) + 1;
  counts.set(q, position);
  const monthlyPaid = l.monthlyPaid ?? 1;
  const paidPence = l.plan === "PIF" ? PIF_PRICE : MONTHLY * monthlyPaid;
  const duePence = l.plan === "PIF" ? PIF_PRICE : MONTHLY * 10;
  const releaseAt =
    l.plan === "PIF"
      ? new Date(enrolledAt.getTime() + 30 * 864e5)
      : monthlyPaid >= 5
        ? new Date(enrolledAt.getTime() + 4 * 30 * 864e5) // the 5th payment
        : null;
  const released = releaseAt !== null && releaseAt.getTime() <= NOW.getTime();
  const pastQuarter = q < THIS_QUARTER;
  // Last quarter's released commission has been paid; this quarter's waits for the next payment run.
  const state: "paid" | "due" | "accruing" = released ? (pastQuarter ? "paid" : "due") : "accruing";
  const bonus = position >= 4 ? BONUS[l.plan] : 0;
  return { ...l, enrolledAt, position, paidPence, duePence, releaseAt, state, pastQuarter, bonus };
});

async function destroy() {
  const [p] = await api(`pp_partners?slug=eq.${SLUG}&select=id`);
  if (!p) { console.log("no demo partner to remove"); return; }
  const users = await api(`pp_partner_users?partner_id=eq.${p.id}&select=id`);
  await api(`pp_sales?partner_id=eq.${p.id}`, { method: "DELETE" });
  await api(`pp_payouts?partner_id=eq.${p.id}`, { method: "DELETE" });
  await api(`pp_resources?partner_id=eq.${p.id}`, { method: "DELETE" });
  await api(`pp_partner_users?partner_id=eq.${p.id}`, { method: "DELETE" });
  for (const u of users) await fetch(`${U}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: H });
  await api(`pp_partners?id=eq.${p.id}`, { method: "DELETE" });
  console.log("demo partner removed");
}

if (DESTROY) {
  if (!APPLY) { console.log("Would remove the demo partner and everything attached. Add --apply."); process.exit(0); }
  await destroy();
  process.exit(0);
}

console.log(`${APPLY ? "SEEDING" : "DRY RUN"} — ${GYM} (/${SLUG})\n`);
for (const l of plan) {
  console.log(
    `  ${l.enrolledAt.toISOString().slice(0, 10)}  ${l.name.padEnd(17)} ${l.plan === "PIF" ? "in full" : "monthly"}  ` +
      `£${(l.paidPence / 100).toFixed(2).padStart(6)} of £${(l.duePence / 100).toFixed(2)}  #${l.position} in its quarter  ` +
      `£${BASE[l.plan] / 100}${l.bonus ? ` + £${l.bonus / 100} Accelerator` : ""}  ${l.state}`
  );
}
const total = (st: string) => plan.filter((l) => l.state === st).reduce((t, l) => t + BASE[l.plan] + (l.pastQuarter ? l.bonus : 0), 0);
console.log(`\n  ${plan.length} enrolments · £${total("paid") / 100} paid · £${total("due") / 100} ready to pay · £${total("accruing") / 100} accruing (+ this quarter's Accelerator, worked out live)`);
console.log(`  login: ${LOGIN_EMAIL}`);

if (!APPLY) { console.log("\nNothing written. Add --apply."); process.exit(0); }

// Start clean so a re-run doesn't stack duplicate sales on top of the last one.
await destroy();

const [partner] = await api("pp_partners", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    slug: SLUG,
    gym_name: GYM,
    status: "active",
    landing_page_path: "/demo-academy",
    legacy_referral_names: [GYM],
    commission_terms: "ladder",
    is_demo: true,
    contact_name: "Demo Account",
    contact_email: LOGIN_EMAIL,
    bank_account_name: "Northgate Strength Ltd",
    bank_sort_code: "040004",
    bank_account_number: "12345678",
    bank_details_updated_at: day(-150).toISOString(),
  }),
});
console.log("\npartner created");

// One payout covering last quarter, Accelerator top-ups included, so the
// payments page shows a real history rather than a bare total.
const settled = plan.filter((l) => l.state === "paid");
const [payout] = await api("pp_payouts", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    partner_id: partner.id,
    period_label: "Paid " + day(-50).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    total_pence: settled.reduce((t, l) => t + BASE[l.plan] + l.bonus, 0),
    status: "paid",
    reference: "bank-transfer",
    paid_at: day(-50).toISOString(),
  }),
});

for (const l of plan) {
  const settledBonus = l.pastQuarter && l.bonus > 0;
  await api("pp_sales", {
    method: "POST",
    body: JSON.stringify({
      partner_id: partner.id,
      stripe_session_id: `cs_demo_${crypto.randomBytes(8).toString("hex")}`,
      learner_name: l.name,
      learner_email: `${l.name.toLowerCase().replace(/\s+/g, ".")}@example.invalid`,
      plan_type: l.plan,
      rung: l.plan === "PIF" ? "pif" : "monthly",
      amount_paid_pence: l.paidPence,
      amount_due_pence: l.duePence,
      status: "confirmed",
      commission_pence: BASE[l.plan],
      commission_status: l.state,
      commission_release_at: l.releaseAt ? l.releaseAt.toISOString() : null,
      // Last quarter's top-ups were paid with the payout; this quarter's the
      // portal works out live from each learner's position.
      volume_bonus_pence: settledBonus ? l.bonus : 0,
      volume_bonus_payout_id: settledBonus ? payout.id : null,
      payout_id: l.state === "paid" ? payout.id : null,
      enrolled_at: l.enrolledAt.toISOString(),
    }),
  });
}
console.log(`${plan.length} sales + 1 payout created`);

// Share every shared resource. Per-gym artwork belongs to real gyms, so the
// demo shows the common set rather than borrowing somebody's posters.
const shared = await api("pp_resources?partner_id=is.null&select=id,title");
console.log(`${shared.length} shared resource(s) already visible to it`);

const pw = [...crypto.randomBytes(16)]
  .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[b % 56])
  .join("");
const cu = await fetch(`${U}/auth/v1/admin/users`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ email: LOGIN_EMAIL, password: pw, email_confirm: true }),
});
const user = await cu.json();
if (user.id) {
  await api("pp_partner_users", {
    method: "POST",
    body: JSON.stringify({
      id: user.id,
      partner_id: partner.id,
      email: LOGIN_EMAIL,
      full_name: "Demo Account",
      role: "owner",
      // No forced password change and no walkthrough: this account is shown
      // to prospects, and both would get in the way.
      must_change_password: false,
      onboarding_dismissed_at: new Date().toISOString(),
    }),
  });
  console.log(`\nlogin:    ${LOGIN_EMAIL}\npassword: ${pw}`);
} else {
  console.log(`\ncould not create the login: ${JSON.stringify(user).slice(0, 160)}`);
}

console.log(`\nportal:   https://ptlaunchlab.co.uk/partners/login`);
console.log(`academy:  https://ptlaunchlab.co.uk/demo-academy`);
