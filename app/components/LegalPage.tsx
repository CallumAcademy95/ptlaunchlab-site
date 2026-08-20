import Nav from "./Nav";
import Footer from "./Footer";
import { CONTACT_EMAIL, PHONE_NATIONAL, PHONE_TEL } from "@/app/lib/contactDetails";

interface Section {
  title: string;
  content: React.ReactNode;
}

export default function LegalPage({
  label,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  label: string;
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: Section[];
}) {
  return (
    <>
      <Nav />
      <main className="pt-[72px] min-h-screen bg-[#061F36]">
        {/* Header */}
        <div className="bg-[#072B4A] border-b border-[#3B82F6]/15 py-16">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-3">{label}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
            <p className="text-[#4A6280] text-sm">Last updated: {lastUpdated}</p>
            {intro && (
              <p className="text-[#8CA3BF] text-[15px] leading-relaxed mt-4 max-w-2xl">{intro}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-white font-bold text-xl mb-4 pb-3 border-b border-[#1A3A5C]">
                <span className="text-[#F5C518] mr-2">{i + 1}.</span>{s.title}
              </h2>
              <div className="text-[#8CA3BF] text-[15px] leading-relaxed space-y-3">
                {s.content}
              </div>
            </section>
          ))}

          <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-6 mt-12">
            <p className="text-[#8CA3BF] text-sm">
              Questions about this policy? Contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F5C518] hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              or call{" "}
              <a href={`tel:${PHONE_TEL}`} className="text-[#F5C518] hover:underline">
                {PHONE_NATIONAL}
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
