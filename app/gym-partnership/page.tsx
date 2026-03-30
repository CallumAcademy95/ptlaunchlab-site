"use client";
import { useState } from "react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

const checkItems = (items: string[], color: string = "text-[#F5C518]") =>
  items.map((item) => (
    <li key={item} className="flex items-start gap-3 text-sm">
      <span className={`${color} font-bold mt-0.5 shrink-0`}>✔</span>
      <span className="text-white">{item}</span>
    </li>
  ));

const crossItems = (items: string[]) =>
  items.map((item) => (
    <li key={item} className="flex items-start gap-3 text-sm">
      <span className="text-red-400 font-bold mt-0.5 shrink-0">✗</span>
      <span className="text-[#8CA3BF]">{item}</span>
    </li>
  ));

function ApplicationForm() {
  const [form, setForm] = useState({
    gymName: "", name: "", email: "", phone: "", location: "", gymSize: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/gym-partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setStatus(data.success ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-3">Application Received</h3>
        <p className="text-[#8CA3BF] max-w-md mx-auto">
          We&apos;ll review your application and be in touch within 24 hours to discuss your gym&apos;s partnership opportunity.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#8CA3BF] text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Gym Name <span className="text-[#F5C518]">*</span>
          </label>
          <input
            name="gymName"
            value={form.gymName}
            onChange={handleChange}
            required
            placeholder="e.g. Iron Wolf Gym"
            className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Your Name <span className="text-[#F5C518]">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="First & last name"
            className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Email <span className="text-[#F5C518]">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@yourgym.com"
            className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Phone <span className="text-[#F5C518]">*</span>
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="07700 000000"
            className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Gym Location / Town <span className="text-[#F5C518]">*</span>
          </label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            placeholder="e.g. Leeds, Yorkshire"
            className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Approximate Membership Size
          </label>
          <select
            name="gymSize"
            value={form.gymSize}
            onChange={handleChange}
            className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors appearance-none"
          >
            <option value="">Select size (optional)</option>
            <option value="Under 100">Under 100 members</option>
            <option value="100–300">100–300 members</option>
            <option value="300–600">300–600 members</option>
            <option value="600–1000">600–1,000 members</option>
            <option value="1000+">1,000+ members</option>
          </select>
        </div>
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm text-center">Something went wrong. Please try again or email us directly.</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {status === "loading" ? "Submitting..." : "Apply to Secure Your Area Now →"}
      </button>
      <p className="text-[#4A6280] text-xs text-center">
        We only take one partner gym per area. Applications reviewed within 24 hours.
      </p>
    </form>
  );
}

export default function GymPartnershipPage() {
  return (
    <>
      <Nav />
      <main className="pt-[72px]">

        {/* ── HERO ── */}
        <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] overflow-hidden">
          <div className="absolute -left-48 top-20 w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.07] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-40 w-[500px] h-[500px] rounded-full bg-[#60A5FA] opacity-[0.10] blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-6">
              <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
                Gym Partnership Programme · PT Launch Lab
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6">
              Turn Your Gym Into
              <br />
              <span className="text-[#F5C518]">Its Own PT Academy</span>
            </h1>

            <p className="text-xl md:text-2xl text-white font-semibold mb-4">
              Earn £500 Per Learner — Without Doing Any Teaching, Admin, Or Courses
            </p>

            <p className="text-blue-100/70 text-base md:text-lg mb-4 max-w-2xl mx-auto">
              Never worry about recruiting personal trainers again.
              Never run PT courses yourself. Never waste time interviewing unqualified applicants.
            </p>

            <p className="text-white font-semibold text-base md:text-lg mb-10">
              We build, run, and manage your fully white-label PT academy inside your gym.<br />
              You earn upfront cash + long-term rental income.
            </p>

            {/* Trust bar */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-blue-100/80 mb-10">
              {[
                "£500 per learner paid to your gym",
                "Fully white-label branded academy",
                "We handle all education & compliance",
                "You get qualified PTs ready to work",
                "No cost, no staff, no hassle",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="text-[#F5C518]">✔</span> {item}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#apply"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30"
              >
                Apply to Secure Your Area →
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all"
              >
                See How It Works
              </a>
            </div>
          </div>
        </section>

        {/* ── THE PROBLEM ── */}
        <section className="bg-[#0D3559] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3 text-center">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              You know that thing where…
            </h2>
            <p className="text-[#8CA3BF] text-center mb-12 max-w-xl mx-auto">Most gyms struggle to keep a steady pipeline of good trainers.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-[#072B4A] rounded-2xl p-6 border border-[#3B82F6]/15">
                <ul className="space-y-3">
                  {checkItems([
                    "You need more PTs but no one good applies",
                    "PT quality is inconsistent",
                    "You waste hours interviewing people who aren't ready",
                    "Floor space sits empty with no rental income",
                    "Running your own course is too much work",
                    "You don't want the risk or compliance",
                  ])}
                </ul>
              </div>
              <div className="bg-[#072B4A] rounded-2xl p-6 border border-[#3B82F6]/15 flex flex-col justify-between">
                <div>
                  <p className="text-white font-semibold mb-4">So you either…</p>
                  <ul className="space-y-3 mb-8">
                    {crossItems([
                      "Recruit constantly",
                      "Accept low quality",
                      "Lose rental income",
                      "Or do nothing",
                    ])}
                  </ul>
                </div>
                <div className="border-t border-[#3B82F6]/20 pt-6">
                  <p className="text-[#F5C518] font-bold text-xl">We fix that.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE SOLUTION ── */}
        <section className="bg-[#072B4A] py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.04] blur-3xl" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">The Solution</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The PT Launch Lab Gym Partnership
            </h2>
            <p className="text-[#8CA3BF] text-lg mb-10 max-w-2xl mx-auto">
              We build your gym its own white-label PT academy. You promote it inside your gym. We handle everything else.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { title: "You earn on the front end", body: "£500 per learner, paid to your gym" },
                { title: "You earn on the back end", body: "PT rent, membership & coaching revenue" },
                { title: "You get a constant supply", body: "Qualified PTs who already know your gym" },
              ].map((c) => (
                <div key={c.title} className="bg-[#0D3559] border border-[#F5C518]/20 rounded-2xl p-6 text-center">
                  <p className="text-[#F5C518] font-bold text-base mb-2">{c.title}</p>
                  <p className="text-[#8CA3BF] text-sm">{c.body}</p>
                </div>
              ))}
            </div>

            <p className="text-white font-bold text-xl">And it costs you nothing.</p>
          </div>
        </section>

        {/* ── HOW YOU MAKE MONEY ── */}
        <section className="bg-[#0D3559] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3 text-center">Revenue</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              How You Make Money
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front end */}
              <div className="bg-[#072B4A] border-2 border-[#F5C518]/60 rounded-2xl p-8 shadow-xl shadow-[#F5C518]/10">
                <div className="text-3xl mb-4">💰</div>
                <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-3">Front End</p>
                <h3 className="text-white text-2xl font-bold mb-2">You get paid</h3>
                <p className="text-[#F5C518] text-4xl font-bold mb-4">£500</p>
                <p className="text-[#8CA3BF] text-sm mb-6">per learner who enrols through your gym</p>
                <ul className="space-y-3">
                  {checkItems([
                    "Paid directly to the gym",
                    "No teaching required",
                    "No work required",
                  ])}
                </ul>
              </div>

              {/* Back end */}
              <div className="bg-[#072B4A] border-2 border-[#3B82F6]/60 rounded-2xl p-8 shadow-xl shadow-[#3B82F6]/10">
                <div className="text-3xl mb-4">📈</div>
                <p className="text-[#3B82F6] text-xs font-bold tracking-widest uppercase mb-3">Back End</p>
                <h3 className="text-white text-2xl font-bold mb-4">They qualify. They stay.</h3>
                <p className="text-[#8CA3BF] text-sm mb-6">Every learner becomes a qualified PT who needs somewhere to work — and they already know your gym.</p>
                <ul className="space-y-3">
                  {checkItems([
                    "PT rent",
                    "PT membership",
                    "Long-term retention",
                    "More coaching revenue in your club",
                  ])}
                </ul>
                <p className="text-white font-semibold text-sm mt-6 pt-6 border-t border-[#3B82F6]/20">
                  Short term cash + long term income.<br />
                  Exactly how a gym partnership should work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHITE LABEL ── */}
        <section className="bg-[#072B4A] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3 text-center">Your Brand</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Fully White-Label Academy
            </h2>
            <p className="text-[#8CA3BF] text-center mb-12 text-lg">
              Your gym gets its own academy. Not ours. <span className="text-white font-bold">Yours.</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#3B82F6]/15">
                <p className="text-[#8CA3BF] text-sm mb-4">Your gym gets:</p>
                <ul className="space-y-3">
                  {checkItems([
                    "Your branding",
                    "Your logo",
                    "Your link / QR code",
                    "Your academy page",
                    "Your messaging",
                  ])}
                </ul>
                <div className="mt-6 pt-6 border-t border-[#3B82F6]/20">
                  <p className="text-[#8CA3BF] text-sm mb-2">To members it looks like:</p>
                  <p className="text-[#F5C518] font-bold text-lg">&ldquo;[Your Gym Name] PT Academy&rdquo;</p>
                </div>
              </div>

              <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#3B82F6]/15">
                <p className="text-white font-bold mb-4">We run everything behind the scenes:</p>
                <ul className="space-y-3">
                  {checkItems([
                    "Education",
                    "Mentorship",
                    "Assessments",
                    "Compliance",
                    "Certification",
                    "Support",
                  ])}
                </ul>
                <div className="mt-6 pt-6 border-t border-[#3B82F6]/20">
                  <p className="text-white font-semibold text-sm">
                    You keep the authority.<br />
                    <span className="text-[#F5C518]">We do the work.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ZERO ADMIN ── */}
        <section className="bg-[#0D3559] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">Zero Admin</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              You Do NOT Have To Do Any Of This
            </h2>
            <p className="text-[#8CA3BF] mb-12 max-w-xl mx-auto">
              This is designed to scale without extra staff. Your role = gym partner only.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                "Teach courses",
                "Hire tutors",
                "Do paperwork",
                "Handle compliance",
                "Deal with qualifications",
                "Manage students",
                "Build course material",
                "Any admin at all",
              ].map((item) => (
                <div key={item} className="bg-[#072B4A] border border-red-400/20 rounded-xl p-4 text-center">
                  <span className="text-red-400 text-xl block mb-1">✗</span>
                  <span className="text-[#8CA3BF] text-xs font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEVER RECRUIT AGAIN ── */}
        <section className="bg-[#072B4A] py-16 md:py-24 relative overflow-hidden">
          <div className="absolute -right-32 top-0 w-[400px] h-[400px] rounded-full bg-[#3B82F6] opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3 text-center">The Pipeline</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Never Worry About Recruiting Again
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#F5C518]/20">
                <p className="text-[#F5C518] font-bold mb-4">Imagine your gym always has:</p>
                <ul className="space-y-3">
                  {checkItems([
                    "New PTs coming through every month",
                    "Qualified trainers ready to start",
                    "People who already know your gym",
                    "Trainers trained the way YOU want",
                  ])}
                </ul>
              </div>
              <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#3B82F6]/20">
                <p className="text-[#8CA3BF] font-semibold mb-4">No more:</p>
                <ul className="space-y-3">
                  {crossItems([
                    "Job ads",
                    "Random CVs",
                    "Bad PTs",
                    "Empty floor space",
                  ])}
                </ul>
                <div className="mt-6 pt-6 border-t border-[#3B82F6]/20">
                  <p className="text-white font-bold text-lg">Just a pipeline. Every month.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO THIS IS FOR ── */}
        <section className="bg-[#0D3559] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">Ideal Fit</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who This Is For</h2>
            <p className="text-[#8CA3BF] mb-12">This partnership works best for commercial gyms with PT floor space.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-[#072B4A] rounded-2xl p-8 border border-[#F5C518]/20">
                <p className="text-[#F5C518] font-bold mb-4">This is ideal if you:</p>
                <ul className="space-y-3">
                  {checkItems([
                    "Run a commercial gym",
                    "Want more PT rental income",
                    "Want better trainers",
                    "Don't want to run courses yourself",
                    "Want new revenue streams",
                    "Want your own PT academy",
                  ])}
                </ul>
              </div>
              <div className="bg-[#072B4A] rounded-2xl p-8 border border-[#3B82F6]/20 flex flex-col justify-between">
                <div>
                  <p className="text-[#8CA3BF] font-semibold mb-4">Not suitable for:</p>
                  <ul className="space-y-3">
                    {crossItems([
                      "Small studios with no PT space",
                      "Gyms not open to renting to PTs",
                    ])}
                  </ul>
                </div>
                <div className="mt-8 pt-6 border-t border-[#3B82F6]/20">
                  <p className="text-white font-semibold text-sm">
                    We only take <span className="text-[#F5C518] font-bold">one partner gym per area</span> to protect exclusivity. Areas fill up fast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY PT LAUNCH LAB ── */}
        <section className="bg-[#072B4A] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3 text-center">Why Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Why Gyms Partner With PT Launch Lab
            </h2>
            <p className="text-[#8CA3BF] text-center mb-12 max-w-2xl mx-auto">
              We are not just course providers. We are gym owners. We&apos;ve hired hundreds of PTs. We know what gyms actually need. Our system is built for gyms, not colleges.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {[
                { icon: "🎓", text: "Online Level 2 & 3 qualifications" },
                { icon: "🤝", text: "Mentorship included" },
                { icon: "🏋️", text: "Gym placement pathway" },
                { icon: "✅", text: "Industry recognised (NCFE & Ofqual)" },
                { icon: "🏢", text: "Built with gym partners in mind" },
                { icon: "📋", text: "Full compliance managed by us" },
              ].map((item) => (
                <div key={item.text} className="bg-[#0D3559] rounded-xl p-5 border border-[#3B82F6]/15 flex items-center gap-4">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <span className="text-white text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#F5C518]/20 text-center">
              <p className="text-white text-lg font-semibold mb-2">
                This is why gyms partner with us.
              </p>
              <p className="text-[#8CA3BF]">
                Not because we sell courses. Because we solve recruitment.
              </p>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="bg-[#0D3559] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">The Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-[#8CA3BF] mb-12">Simple. Scalable. No extra work.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { step: "1", label: "Your gym joins the partnership" },
                { step: "2", label: "We create your white-label academy" },
                { step: "3", label: "You display QR / link in gym & on socials" },
                { step: "4", label: "People enrol through your academy" },
                { step: "5", label: "You get £500 per learner" },
                { step: "6", label: "They complete the qualification" },
                { step: "7", label: "They work in your gym" },
                { step: "8", label: "You earn rent long term" },
              ].map((s) => (
                <div key={s.step} className="bg-[#072B4A] rounded-xl p-5 border border-[#3B82F6]/15 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm flex items-center justify-center mb-3">
                    {s.step}
                  </div>
                  <p className="text-white text-sm font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STRONG CLOSE ── */}
        <section className="bg-[#061F36] py-12 md:py-16 border-y border-[#3B82F6]/15">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <p className="text-white text-xl md:text-2xl font-bold mb-2">
              Most gyms don&apos;t have a recruitment problem.
            </p>
            <p className="text-white text-xl md:text-2xl font-bold mb-2">
              They have a <span className="text-[#F5C518]">pipeline problem.</span>
            </p>
            <p className="text-[#8CA3BF] text-lg mt-4">
              Fix the pipeline once. And you never need to recruit again.
            </p>
          </div>
        </section>

        {/* ── APPLICATION FORM ── */}
        <section id="apply" className="bg-[#072B4A] py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.05] blur-3xl" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-3">Applications Open</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Become a PT Launch Lab Partner Gym
              </h2>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-blue-100/70 mb-4">
                {[
                  "Get your own academy",
                  "Earn £500 per learner",
                  "Build a PT pipeline",
                  "Increase rental income",
                  "Without extra staff",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <span className="text-[#F5C518]">✔</span> {item}
                  </span>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-400/30 mt-2">
                <span className="text-red-400 text-xs font-bold">⚠ ONE PARTNER PER AREA</span>
                <span className="text-[#8CA3BF] text-xs">— Secure yours before it&apos;s taken</span>
              </div>
            </div>

            <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#F5C518]/20 shadow-2xl shadow-[#F5C518]/5">
              <ApplicationForm />
            </div>

            <p className="text-center text-[#4A6280] text-sm mt-6">
              Prefer to talk first?{" "}
              <a href="/book-call" className="text-[#F5C518] hover:underline font-semibold">
                Book a partnership call →
              </a>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
