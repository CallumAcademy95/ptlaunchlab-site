"use client";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Form submission — wire to backend/Formspree as needed
    setSubmitted(true);
  }

  return (
    <>
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-[#072B4A] py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-[#F5C518] opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left — info */}
            <div>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Get in touch</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                Have a question?<br /><span className="text-[#F5C518]">We&apos;re here.</span>
              </h1>
              <p className="text-[#8CA3BF] text-lg leading-relaxed mb-10">
                Whether you want to know more about the course, talk through your situation, or just find out if PT is the right move — drop us a message or give us a call.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0D3559] border border-[#3B82F6]/25 flex items-center justify-center shrink-0 text-[#F5C518]">
                    📞
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Phone</p>
                    <a href="tel:01977365001" className="text-[#8CA3BF] hover:text-[#F5C518] transition-colors">01977 365001</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0D3559] border border-[#3B82F6]/25 flex items-center justify-center shrink-0 text-[#F5C518]">
                    📍
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Address</p>
                    <p className="text-[#8CA3BF] leading-relaxed">
                      Unit 3, Royals Business Park<br />
                      King St, Pontefract<br />
                      WF8 4AH
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0D3559] border border-[#3B82F6]/25 flex items-center justify-center shrink-0 text-[#F5C518]">
                    🕐
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Hours</p>
                    <p className="text-[#8CA3BF]">Monday – Sunday: 9am – 5pm</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-[#3B82F6]/15">
                <p className="text-[#4A6280] text-xs font-semibold tracking-widest uppercase mb-4">Or book a call directly</p>
                <a href="/book-call"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all">
                  Book a Free Consultation →
                </a>
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">✅</p>
                  <h3 className="text-white font-bold text-2xl mb-3">Message sent.</h3>
                  <p className="text-[#8CA3BF]">We&apos;ll get back to you as soon as possible — usually within a few hours.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-white font-bold text-2xl mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-[#8CA3BF] text-sm mb-2 block">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                        className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[#8CA3BF] text-sm mb-2 block">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[#8CA3BF] text-sm mb-2 block">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="07700 000000"
                        className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[#8CA3BF] text-sm mb-2 block">Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="What would you like to know?"
                        className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 transition-colors resize-none"
                      />
                    </div>
                    <p className="text-[#4A6280] text-xs">Either email or phone number is required.</p>
                    <button
                      type="submit"
                      className="w-full px-6 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all"
                    >
                      Send Message →
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="bg-[#0D3559] py-16 px-6 border-t border-[#3B82F6]/15">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[#8CA3BF] text-sm mb-6">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/courses" className="px-5 py-2.5 rounded-full border border-[#3B82F6]/40 text-[#8CA3BF] text-sm hover:border-[#F5C518] hover:text-[#F5C518] transition-all">View the Course</a>
              <a href="/book-call" className="px-5 py-2.5 rounded-full border border-[#3B82F6]/40 text-[#8CA3BF] text-sm hover:border-[#F5C518] hover:text-[#F5C518] transition-all">Book a Free Call</a>
              <a href="/quiz" className="px-5 py-2.5 rounded-full border border-[#3B82F6]/40 text-[#8CA3BF] text-sm hover:border-[#F5C518] hover:text-[#F5C518] transition-all">Take the Free Quiz</a>
              <a href="/enrol" className="px-5 py-2.5 rounded-full border border-[#3B82F6]/40 text-[#8CA3BF] text-sm hover:border-[#F5C518] hover:text-[#F5C518] transition-all">Enrol Now</a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
