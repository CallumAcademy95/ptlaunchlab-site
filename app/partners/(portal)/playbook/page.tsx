import Link from "next/link";
import { requirePartner } from "@/app/lib/partner-auth";
import { getPlaybook, PLAYBOOK_TYPES, type PlaybookEntry } from "@/app/lib/partner-playbook";
import { getPackResources, formatFileSize, type PartnerResource } from "@/app/lib/partner-resources";
import { tokensForGym } from "@/app/lib/partner-playbook-tokens";
import brands from "@/scripts/gym-brands.json";
import CopyButton from "../CopyButton";

type GymBrandEntry = {
  gymName: string;
  adTown?: string;
  promoCode: string | null;
  canonicalPath: string;
};

/**
 * Entries grouped by their channel, preserving the order they arrived in.
 *
 * Channel doubles as the sub-category: for scripts it's where the conversation
 * happens, for emails it's who receives it, for social it's the platform.
 * Whichever it is, it's the question someone has in mind when they open the
 * section — "what do I say at the front desk", "what goes to lapsed members".
 */
function groupByChannel(entries: PlaybookEntry[]): { channel: string | null; items: PlaybookEntry[] }[] {
  const groups: { channel: string | null; items: PlaybookEntry[] }[] = [];
  for (const entry of entries) {
    const existing = groups.find((g) => g.channel === entry.channel);
    if (existing) existing.items.push(entry);
    else groups.push({ channel: entry.channel, items: [entry] });
  }
  return groups;
}

/**
 * The artwork that belongs to this campaign, shown inside it.
 *
 * The whole point of a pack is that a partner opens January and finds the
 * poster and the screen slide already there, rather than being told to go and
 * look for them in Resources.
 */
