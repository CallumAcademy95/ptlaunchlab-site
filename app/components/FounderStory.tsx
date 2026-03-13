const stats = [
  { value: "500+",   label: "PTs hired by\nour team" },
  { value: "30+",    label: "Years industry\nexperience" },
  { value: "£500K+", label: "Revenue as\nindependent PTs" },
  { value: "100s",   label: "Students\nqualified" },
];

export default function FounderStory() {
  return (
    <section className="bg-[#112035] py-24">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">
            Why we built this
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            We&apos;ve been in jobs
            <br />
            we hated too.
          </h2>
          <p className="text-white text-lg font-semibold mb-4">
            We don&apos;t just run PT courses. We run gyms. We hire trainers. We know what works.
          </p>
          <p className="text-[#8CA3BF] text-[17px] leading-relaxed mb-4">
            Callum, Miles and Ryan built this from lived experience — not a textbook. We scaled
            Ultimate Shred to over £500K in revenue as independent personal trainers, and we&apos;ve
            personally hired over 500 PTs across our gyms and partnerships.
          </p>
          <p className="text-[#8CA3BF] text-[17px] leading-relaxed mb-10">
            That&apos;s why our course is different. When we teach you what gyms look for, it&apos;s
            because we&apos;re the ones doing the hiring. When we talk about building income, it&apos;s
            because we&apos;ve done it ourselves — and now we hand you the exact playbook.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://signup-lauchlab.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-full bg-[#F5C518] text-[#091524] font-bold text-sm hover:brightness-110 transition-all"
            >
              View Courses →
            </a>
            <a
              href="#"
              className="px-7 py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#091524] transition-all"
            >
              Read Our Story
            </a>
          </div>
        </div>

        {/* Right — stats */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="bg-[#091524] border border-[#3B82F6]/25 rounded-2xl p-6"
            >
              <p className="text-[#F5C518] text-4xl font-bold mb-2">{stat.value}</p>
              <p className="text-[#8CA3BF] text-sm leading-relaxed whitespace-pre-line">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
