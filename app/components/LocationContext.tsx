import { getLocationContent } from "@/app/lib/locationContent";

interface Props {
  locationSlug: string;
  locationName: string;
  region: string;
}

export default function LocationContext({ locationSlug, locationName, region }: Props) {
  const content = getLocationContent(locationSlug, region);

  return (
    <section className="bg-[#072B4A] py-16 md:py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          Your local market
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          Becoming a Personal Trainer in {locationName}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <p className="text-[#8CA3BF] leading-relaxed">{content.marketContext}</p>
            <p className="text-[#8CA3BF] leading-relaxed">{content.opportunity}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3">
                Why study online from {locationName}?
              </h3>
              <p className="text-[#8CA3BF] text-sm leading-relaxed">{content.whyOnline}</p>
            </div>

            <div className="bg-[#0D3559] border border-[#F5C518]/20 rounded-2xl p-6">
              <h3 className="text-[#F5C518] font-bold mb-3">
                The {locationName} PT market
              </h3>
              <p className="text-[#8CA3BF] text-sm leading-relaxed">{content.marketSize}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 border-t border-[#3B82F6]/15 pt-8">
          {[
            { q: "How long does it take to qualify?", a: "Most students complete the NCFE Level 2 & 3 in 4–8 weeks studying part-time. The course is self-paced and fully online, so you set the schedule." },
            { q: "Is the qualification recognised by gyms?", a: "NCFE Level 3 is regulated by Ofqual under reference 603/4388/6 and carries CIMSPA recognition. It sits on Ofqual's public register, so an employer or insurer can check it without taking your word for it." },
            { q: "Do I get help finding work after qualifying?", a: "Yes. A guaranteed gym interview is built into the course: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. A warm introduction, not a generic CV drop." },
          ].map((item) => (
            <div key={item.q} className="bg-[#0D3559] border border-[#3B82F6]/20 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
              <p className="text-[#8CA3BF] text-xs leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