function PackFiles({ files }: { files: PartnerResource[] }) {
  return (
    <div className="mt-5 rounded-lg border border-gold/30 bg-gold/5 p-4">
      <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">
        Everything for this campaign
      </p>
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-white text-sm font-semibold truncate">{f.title}</span>
              {formatFileSize(f.file_size) && (
                <span className="block text-soft text-[10px]">{formatFileSize(f.file_size)}</span>
              )}
            </span>
            <a
              href={`/partners/download/${f.id}`}
              className="px-3 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-semibold hover:border-gold hover:text-gold transition-colors shrink-0"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One entry, collapsed by default.
 *
 * Native <details> rather than React state: the whole page stays a server
 * component, it works before hydration, and browser find-in-page can still
 * reach the closed text — which matters when someone is hunting for a phrase
 * they half-remember.
 */
function EntryCard({ entry, pack }: { entry: PlaybookEntry; pack?: PartnerResource[] }) {
  return (
    <details className="group rounded-xl bg-card border border-white/10 open:border-white/20">
      <summary className="flex items-start gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="mt-1 text-soft text-xs transition-transform group-open:rotate-90 shrink-0"
        >
          ▶
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-white font-semibold group-hover:text-gold transition-colors">
            {entry.title}
          </span>
          {entry.whenToUse && (
            <span className="block text-soft text-xs mt-0.5">Use it when: {entry.whenToUse}</span>
          )}
        </span>
        {pack && pack.length > 0 ? (
          <span className="text-gold text-[10px] shrink-0 mt-1 whitespace-nowrap">
            {pack.length} file{pack.length === 1 ? "" : "s"}
          </span>
        ) : entry.snippets.length > 1 ? (
          <span className="text-soft text-[10px] shrink-0 mt-1">{entry.snippets.length} parts</span>
        ) : null}
      </summary>

      <div className="px-5 pb-5 pl-11">
        {/* Authored by us and committed to the repo — never user input. */}
        <div
          className="playbook-body text-soft text-sm leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />

        {(entry.snippets.length > 0 || entry.downloadId) && (
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            {entry.snippets.map((snippet, i) => (
              <CopyButton
                key={i}
                value={snippet}
                label={entry.snippets.length > 1 ? `Copy ${i + 1}` : "Copy"}
                className="!text-xs !py-1.5"
              />
            ))}
            {entry.downloadId && (
              <a
                href={`/partners/download/playbook/${entry.downloadId}`}
                className="px-4 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold hover:border-gold hover:text-gold transition-colors"
              >
                Download
              </a>
            )}
          </div>
        )}

        {pack && pack.length > 0 && <PackFiles files={pack} />}
      </div>
    </details>
  );
}

export default async function PlaybookPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { partner } = await requirePartner();
  const { section } = await searchParams;

  // A brand entry with no `adTown` (the demo tenant) is treated the same as no
  // brand entry at all — otherwise `town` comes back `undefined` and
  // `{{town}}` renders literally on screen instead of being substituted.
  const brand = (brands as Record<string, GymBrandEntry>)[partner.slug];
  const tokens =
    brand && brand.adTown
      ? tokensForGym({ ...brand, adTown: brand.adTown }, "https://ptlaunchlab.co.uk")
      : null;

  const [entries, packs] = await Promise.all([
    getPlaybook(tokens),
    getPackResources(partner.id),
  ]);

  // Only offer sections that actually have something in them — an empty tab is
  // a dead end that makes the whole library look unfinished.
  const sections = PLAYBOOK_TYPES.map((t) => ({
    ...t,
    count: entries.filter((e) => e.type === t.key).length,
  })).filter((t) => t.count > 0);

  const active = section && sections.some((s) => s.key === section) ? section : null;
  const visible = active ? entries.filter((e) => e.type === active) : entries;

  // Showing everything: keep the section headings so it stays navigable.
  // Showing one section: drop them and sub-group by channel instead.
  const blocks = active
    ? [{ label: null, groups: groupByChannel(visible) }]
    : sections.map((s) => ({
        label: s.label,
        groups: groupByChannel(entries.filter((e) => e.type === s.key)),
      }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Playbook</h2>
        <p className="text-soft text-sm leading-relaxed max-w-2xl">
          The bits that actually move the needle — what to post, what to say, and when to push. Copy
          it, swap in {partner.gym_name}, use it.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl bg-card border border-white/10 p-6">
          <p className="text-white font-semibold mb-1">We&rsquo;re writing this up now.</p>
          <p className="text-soft text-sm leading-relaxed">
            Social captions, member emails, front-desk scripts and campaign plays — all ready to copy
            and use. In the meantime, the single best thing you can do is put your QR code where
            members already stand still, and have your team mention it when someone asks about
            training.
          </p>
        </div>
      ) : (
        <>
          <nav aria-label="Playbook sections" className="flex items-center gap-2 flex-wrap">
            <Link
              href="/partners/playbook"
              aria-current={!active ? "page" : undefined}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !active
                  ? "border-gold text-gold bg-gold/10"
                  : "border-white/15 text-soft hover:text-white"
              }`}
            >
              Everything <span className="opacity-60">{entries.length}</span>
            </Link>
            {sections.map((s) => (
              <Link
                key={s.key}
                href={`/partners/playbook?section=${s.key}`}
                aria-current={active === s.key ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active === s.key
                    ? "border-gold text-gold bg-gold/10"
                    : "border-white/15 text-soft hover:text-white"
                }`}
              >
                {s.label} <span className="opacity-60">{s.count}</span>
              </Link>
            ))}
          </nav>

          {blocks.map((block, bi) => (
            <div key={block.label ?? bi} className="space-y-5">
              {block.label && (
                <h3 className="text-white font-bold text-base pt-2">{block.label}</h3>
              )}

              {block.groups.map((group, gi) => (
                <section key={group.channel ?? gi} className="space-y-3">
                  {group.channel && (
                    <div className="flex items-center gap-3">
                      <h4 className="text-gold text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">
                        {group.channel}
                      </h4>
                      <span aria-hidden className="h-px bg-white/10 flex-1" />
                      <span className="text-soft text-[10px]">{group.items.length}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {group.items.map((entry) => (
                      <EntryCard key={entry.slug} entry={entry} pack={packs.get(entry.slug)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
