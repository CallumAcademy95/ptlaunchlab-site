import Link from "next/link";
import { requirePartner, partnerAcademyUrl } from "@/app/lib/partner-auth";
import { getPackResources, isPreviewable } from "@/app/lib/partner-resources";
import { applyPlaybookTokens } from "@/app/lib/partner-playbook-tokens";
import { AD_COPY, ORGANIC_COPY, MEMBER_EMAIL, OUTREACH, CAMPAIGN } from "@/scripts/lib/october-campaign.mjs";
import CopyButton from "../CopyButton";

// Your October Academy Campaign.
//
// The launch email sends a partner straight here, and the whole point is that
// they do not land in a resource library and go hunting. Everything for the
// month is on one page in the order they need it: see the ad, copy the words,
// take the link, set it up, or promote it without spending anything.
//
// Six of the nine partners had never logged in at all before 29 September, so
// this page assumes no familiarity with the portal and no appetite for reading.
// Click, download, copy, launch.
//
// The £500 commission figure deliberately does NOT appear here. It belongs in
// the email, which is private to the owner — a portal page is one screen-share
// away from being seen by staff.

export const dynamic = "force-dynamic";

const PACK = "campaign-october-two-qualifications";

export default async function OctoberCampaignPage() {
  const { partner } = await requirePartner();
  const academyUrl = partnerAcademyUrl(partner);

  const tokens = {
    gymName: partner.gym_name,
    town: partner.gym_name, // overwritten below when we have a real town
    promoCode: partner.promo_code ?? "",
    academyUrl: academyUrl ?? "",
    firstName: "there",
  };

  // The ad copy says "your gym in {{town}}". Falling back to the gym name would
  // read "your gym in Ebor Fitness", so if there is no town the sentence is
  // dropped rather than rendered wrong.
  const packs = await getPackResources(partner.id);
  const creative = (packs.get(PACK) ?? []).filter((r) => r.partner_id === partner.id);

  const t = (s: string) => applyPlaybookTokens(s, tokens);
  const primaryText = t(AD_COPY.primaryText).replace(/\n\nTwo qualifications\. One course\. Through your gym in .*?\.\n/, "\n\nTwo qualifications. One course.\n");

  const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <section className="rounded-xl bg-card border border-white/10 p-6">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-gold font-bold text-lg">{n}</span>
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-xl bg-gradient-to-br from-[#0B2A48] to-[#072B4A] border border-gold/30 p-7">
        <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">
          {CAMPAIGN.title}
        </p>
        <h1 className="text-white font-bold text-3xl">{partner.gym_name}</h1>
        <p className="text-soft mt-3 text-lg">{CAMPAIGN.goal}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {[
            { k: "Recommended spend", v: `£${CAMPAIGN.recommendedSpendGbp}`, s: "your own ad account" },
            { k: "Setup time", v: `~${CAMPAIGN.setupMinutes} min`, s: "once, then leave it" },
            { k: "Radius", v: `${CAMPAIGN.radiusMiles} miles`, s: "around your gym" },
          ].map((x) => (
            <div key={x.k} className="rounded-lg bg-black/20 border border-white/10 px-4 py-3">
              <div className="text-soft text-[10px] uppercase tracking-widest font-bold">{x.k}</div>
              <div className="text-white font-bold text-xl mt-1">{x.v}</div>
              <div className="text-soft text-[11px]">{x.s}</div>
            </div>
          ))}
        </div>

        <p className="text-soft text-sm mt-5 leading-relaxed">
          Spending is optional. If you would rather not put money behind it this month,
          jump to <span className="text-white font-semibold">5. Promote it for free</span> —
          that section is the one that matters most.
        </p>
      </div>

      {/* 1 — CREATIVE */}
      <Section n={1} title="Download your advert">
        {creative.length === 0 ? (
          <p className="text-soft text-sm">
            Your October artwork is being finished. It will appear here — or find everything
            in <Link href="/partners/resources" className="text-gold">Resources</Link>.
          </p>
        ) : (
          <>
            <p className="text-soft text-sm mb-4">
              Made for {partner.gym_name}. The square one is for feed, the tall one for
              Stories and Reels. Use both.
            </p>
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 mb-4">
              <p className="text-amber-200 text-sm leading-relaxed">
                <strong>One thing to check before you run it.</strong> Your artwork uses a
                photograph of {partner.gym_name}. If anyone is recognisable in it, please make
                sure you hold their permission to use it in advertising. It is your gym, your
                members and your ad account — we can&apos;t confirm that from here. Tell us and
                we will swap the image the same day.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {creative.map((r) => (
                <div key={r.id} className="rounded-lg border border-white/10 overflow-hidden bg-black/20">
                  {isPreviewable(r.mime) && r.storage_path && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/partners/download/${r.id}`}
                      alt={r.title}
                      className="w-full block"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <span className="text-white text-sm font-semibold">{r.title}</span>
                    <a
                      href={`/partners/download/${r.id}`}
                      download
                      className="px-4 py-2 rounded-full bg-gold text-deep text-xs font-bold whitespace-nowrap"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* 2 — COPY */}
      <Section n={2} title="Copy your advert">
        <p className="text-soft text-sm mb-4">
          Nothing to write. Paste these three straight into Meta.
        </p>
        {[
          { label: "Primary text", value: primaryText, multiline: true },
          { label: "Headline", value: t(AD_COPY.headlineA) },
          { label: "Headline (alternative — run both)", value: t(AD_COPY.headlineB) },
          { label: "Description", value: t(AD_COPY.description) },
        ].map((f) => (
          <div key={f.label} className="mb-4">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-soft text-xs font-semibold">{f.label}</span>
              <CopyButton value={f.value} />
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white text-sm whitespace-pre-line">
              {f.value}
            </div>
          </div>
        ))}
      </Section>

      {/* 3 — URL */}
      <Section n={3} title="Send people here">
        {academyUrl ? (
          <>
            <p className="text-soft text-sm mb-3">
              Your own academy page. Use this as the ad&apos;s destination — not our main site.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <code className="rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-gold text-sm break-all">
                {academyUrl}
              </code>
              <CopyButton value={academyUrl} label="Copy link" />
              <a href={academyUrl} target="_blank" rel="noopener noreferrer" className="text-soft text-sm underline">
                Open page
              </a>
            </div>
          </>
        ) : (
          <p className="text-soft text-sm">Your academy page is not set up yet — tell us and we will sort it.</p>
        )}
      </Section>

      {/* 4 — SETUP */}
      <Section n={4} title="Set up your Meta campaign">
        <p className="text-soft text-sm mb-4">
          Two ways to do this. Pick whichever fits.
        </p>

        <div className="rounded-lg border border-gold/30 bg-gold/5 p-5 mb-4">
          <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">Option A — our recommended setup</p>
          <p className="text-soft text-sm mb-3">If you have not run local ads before, start here.</p>
          <ul className="text-white text-sm space-y-1.5">
            <li>Objective: <strong>Traffic</strong>, optimised for landing page views</li>
            <li>Location: a pin on {partner.gym_name}, <strong>{CAMPAIGN.radiusMiles} mile radius</strong></li>
            <li>Age 18–40 · all genders · <strong>leave detailed targeting empty</strong></li>
            <li>One campaign, one ad set, both creatives in it</li>
            <li>About £10 a day for a fortnight</li>
          </ul>
          <p className="text-soft text-xs mt-3">
            Do not split £{CAMPAIGN.recommendedSpendGbp} across several ad sets, and do not make
            separate male and female ad sets unless you have your own data telling you to.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 p-5 mb-4">
          <p className="text-soft text-[10px] font-bold tracking-widest uppercase mb-2">Option B — use your own audience</p>
          <p className="text-soft text-sm">
            Already advertising successfully for the gym? Use the audience you know works.
            Keep our creative, our copy and your academy page. You know your ad account
            better than we do.
          </p>
        </div>

        <details className="rounded-lg border border-white/10 p-5">
          <summary className="text-white font-semibold cursor-pointer">Show me how to set it up</summary>
          <div className="text-soft text-sm mt-4 space-y-3 leading-relaxed">
            <p>
              The full walkthrough — every field, what to click, and the two things that
              quietly waste the budget — is in your playbook under{" "}
              <Link href="/partners/playbook" className="text-gold">Meta ads — setting yours up</Link>.
            </p>
            <p>
              Short version: Ads Manager → Create → Traffic → set the location pin and radius →
              age 18–40 → leave detailed targeting alone → upload both images → paste the copy
              above → destination is your academy page → £10/day → publish.
            </p>
            <p className="text-white">
              Give it two weeks before you judge it, and do not switch it off on day three —
              Meta needs a few days of steady delivery before it settles.
            </p>
          </div>
        </details>
      </Section>

      {/* 5 — FREE */}
      <Section n={5} title="Promote it for free">
        <p className="text-soft text-sm mb-5">
          The £{CAMPAIGN.recommendedSpendGbp} campaign is optional. Promoting your academy is not.
          These cost nothing and the last one works best.
        </p>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-white text-sm font-semibold">Post it</span>
              <CopyButton value={t(ORGANIC_COPY.post)} label="Copy caption" />
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-soft text-sm whitespace-pre-line">
              {t(ORGANIC_COPY.post)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-white text-sm font-semibold">Email your members</span>
              <CopyButton value={t(MEMBER_EMAIL.body)} label="Copy email" />
            </div>
            <p className="text-soft text-xs mb-1.5">Subject: {t(MEMBER_EMAIL.subject)}</p>
            <div className="rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-soft text-sm whitespace-pre-line">
              {t(MEMBER_EMAIL.body)}
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-2">Put it inside the gym</p>
            <p className="text-soft text-sm">
              Screens, the poster, the QR code — all in{" "}
              <Link href="/partners/resources" className="text-gold">Resources</Link>.
            </p>
          </div>

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-5">
            <p className="text-white text-sm font-semibold mb-2">Speak to people</p>
            <p className="text-soft text-sm mb-3">{OUTREACH.ownerQuestion}</p>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-soft text-xs font-semibold">What to say</span>
              <CopyButton value={OUTREACH.opener} />
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white text-sm italic mb-3">
              “{OUTREACH.opener}”
            </div>
            <ul className="text-soft text-sm space-y-1 list-disc list-inside mb-3">
              {OUTREACH.thenWhat.map((l: string) => <li key={l}>{l}</li>)}
            </ul>
            <p className="text-white text-sm font-semibold mb-1.5">Who to look for</p>
            <ul className="text-soft text-sm space-y-1 list-disc list-inside">
              {OUTREACH.whoToLookFor.map((l: string) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        </div>
      </Section>

      <p className="text-soft text-sm">
        Stuck on any of it? Reply to the email this came from, or ring us — we would rather
        set it up with you than have it sit there.
      </p>
    </div>
  );
}
