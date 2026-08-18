/**
 * Tell existing gym partners the course guide has landed in their Resource Drive.
 *
 *   npx tsx scripts/announce-course-guide.mts                    # dry run, prints who and what
 *   npx tsx scripts/announce-course-guide.mts --to=hitio-orpington
 *   npx tsx scripts/announce-course-guide.mts --email=you@x.com --as=ebor
 *   npx tsx scripts/announce-course-guide.mts --apply            # send to everyone
 *
 * Same shape as announce-partner-portal.mts: sends to the address on each
 * partner's login, skips gyms without one, excludes the demo gym.
 *
 * DO NOT SEND BEFORE THE BRANCH IS DEPLOYED. The resource row is already live in
 * the database, but production's RESOURCE_CATEGORIES has no 'delivery' key, so
 * the portal filters the section out. An email arriving first points nine gyms
 * at a page that does not show the thing it promises.
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

let targets = rows
  .filter((r) => r.partner.slug !== "demo")
  .filter((r) => !ONLY || r.partner.slug === ONLY);

if (TEST_EMAIL) {
  const model = rows.find((r) => r.partner.slug === TEST_AS) ?? rows[0];
  if (!model) {
    console.error("No partners to model the test on.");
    process.exit(1);
  }
  targets = [{ ...model, email: TEST_EMAIL }];
}

if (!targets.length) {
  console.error(ONLY ? `No login for "${ONLY}".` : "No partner logins found.");
  process.exit(1);
}

const SUBJECT = "New in your partner portal: your learner's course, explained";

function html(gymName: string, firstName: string | null) {
  const hi = firstName ? `Hi ${firstName},` : "Hi,";
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
        There's a new document in <strong>${gymName}</strong>'s Resource Drive, under a new section
        called <strong>Supporting your learners</strong>.
      </p>

      <p style="${p}">
        Everything we've given you so far has been about getting members onto the course. This is the
        other half &mdash; what actually happens to them once they're on it, so that when a member
        asks you a question at the desk, you can answer it.
      </p>

      <div style="border-left:4px solid #F5C518;background:#FFFBEC;padding:16px 20px;margin:22px 0;">
        <div style="color:#072B4A;font-size:15px;font-weight:700;margin-bottom:4px;">Your learner's course, explained</div>
        <div style="color:#4A5A6B;font-size:14px;line-height:1.55;">
          Eight pages, with real screenshots of the platform your members log into.
        </div>
      </div>

      <div style="${h}">What's in it</div>
      <ul style="margin:0 0 18px;padding-left:20px;color:#1E2A38;font-size:15px;line-height:1.75;">
        <li><strong>How the platform works</strong> &mdash; what a learner sees when they log in, and how they move through it</li>
        <li><strong>What a learner actually does</strong> &mdash; the loop of work, submit, feedback</li>
        <li><strong>The 12 units</strong> &mdash; what the qualification covers, start to finish</li>
        <li><strong>The practicals, in your gym</strong> &mdash; the page worth reading twice: what gets filmed, what doesn't, and what your gym needs to provide</li>
        <li><strong>Where you fit</strong> &mdash; what's genuinely yours to help with, and what to leave to us</li>
      </ul>

      <div style="${h}">The page to read first</div>
      <p style="${p}">
        Page 7. Unit 10 needs a filmed session in your gym &mdash; up to ten clips, ninety minutes at
        most &mdash; plus a programme card. Unit 6 needs a programme card and <strong>no filming</strong>.
        If your staff know that before a learner asks, you'll save everyone a fortnight.
      </p>

      <div style="${h}">Nothing about our agreement changes</div>
      <p style="${p}">
        Same commission, same terms. This is information, not a new ask.
      </p>

      <div style="text-align:center;margin:30px 0 22px;">
        <a href="https://ptlaunchlab.co.uk/partners/resources"
           style="display:inline-block;padding:15px 38px;background:#F5C518;color:#0B1F38;font-weight:700;font-size:15px;border-radius:50px;text-decoration:none;">
          Open your Resource Drive
        </a>
      </div>

      <!-- Phone hardcoded: this is a standalone script, so it does not go
           through app/lib/contactDetails.ts. Update it by hand when the number
           changes — see the note at the top of that file. -->
      <p style="margin:26px 0 0;color:#7A8899;font-size:14px;line-height:1.6;">
        If anything in it doesn't match what you were told when you signed up, tell us &mdash; reply to
        this, or call <a href="tel:+441977285014" style="color:#0B1F38;font-weight:600;">01977 285014</a>.
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
  console.log(`  ${t.partner.gym_name.padEnd(24)} ${t.email}`);
}

if (!APPLY && !TEST_EMAIL) {
  console.log(`\nSubject: ${SUBJECT}`);
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
      subject: SUBJECT,
      html: html(t.partner.gym_name, firstName),
    });
    console.log(`  sent   ${t.partner.gym_name.padEnd(24)} ${t.email}`);
  } catch (err) {
    console.log(`  FAILED ${t.partner.gym_name.padEnd(24)} ${t.email} — ${String(err).slice(0, 120)}`);
  }
}
