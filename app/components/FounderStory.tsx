import Image from "next/image";

const founders = [
  { src: "/callum.jpg", name: "Callum" },
  { src: "/miles.jpg",  name: "Miles"  },
  { src: "/ryan.jpg",   name: "Ryan"   },
];

const stats = [
  { value: "£500K+", label: "Revenue built by our\nfounders at Ultimate Shred" },
  { value: "500+",   label: "Personal trainers hired\nby the PT Launch Lab team" },
  { value: "8–16",   label: "Weeks to your fully\nrecognised Level 3 qualification" },
  { value: "1",      label: "Personal tutor assigned\nto you from day one" },
];

export default function FounderStory() {
  return (
    <section className="bg-[#0D3559] py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left */}
        <div>
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">
            Why we built this
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            We built the course
            <br />
            we wish had existed.
          </h2>
          <p className="text-white text-lg font-semibold mb-4">
            We don&apos;t just run PT courses. We run gyms. We hire trainers. We know what works.
          </p>
          <p className="text-[#8CA3BF] text-[17px] leading-relaxed mb-4">
            Callum, Miles, and Ryan didn&apos;t start out as course providers. They started as gym owners — building Ultimate Shred from scratch into a business turning over £500,000 a year. Along the way, they hired hundreds of personal trainers. And they saw the same problem, again and again: talented people who&apos;d done the qualification, who loved fitness, who genuinely wanted to help people — but had no idea how to actually run a PT business. They were qualified. They just weren&apos;t ready.
          </p>
          <p className="text-[#8CA3BF] text-[17px] leading-relaxed mb-7 md:mb-10">
            PT Launch Lab was built to close that gap. Every module, every piece of business training, every guaranteed interview was designed by people who&apos;ve been on the hiring side of the desk — and who know exactly what separates the PTs who build thriving careers from the ones who quietly give up six months after qualifying.
          </p>
          {/* Founder photo strip */}
          <div className="flex gap-4 mb-7 md:mb-8">
            {founders.map((f) => (
              <div key={f.name} className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#F5C518]/50 shadow-lg">
                  <Image src={f.src} alt={f.name} fill className="object-cover object-top" />
                </div>
                <span className="text-[#8CA3BF] text-xs font-medium">{f.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="/courses"
              className="px-7 py-3.5 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all"
            >
              View Course Details →
            </a>
            <a
              href="/about#our-story"
              className="px-7 py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#072B4A] transition-all"
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
                className="bg-[#072B4A] border border-[#3B82F6]/25 rounded-2xl p-6"
              >
                <p className="text-[#F5C518] text-4xl font-bold mb-2">{stat.value}</p>
                <p className="text-[#8CA3BF] text-sm leading-relaxed whitespace-pre-line">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Student success story */}
          <div className="bg-[#072B4A] border border-[#F5C518]/30 rounded-2xl p-6">
            <p className="text-[#F5C518] text-[10px] font-bold tracking-widest uppercase mb-3">Student Success Story</p>
            <h4 className="text-white font-bold text-lg mb-2">Gemma&apos;s Journey: Corporate to Coaching</h4>
            <p className="text-[#8CA3BF] text-sm leading-relaxed">
              Gemma left a corporate career behind and retrained through PT Launch Lab. She had a personal tutor from day one, completed in 12 weeks around her job, and walked into guaranteed gym interviews on the other side. Now she runs her own PT business, earns more than she ever did in the office, and hasn&apos;t dreaded a Monday since.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
