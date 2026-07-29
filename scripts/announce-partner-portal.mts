/**
 * Announce the partner portal to existing gym partners.
 *
 *   npx tsx scripts/announce-partner-portal.mts                 # dry run, prints who and what
 *   npx tsx scripts/announce-partner-portal.mts --to=ebor       # send yourself one first
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

const targets = rows.filter((r) => !ONLY || r.partner.slug === ONLY);
if (!targets.length) {
  console.error(ONLY ? `No login for "${ONLY}".` : "No partner logins found.");
  process.exit(1);
}

function html(gymName: string, firstName: string | null) {
  const hi = firstName ? `Hi ${firstName},` : "Hi,";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Your partner portal is live</div>
    </div>

    <div style="background:#0A2A44;padding:28px;border-radius:0 0 12px 12px;">
      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 18px;">${hi}</p>

      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 18px;">
        We've built something for our gym partners and <strong style="color:#ffffff;">${gymName}</strong>
        has an account waiting.
      </p>

      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 22px;">
        Until now, if you wanted to know whether anyone had enrolled through your academy — or when
        your next payment was due — you had to ask us. That's the bit we've fixed.
      </p>

      <div style="background:#061F36;border:1px solid #1A3A5C;border-radius:10px;padding:22px;margin-bottom:22px;">
        <div style="color:#F5C518;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">What's in it</div>
        <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">Your enrolments, live</p>
        <p style="color:#8CA3BF;font-size:14px;line-height:1.5;margin:0 0 14px;">Every member who enrols through your academy link, as it happens. No waiting for a summary.</p>

        <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">What you're owed, and when</p>
        <p style="color:#8CA3BF;font-size:14px;line-height:1.5;margin:0 0 14px;">Commission per enrolment, when it becomes payable, and a record of everything already paid.</p>

        <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">Your resources</p>
        <p style="color:#8CA3BF;font-size:14px;line-height:1.5;margin:0 0 14px;">Posters, your member handout, a video for your gym TV — all branded to ${gymName}. Your signed agreement's in there too.</p>

        <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">A playbook</p>
        <p style="color:#8CA3BF;font-size:14px;line-height:1.5;margin:0;">Social posts, member emails and what your team should say when someone asks about it. Copy it, swap your gym's name in, use it.</p>
      </div>

      <p style="color:#8CA3BF;font-size:15px;line-height:1.6;margin:0 0 22px;">
        <strong style="color:#ffffff;">Nothing about our agreement changes.</strong> Same commission,
        same terms, no cost. This just means you can see it without emailing us.
      </p>

      <div style="text-align:center;margin-bottom:22px;">
        <a href="https://ptlaunchlab.co.uk/partners/login" style="display:inline-block;padding:14px 32px;background:#F5C518;color:#072B4A;font-weight:700;font-size:15px;border-radius:50px;text-decoration:none;">
          Sign in to your portal
        </a>
      </div>

      <p style="color:#8CA3BF;font-size:14px;line-height:1.6;margin:0 0 18px;">
        Your login details are in a separate email — we've kept them apart from this one on purpose.
        First time in, you'll be asked to pick your own password, and there's a two-minute walkthrough
        of where everything is.
      </p>

      <p style="color:#8CA3BF;font-size:14px;line-height:1.6;margin:0;">
        One thing worth doing while you're in: <strong style="color:#ffffff;">add your bank details</strong>
        on the Payments page, so nothing ever waits on us chasing you for them.
      </p>

      <p style="color:#4A6280;font-size:13px;line-height:1.6;margin:22px 0 0;">
        Any questions, just reply — or call <a href="tel:01977365001" style="color:#F5C518;">01977 365001</a>.
      </p>
    </div>

    <div style="text-align:center;padding:16px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · Unit 3, Royals Business Park, Pontefract WF8 4AH
    </div>
  </div>
</body></html>`;
}

console.log(`${APPLY ? "SENDING" : "DRY RUN"} — ${targets.length} partner(s)\n`);
for (const t of targets) {
  console.log(`  ${t.partner.gym_name.padEnd(22)} ${t.email}`);
}

if (!APPLY) {
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
