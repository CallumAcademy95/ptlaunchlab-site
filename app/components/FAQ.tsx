"use client";
import { useState } from "react";

const faqs = [
  {
    q: "Is the Level 3 qualification actually recognised? I've seen cheap courses that don't seem legitimate.",
    a: "Yes — and this is the right question to ask. Our qualification is delivered through NCFE, regulated by Ofqual (the same body that oversees GCSEs and A-Levels), and carries CIMSPA recognition. That means it's accepted by every major gym group in the UK — PureGym, David Lloyd, Nuffield Health, JD Gyms, and independent operators alike. If a gym asks to see your qualification, ours passes every check.",
  },
  {
    q: "What exactly are the \"guaranteed gym interviews\"? That sounds too good to be true.",
    a: "It's a fair challenge. Here's exactly what it means: on completion of your qualification, we make direct introductions to gym employers in our network who are actively hiring PTs. These are warm introductions — not job board listings, not a generic CV drop. Because our founders have spent years on the hiring side of this industry, they have real relationships with gym operators. We use those relationships to get you in front of the right people. We can't guarantee you'll be offered every job — that's down to you in the interview. But we guarantee the interviews happen.",
  },
  {
    q: "I'm working full-time. Is there any realistic way to study around my job?",
    a: "Yes — and it's the most common situation our students are in. The course is 100% online with no fixed class times. Most students study in evenings and weekends. If you put in 8–10 hours per week, you'll finish in around 12 weeks. If you want to push harder, you can complete in 8. If life gets busy, you have the full 16 weeks without penalty. Your tutor will help you build a realistic schedule in week one.",
  },
  {
    q: "I've never been great at studying. What if I fail the assessments?",
    a: "You have a personal tutor for exactly this reason. Before you submit any assessment, your tutor reviews your work, gives you feedback, and tells you whether it's ready. Most students don't fail — because the support system catches problems before submission. If you do need to resubmit anything, that's included at no extra cost. We want you to qualify, not to catch you out.",
  },
  {
    q: "How much can I realistically earn as a PT?",
    a: "Honestly, it varies — and we'll never give you a number that's misleading. A PT working in a gym on an employed basis typically earns £20,000–£28,000 to start, rising quickly with experience. Self-employed PTs who build their own client base regularly earn £35,000–£50,000+. The business training in our course is specifically designed to get you to that upper range faster — because knowing how to get and keep clients is the difference. Our founders built a £500K/year fitness business. They teach what actually works.",
  },
  {
    q: "Why should I choose PT Launch Lab over a cheaper course?",
    a: "If price is the only factor, cheaper courses exist. But here's the honest comparison: most cheaper courses give you the content to pass the exam, and nothing else. No personal tutor. No business training. No job support. You qualify, then you're on your own. PT Launch Lab costs more because it includes the things that actually determine whether you succeed: a tutor who knows your name, business training built into the curriculum, and guaranteed interview introductions. The difference in cost pays for itself within the first month of employment.",
  },
  {
    q: "I'm in my 30s or 40s — am I too old to start this?",
    a: "No. Some of the most successful PTs are career-changers in their 30s and 40s. Life experience, empathy, and maturity are genuine assets in this profession — clients often prefer a trainer who understands what it's like to manage a job, a family, and a fitness goal at the same time. With the business training we include, career-changers with professional backgrounds often build their client base faster than 22-year-olds straight out of college.",
  },
  {
    q: "When can I start?",
    a: "Immediately. As soon as you enrol you get full access to the course and your personal tutor is introduced within 24 hours. There's no waiting around for a cohort start date. You begin your first module the same day you sign up.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#0D3559] py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Honest answers to the questions
          <br />everyone asks before enrolling.
        </h2>
        <p className="text-[#8CA3BF] text-center text-base mb-12 max-w-xl mx-auto">
          If you have a question that isn&apos;t here, <a href="/book-call" className="text-[#F5C518] hover:underline">book a free call</a> — we&apos;ll give you a straight answer.
        </p>

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
