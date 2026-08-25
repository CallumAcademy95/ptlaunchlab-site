"use client";
import { useState } from "react";

const faqs = [
  {
    q: "Is the Level 3 qualification actually recognised? I've seen cheap courses that don't seem legitimate.",
    a: "Yes. The qualification is delivered through NCFE, regulated by Ofqual under reference 603/4388/6 (Ofqual is the same body that oversees GCSEs and A-Levels), and carries CIMSPA recognition. Ofqual publishes the qualification on its own register, so you can check it yourself rather than take our word for it. That is the difference between a regulated qualification and a self-branded certificate.",
  },
  {
    q: "What exactly are the \"guaranteed gym interviews\"? That sounds too good to be true.",
    a: "It's a fair challenge. Here's exactly what it means: on completion of your qualification, we make direct introductions to gym employers in our network who are actively hiring PTs. These are warm introductions — not job board listings, not a generic CV drop. Because our founders have spent years on the hiring side of this industry, they have real relationships with gym operators. We use those relationships to get you in front of the right people. We can't guarantee you'll be offered every job — that's down to you in the interview. But we guarantee the interviews happen.",
  },
  {
    q: "I'm working full-time. Is there any realistic way to study around my job?",
    a: "Yes, and it is the most common situation our students are in. The course is 100% online with no fixed class times. Most students study in evenings and weekends. If you put in 8–10 hours per week, you'll finish in around 12 weeks. If you want to push harder, you can complete in 8. If life gets busy, you have the full 16 weeks without penalty. Your tutor will help you build a realistic schedule in week one.",
  },
  {
    q: "I've never been great at studying. What if I fail the assessments?",
    a: "You have a personal tutor for exactly this reason. Before you submit any assessment, your tutor reviews your work, gives you feedback, and tells you whether it's ready. The point of that step is to catch problems before you submit rather than after. If you do need to resubmit anything, that is included at no extra cost. We want you to qualify, not to catch you out.",
  },
  {
    q: "How much can I realistically earn as a PT?",
    a: "It varies, and we will not give you a number that flatters the course. A PT working in a gym on an employed basis typically earns £20,000–£28,000 to start, rising with experience. Self-employed PTs who build their own client base earn more, but that depends entirely on how many clients they keep. The business training in the course is aimed at that second problem, because getting qualified and getting clients are two different skills. Our founders have hired over 500 PTs and built a £500k/year fitness business, and that is the part they teach.",
  },
  {
    q: "Why should I choose PT Launch Lab over a cheaper course?",
    a: "If price is the only factor, cheaper courses exist. What £1,599 buys here is the NCFE Level 3 qualification, a personal tutor assigned to you within 24 hours, and the £500 business mentorship. Everything is in the one fee and nothing is sold as a paid upgrade afterwards. Whether that is worth more than a cheaper course depends on how much support you want once the content is done.",
  },
  {
    q: "What does the business mentorship actually do for me?",
    a: "It walks you from qualifying to your first paying client. You get the Mentorship Hub — your private dashboard built around that one job — plus our Skool community for daily peer contact. On the Hub you always know the next concrete thing to work on, and Callum's a message away when you're stuck. It is in the course fee rather than sold on afterwards.",
  },
  {
    q: "I'm in my 30s or 40s — am I too old to start this?",
    a: "No. Plenty of PTs are career-changers in their 30s and 40s. Life experience is an asset in this job: a lot of clients want a trainer who knows what it is like to fit training around work and a family, because that is the problem they are asking you to solve.",
  },
  {
    q: "When can I start?",
    a: "Immediately. As soon as you enrol you get full access to the course and your personal tutor is introduced within 24 hours. There's no waiting around for a cohort start date. You begin your first module the same day you sign up.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-surface py-24">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">
          FAQs
        </p>
        <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-4">
          Honest answers.
          <br />
          <span className="text-gold">No waffle.</span>
        </h2>
        <p className="text-soft/60 text-center text-base mb-12 max-w-xl mx-auto">
          If you have a question that isn&apos;t here,{" "}
          <a href="/book-call" className="text-gold hover:underline">book a free call</a>{" "}
          and we&apos;ll give you a straight answer.
        </p>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-card border border-white/[0.07] rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white font-semibold text-[15px] pr-4 leading-snug">{faq.q}</span>
                <span
                  className={`text-gold shrink-0 transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: open === i ? "500px" : "0px" }}
              >
                <p className="px-6 pb-6 text-soft/70 text-[15px] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
