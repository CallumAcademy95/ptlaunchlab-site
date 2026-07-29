import { requirePartner } from "@/app/lib/partner-auth";
import {
  getPartnerResources,
  RESOURCE_CATEGORIES,
  formatFileSize,
  isNewResource,
  isPreviewable,
  type PartnerResource,
} from "@/app/lib/partner-resources";

function ResourceRow({ resource, gymName }: { resource: PartnerResource; gymName: string }) {
  const size = formatFileSize(resource.file_size);
  const preview = isPreviewable(resource.mime) && resource.storage_path;

  return (
    <div className="px-5 py-4 flex items-start justify-between gap-4">
      {preview && (
        <a
          href={`/partners/download/${resource.id}?inline=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 block w-24 h-24 rounded-lg overflow-hidden bg-deep border border-white/10 hover:border-gold transition-colors"
          title="Open full size"
        >
          {/* Plain <img>: the source is a one-minute signed URL, so Next's image
              optimiser would cache a URL that's dead before it's reused. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/partners/download/${resource.id}?inline=1`}
            alt={resource.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </a>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold">{resource.title}</p>
          {isNewResource(resource.created_at) && (
            <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/40 text-[10px] font-bold">
              New
            </span>
          )}
          {resource.partner_id && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-soft border border-white/15 text-[10px] font-semibold">
              Made for {gymName}
            </span>
          )}
        </div>
        {resource.description && (
          <p className="text-soft text-sm mt-1 leading-relaxed">{resource.description}</p>
        )}
        {(size || resource.version) && (
          <p className="text-soft text-xs mt-1">
            {[size, resource.version].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <a
        href={`/partners/download/${resource.id}`}
        className="px-4 py-2 rounded-full border border-white/20 text-white text-xs font-semibold hover:border-gold hover:text-gold transition-colors shrink-0 whitespace-nowrap"
      >
        {resource.external_url ? "Open" : "Download"}
      </a>
    </div>
  );
}

export default async function ResourcesPage() {
  const { partner } = await requirePartner();
  const resources = await getPartnerResources(partner.id);

  const byCategory = RESOURCE_CATEGORIES.map((c) => ({
    ...c,
    items: resources.filter((r) => r.category === c.key),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Resources</h2>
        <p className="text-soft text-sm leading-relaxed max-w-2xl">
          Everything you need to promote your academy in the gym — branded, print-ready, and yours to
          use.
        </p>
      </div>

      {byCategory.length === 0 ? (
        <div className="rounded-xl bg-card border border-white/10 p-6">
          <p className="text-white font-semibold mb-1">We&rsquo;re putting your pack together.</p>
          <p className="text-soft text-sm leading-relaxed">
            Posters and QR cards for the floor, social graphics, a screen advert for your gym TV, and
            scripts for your staff — all branded to {partner.gym_name}. You&rsquo;ll get an email the
            moment the first ones land. Need something specific before then?{" "}
            <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
              Just ask
            </a>
            .
          </p>
        </div>
      ) : (
        byCategory.map((category) => (
          <section key={category.key}>
            <h3 className="text-white font-bold text-base">{category.label}</h3>
            <p className="text-soft text-xs mb-3">{category.blurb}</p>
            <div className="rounded-xl bg-card border border-white/10 divide-y divide-white/10">
              {category.items.map((r) => (
                <ResourceRow key={r.id} resource={r} gymName={partner.gym_name} />
              ))}
            </div>
          </section>
        ))
      )}

      <p className="text-soft text-xs leading-relaxed">
        Download links are personal to your account and expire after a minute — if you need to share
        something with a colleague, give them their own login rather than forwarding the link.{" "}
        <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
          We&rsquo;ll set one up
        </a>
        .
      </p>
    </div>
  );
}
