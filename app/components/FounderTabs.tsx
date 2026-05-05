"use client";
import { useState } from "react";
import Image from "next/image";

const founders = [
  {
    name: "Callum Brown",
    role: "Co-Founder & Educator",
    photo: "/callum.webp",
    story: [
      "Callum's path into fitness wasn't a straight line. He moved from job to job, trade to trade, before deciding that Personal Training was where he was meant to be. That experience of not quite fitting anywhere else is exactly what makes him understand the people PT Launch Lab is built for.",
      "On the gym floor, Callum built a strong, loyal client base from the ground up. He then moved into PT education, becoming a qualified educator in Personal Training qualifications and working closely with the UK's top student finance providers to understand how people fund their training.",
      "That combination of lived experience, education, and industry knowledge is what he now teaches. He doesn't just show people how to qualify. He shows them how to build a career that actually lasts.",
    ],
    stats: [
      { value: "Educator", label: "Qualified PT educator" },
      { value: "Finance", label: "Student finance expertise" },
      { value: "Gym floor", label: "Built from scratch" },
    ],
  },
  {
    name: "Ryan Robinson",
    role: "Co-Founder & Mentor",
    photo: "/ryan.webp",
    story: [
      "Ryan has 17 years on the gym floor and a career that most PTs only dream of. As a professional boxer, he built the kind of discipline and mental edge that translated directly into how he trains clients and runs a business.",
      "He founded Ultimate Shred, an online PT business that he scaled to over £500,000 in revenue as an independent personal trainer, without a gym brand behind him. Just the right systems, the right offer, and the drive to build something real.",
      "At PT Launch Lab, Ryan is the mentor who's been through it. The self-doubt, the quiet months, the breakthrough moments. He tells it straight, shares what actually worked, and keeps students accountable to building something that pays them.",
    ],
    stats: [
      { value: "17 yrs", label: "On the gym floor" },
      { value: "£500K+", label: "Ultimate Shred revenue" },
      { value: "Pro boxer", label: "Professional boxing career" },
    ],
  },
  {
    name: "Miles Halstead",
    role: "Co-Founder & Director",
    photo: "/miles.webp",
    story: [
      "Thirty years in the fitness industry gives you a perspective nobody can teach. Miles has seen this industry from every angle. From corporate management to owning his own chain of gyms, running large teams of Personal Trainers and coaches day in, day out.",
      "He's been on both sides of the hiring table hundreds of times. He knows what separates the PTs who build long careers from the ones who disappear after six months. He knows what gym owners actually want, what clients stay loyal to, and what no qualification on its own will ever teach you.",
      "Miles brings the long view to PT Launch Lab. When something sounds good in theory but won't work in practice, he says so. His 30+ years mean students get the wisdom of three decades compressed into a programme that actually prepares them for what's waiting.",
    ],
    stats: [
      { value: "30+ yrs", label: "In the fitness industry" },
      { value: "Chain", label: "Owned multiple gyms" },
      { value: "100s", label: "PTs hired & developed" },
    ],
  },
];

export default function FounderTabs() {
  const [active, setActive] = useState(0);
  const founder = founders[active];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-12 bg-[#061F36] p-2 rounded-2xl">
        {founders.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setActive(i)}
            className={`flex-1 py-3.5 px-5 rounded-xl text-sm font-bold transition-all duration-200 ${
              active === i
                ? "bg-[#F5C518] text-[#072B4A]"
                : "text-[#8CA3BF] hover:text-white hover:bg-[#0A2A44]"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left — photo + stats */}
        <div className="flex flex-col items-center lg:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg shadow-black/30">
            <Image
              src={founder.photo}
              alt={founder.name}
              width={96}
              height={96}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h3 className="text-white font-bold text-2xl">{founder.name}</h3>
            <p className="text-[#F5C518] text-sm font-semibold mt-1">{founder.role}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full">
            {founder.stats.map((s) => (
              <div key={s.label} className="bg-[#061F36] border border-[#1A3A5C] rounded-xl p-4">
                <p className="text-[#F5C518] font-bold text-lg">{s.value}</p>
                <p className="text-[#8CA3BF] text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — story paragraphs */}
        <div className="lg:col-span-2 space-y-5">
          {founder.story.map((para, i) => (
            <p key={i} className="text-[#8CA3BF] text-[15px] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
