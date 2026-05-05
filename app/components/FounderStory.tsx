import Image from "next/image";

const founders = [
  { src: "/callum.webp", name: "Callum", alt: "Callum Brown — co-founder of PT Launch Lab and Head of Education" },
  { src: "/miles.webp",  name: "Miles",  alt: "Miles — co-founder of PT Launch Lab and Business Mentor" },
  { src: "/ryan.webp",   name: "Ryan",   alt: "Ryan Robinson — co-founder of PT Launch Lab and Head of Operations" },
];

const stats = [
  { value: "£500K+", label: "Revenue built by our\nfounders at Ultimate Shred" },
  { value: "500+",   label: "Personal trainers hired\nby the PT Launch Lab team" },
  { value: "8–16",   label: "Weeks to your fully\nrecognised Level 3 qualification" },
  { value: "1",      label: "Personal tutor assigned\nto you from day one" },
];

export default function FounderStory() {
  return (
    <section className="bg-base py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left */}
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
            Why we built this
          </p>
          <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white leading-none tracking-tight mb-6">
            We built the course
            <br />
            <span className="text-gold">we wish had existed.</span>
          </h2>
          <p className="text-white text-lg font-semibold mb-4">
            We don&apos;t just run PT courses. We run gyms. We hire trainers. We know what works.
          </p>
          <p className="text-soft/75 text-[16px] leading-relaxed mb-4">
            Callum, Miles, and Ryan didn&apos;t start out as course providers. They started as gym owners — building Ultimate Shred from scratch into a business turning over £500,000 a year. Along the way, they hired hundreds of personal trainers. And they saw the same problem, again and again: talented people who&apos;d done the qualification, who loved fitness, who genuinely wanted to help people — but had no idea how to actually run a PT business. They were qualified. They just weren&apos;t ready.
          </p>
          <p className="text-soft/75 text-[16px] leading-relaxed mb-8">
            PT Launch Lab was built to close that gap. Every module, every piece of business training, every guaranteed interview was designed by people who&apos;ve been on the hiring side of the desk — and who know exactly what separates the PTs who build thriving careers from the ones who quietly give up six months after qualifying.
          </p>

          {/* Founder photo strip */}
          <div className="flex gap-5 mb-8">
            {founders.map((f) => (
              <div key={f.name} className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-gold/40 shadow-lg shadow-black/30">
                  <Image src={f.src} alt={f.alt} fill className="object-cover object-top" />
                </div>
                <span className="text-soft/60 text-xs font-medium">{f.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="/courses"
              className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-gold/20"
            >
              View Course Details →
            </a>
            <a
              href="/about#our-story"
              className="px-7 py-3.5 rounded-full border border-gold/50 text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
            >
              Read Our Story
            </a>
          </div>
        </div>

        {/* Right — stats + case study */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.value}
                className="bg-card border border-white/[0.07] rounded-2xl p-6 hover:border-gold/20 transition-colors"
              >
                <p className="font-display font-extrabold text-gold text-5xl leading-none mb-2 tracking-tight">{stat.value}</p>
                <p className="text-soft/65 text-sm leading-relaxed whitespace-pre-line">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Student success story */}
          <div className="bg-card border border-gold/20 rounded-2xl p-6">
            <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">Student Success Story</p>
            <h4 className="text-white font-bold text-lg mb-2">Gemma&apos;s Journey: Corporate to Coaching</h4>
            <p className="text-soft/70 text-sm leading-relaxed">
              Gemma left a corporate career behind and retrained through PT Launch Lab. She had a personal tutor from day one, completed in 12 weeks around her job, and walked into guaranteed gym interviews on the other side. Now she runs her own PT business, earns more than she ever did in the office, and hasn&apos;t dreaded a Monday since.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
