const stats = [
  { value: "500+",   label: "PTs hired by\nour team" },
  { value: "30+",    label: "Years industry\nexperience" },
  { value: "£500K+", label: "Revenue as\nindependent PTs" },
  { value: "100s",   label: "Students\nqualified" },
];

export default function FounderStory() {
  return (
    <section className="bg-[#141B2D] py-24">
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
          <p className="text-[#9CA3AF] text-[17px] leading-relaxed mb-4">
            Ryan and the PT Launch Lab team built this course from lived experience — not a
            textbook. Before PT Launch Lab, we scaled Ultimate Shred to over £500K in revenue as
            independent personal trainers.
          </p>
          <p className="text-[#9CA3AF] text-[17px] leading-relaxed mb-10">
            We didn&apos;t do it through a chain gym or someone else&apos;s business. We built it
            ourselves — from scratch, with no playbook. And now we teach you exactly how.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://signup-lauchlab.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-full bg-[#F5C518] text-[#0A0E1A] font-bold text-sm hover:brightness-110 transition-all"
            >
              View Courses →
            </a>
            <a
              href="#"
              className="px-7 py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#0A0E1A] transition-all"
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
              className="bg-[#0A0E1A] border border-[#3B82F6]/25 rounded-2xl p-6"
            >
              <p className="text-[#F5C518] text-4xl font-bold mb-2">{stat.value}</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed whitespace-pre-line">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
