import { requirePartner } from "@/app/lib/partner-auth";
import { getPlaybook, PLAYBOOK_TYPES } from "@/app/lib/partner-playbook";
import CopyButton from "../CopyButton";

export default async function PlaybookPage() {
  const { partner } = await requirePartner();
  const entries = await getPlaybook();

  const grouped = PLAYBOOK_TYPES.map((t) => ({
    ...t,
    items: entries.filter((e) => e.type === t.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Playbook</h2>
        <p className="text-soft text-sm leading-relaxed max-w-2xl">
          The bits that actually move the needle — what to post, what to say, and when to push. Copy
          it, swap in {partner.gym_name}, use it.
        </p>
      </div>

      {grouped.length === 0 ? (
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
        grouped.map((group) => (
          <section key={group.key}>
            <h3 className="text-white font-bold text-base mb-3">{group.label}</h3>
            <div className="space-y-4">
              {group.items.map((entry) => (
                <article key={entry.slug} className="rounded-xl bg-card border border-white/10 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div>
                      <h4 className="text-white font-semibold">{entry.title}</h4>
                      {entry.whenToUse && (
                        <p className="text-soft text-xs mt-0.5">Use it when: {entry.whenToUse}</p>
                      )}
                    </div>
                    {entry.channel && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-soft border border-white/15 text-[10px] font-semibold shrink-0">
                        {entry.channel}
                      </span>
                    )}
                  </div>

                  {/* Authored by us and committed to the repo — never user input. */}
                  <div
                    className="playbook-body text-soft text-sm leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: entry.html }}
                  />

                  {entry.snippets.length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {entry.snippets.map((snippet, i) => (
                        <CopyButton
                          key={i}
                          value={snippet}
                          label={entry.snippets.length > 1 ? `Copy ${i + 1}` : "Copy"}
                          className="!text-xs !py-1.5"
                        />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
