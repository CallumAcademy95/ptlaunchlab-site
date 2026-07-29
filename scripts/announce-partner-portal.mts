/**
 * Announce the partner portal to existing gym partners.
 *
 *   npx tsx scripts/announce-partner-portal.mts                 # dry run, prints who and what
 *   npx tsx scripts/announce-partner-portal.mts --to=ebor       # one partner only
 *   npx tsx scripts/announce-partner-portal.mts --email=you@x.com --as=ebor
 *                                                              # test copy to yourself
 *   npx tsx scripts/announce-partner-portal.mts --apply         # send to everyone
 *
 * Sends to the address on each partner's login, because that's the person who
 * will actually be using it. Skips any gym without one — there's no point
 * announcing a portal to someone who has nothing to sign into.
 *
 * Deliberately not automatic and deliberately not part of any flow. This goes to
 * eight real businesses once.
 */

import { readFileSync } from "node:fs";
import { Resend } from "resend";

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
const ONLY = args.to as string | undefined;
/** Send a test copy somewhere that isn't a partner, rendered as one of the gyms. */
const TEST_EMAIL = args.email as string | undefined;
const TEST_AS = (args.as as string | undefined) ?? "ebor";

const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

interface Row {
  email: string;
  full_name: string | null;
  partner: { slug: string; gym_name: string };
}

const rows: Row[] = await (
  await fetch(
    `${URL_BASE}/rest/v1/pp_partner_users?select=email,full_name,partner:pp_partners!inner(slug,gym_name)`,
    { headers: H }
  )
).json();

let targets = rows.filter((r) => !ONLY || r.partner.slug === ONLY);

if (TEST_EMAIL) {
  // Borrow a real gym's details so the test shows exactly what they'll get,
  // then redirect it. Sends immediately — a test nobody receives is useless.
  const model = rows.find((r) => r.partner.slug === TEST_AS) ?? rows[0];
  if (!model) { console.error("No partners to model the test on."); process.exit(1); }
  targets = [{ ...model, email: TEST_EMAIL }];
}

if (!targets.length) {
  console.error(ONLY ? `No login for "${ONLY}".` : "No partner logins found.");
  process.exit(1);
}

function html(gymName: string, firstName: string | null) {
  const hi = firstName ? `Hi ${firstName},` : "Hi,";
  // Light body with a navy header — the layout partners already recognise from
  // our other mail. The dark-on-dark transactional style is fine for a receipt
  // and hard work for something this long.
  const p = `margin:0 0 16px;color:#1E2A38;font-size:15px;line-height:1.65;`;
  const h = `margin:26px 0 10px;color:#072B4A;font-size:17px;font-weight:700;`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <div style="background:#0B1F38;padding:22px 32px;">
      <span style="color:#F5C518;font-size:13px;font-weight:800;letter-spacing:.14em;">PT LAUNCH LAB</span>
    </div>

    <div style="padding:32px;">
      <p style="${p}">${hi}</p>

      <p style="${p}">
        We've built something for our gym partners, and <strong>${gymName}</strong> has an account waiting.
      </p>

      <p style="${p}">
        Until now, if you wanted to know whether anyone had enrolled through your academy — or when
        your next payment was due — you had to ask us. That's the bit we've fixed.
      </p>

      <div style="border-left:4px solid #F5C518;background:#FFFBEC;padding:16px 20px;margin:22px 0;">
        <div style="color:#072B4A;font-size:15px;font-weight:700;margin-bottom:4px;">Your partner portal</div>
        <div style="color:#4A5A6B;font-size:14px;line-height:1.55;">
          One login. Your enrolments, your payments, your resources and a playbook — all in one place.
        </div>
      </div>

      <div style="${h}">What's in it</div>
      <ul style="margin:0 0 18px;padding-left:20px;color:#1E2A38;font-size:15px;line-height:1.75;">
        <li><strong>Your enrolments, live</strong> — every member who joins through your link, as it happens</li>
        <li><strong>What you're owed, and when</strong> — commission per enrolment, plus everything already paid</li>
        <li><strong>Your resources</strong> — posters, member handouts and a video for your gym TV, branded to ${gymName}</li>
        <li><strong>A playbook</strong> — social posts, member emails, and what your team should say when someone asks</li>
        <li><strong>Your signed agreement</strong> — so you never have to go looking for it</li>
      </ul>

      <div style="${h}">Nothing about our agreement changes</div>
      <p style="${p}">
        Same commission, same terms, no cost to you. This just means you can see it without emailing us.
      </p>

      <div style="text-align:center;margin:30px 0 22px;">
        <a href="https://ptlaunchlab.co.uk/partners/login"
           style="display:inline-block;padding:15px 38px;background:#F5C518;color:#0B1F38;font-weight:700;font-size:15px;border-radius:50px;text-decoration:none;">
          Sign in to your portal
        </a>
        <div style="color:#7A8899;font-size:13px;margin-top:12px;">
          Your login details are in a separate email.
        </div>
      </div>

      <p style="${p}">
        First time in, you'll pick your own password and get a short walkthrough of where everything
        is. While you're there, it's worth adding your bank details on the Payments page — then
        nothing ever waits on us chasing you for them.
      </p>

      <p style="margin:26px 0 0;color:#7A8899;font-size:14px;line-height:1.6;">
        Any questions, just reply to this — or call
        <a href="tel:01977365001" style="color:#0B1F38;font-weight:600;">01977 365001</a>.
      </p>
    </div>

    <div style="background:#0B1F38;padding:18px 32px;text-align:center;">
      <div style="color:#7C90A8;font-size:12px;line-height:1.6;">
        PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH
      </div>
    </div>
  </div>
</body></html>`;
}

console.log(`${APPLY ? "SENDING" : "DRY RUN"} — ${targets.length} partner(s)\n`);
for (const t of targets) {
  console.log(`  ${t.partner.gym_name.padEnd(22)} ${t.email}`);
}

if (!APPLY && !TEST_EMAIL) {
  console.log("\nSubject: Your PT Launch Lab partner portal is live");
  console.log("\nNothing sent. Add --apply, or --to=<slug> to send one first.");
  process.exit(0);
}

if (!process.env.RESEND_API_KEY) {
  console.error("\nRESEND_API_KEY not set — nothing sent.");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("");
for (const t of targets) {
  const firstName = t.full_name?.trim().split(/\s+/)[0] ?? null;
  try {
    await resend.emails.send({
      from: "PT Launch Lab Partnerships <partnerships@ptlaunchlab.co.uk>",
      to: t.email,
      replyTo: "info@ptlaunchlab.co.uk",
      subject: "Your PT Launch Lab partner portal is live",
      html: html(t.partner.gym_name, firstName),
    });
    console.log(`  sent   ${t.partner.gym_name.padEnd(22)} ${t.email}`);
  } catch (err) {
    console.log(`  FAILED ${t.partner.gym_name.padEnd(22)} ${t.email} — ${String(err).slice(0, 120)}`);
  }
}
