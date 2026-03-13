"use client";
import { useState } from "react";

const faqs = [
  { q: "Will I actually get a job after qualifying?", a: "Yes — and we back that up. We guarantee gym interviews once you're qualified. Our team has personally hired over 500 PTs, so we know exactly what gyms look for and we prepare you for it. We'll also help you understand how PTs actually make money, whether that's in a gym, online, or both." },
  { q: "What is the guaranteed gym interview?", a: "Once you complete your Level 2 & 3 qualification, we actively connect you with gym partners for interviews. This isn't a vague promise — it's part of the course. We've built gym partnerships specifically to support our graduates into work. You qualify, we open the doors." },
  { q: "How long does it take to qualify?", a: "Most students complete their Level 2 & 3 qualification in 8–16 weeks, studying around their current job. The course is fully self-paced so you're in control of your timeline." },
  { q: "Do I need any prior experience?", a: "None at all. Whether you're completely new to fitness or you've been training for years, the course starts from the foundations and builds up. All you need is a passion for fitness and the drive to make it your career." },
  { q: "What does it cost?", a: "We have options to suit different budgets, including payment plans. View all pricing and enrolment options on our sign-up page." },
  { q: "Will my qualification be recognised?", a: "Yes. Your NCFE Level 2 & 3 PT qualification is regulated by Ofqual and recognised by CIMSPA and REPs — the gold standard for UK fitness professionals. Every gym and insurance provider will accept it." },
  { q: "When can I start?", a: "Immediately. As soon as you enrol you get full access to the course, your learning platform, and your personal tutor. There's no waiting around." },
  { q: "I have a full-time job and a family. Is this realistic?", a: "Absolutely. The course is designed around real life. Study in the morning, evenings, weekends — whenever works for you. Most of our students qualify while working full-time." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#0D3559] py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Got questions? We&apos;ve got answers.
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-[#072B4A] border border-[#3B82F6]/20 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#0D3559] transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white font-semibold text-[15px] pr-4">{faq.q}</span>
                <span
                  className={`text-[#F5C518] text-xl font-bold shrink-0 transition-transform duration-300 ${
                    open === i ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-6">
                  <p className="text-[#8CA3BF] text-[15px] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
