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

const day = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(12, 0, 0, 0);
  return d.toISOString();
};

/**
 * A spread that shows every state the portal can display. A demo where
 * everything is "paid" teaches a prospect nothing about how they get paid.
 */
const LEARNERS = [
  { name: "Rachel Okonkwo", enrolled: -142, plan: "PIF", paid: 109900, due: 109900, state: "paid" },
  { name: "Daniel Whitfield", enrolled: -128, plan: "PIF", paid: 109900, due: 109900, state: "paid" },
  { name: "Priya Raman", enrolled: -96, plan: "PIF", paid: 129900, due: 129900, state: "paid" },
  { name: "Callum Ferguson", enrolled: -74, plan: "deposit", paid: 159900, due: 159900, state: "paid" },
  { name: "Sophie Mensah", enrolled: -48, plan: "PIF", paid: 109900, due: 109900, state: "due" },
  { name: "Marcus Bell", enrolled: -36, plan: "PIF", paid: 109900, due: 109900, state: "due" },
  { name: "Aisha Karim", enrolled: -21, plan: "deposit", paid: 99900, due: 159900, state: "accruing" },
  { name: "Tom Whelan", enrolled: -6, plan: "deposit", paid: 59900, due: 159900, state: "accruing" },
] as const;

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
let paid = 0, due = 0, accruing = 0;
for (const l of LEARNERS) {
  if (l.state === "paid") paid += 50000;
  else if (l.state === "due") due += 50000;
  else accruing += 50000;
  console.log(
    `  ${day(l.enrolled).slice(0, 10)}  ${l.name.padEnd(20)} ${l.plan.padEnd(8)} ` +
      `£${(l.paid / 100).toFixed(0).padStart(4)}/${(l.due / 100).toFixed(0).padStart(4)}  commission ${l.state}`
  );
}
console.log(`\n  ${LEARNERS.length} enrolments · £${paid / 100} paid · £${due / 100} ready to pay · £${accruing / 100} accruing`);
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
    promo_code: "NORTHGATEPT",
    legacy_referral_names: [GYM],
    commission_terms: "instalment_2",
    is_demo: true,
    contact_name: "Demo Account",
    contact_email: LOGIN_EMAIL,
    bank_account_name: "Northgate Strength Ltd",
    bank_sort_code: "040004",
    bank_account_number: "12345678",
    bank_details_updated_at: day(-150),
  }),
});
console.log("\npartner created");

// One payout covering everything already settled, so the payments page shows a
// real history rather than a bare total.
const settled = LEARNERS.filter((l) => l.state === "paid");
const [payout] = await api("pp_payouts", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    partner_id: partner.id,
    period_label: "Paid " + new Date(day(-60)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    total_pence: settled.length * 50000,
    status: "paid",
    reference: "bank-transfer",
    paid_at: day(-60),
  }),
});

for (const l of LEARNERS) {
  const enrolledAt = day(l.enrolled);
  // Mirrors the real rules: released 30 days after enrolment for pay-in-full,
  // and held until the second instalment on a deposit plan.
  const release = new Date(enrolledAt);
  release.setUTCDate(release.getUTCDate() + 30);
  const releaseAt = l.state === "accruing" && l.plan === "deposit" && l.paid < 99900 ? null : release.toISOString();

  await api("pp_sales", {
    method: "POST",
    body: JSON.stringify({
      partner_id: partner.id,
      stripe_session_id: `cs_demo_${crypto.randomBytes(8).toString("hex")}`,
      learner_name: l.name,
      learner_email: `${l.name.toLowerCase().replace(/\s+/g, ".")}@example.invalid`,
      plan_type: l.plan,
      amount_paid_pence: l.paid,
      amount_due_pence: l.due,
      status: "confirmed",
      commission_pence: 50000,
      commission_status: l.state === "paid" ? "paid" : "accruing",
      commission_release_at: l.state === "accruing" ? releaseAt : release.toISOString(),
      payout_id: l.state === "paid" ? payout.id : null,
      enrolled_at: enrolledAt,
    }),
  });
}
console.log(`${LEARNERS.length} sales + 1 payout created`);

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
      // No forced password change and no walkthrough: this account is for
      // recording, and both would interrupt the take.
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
