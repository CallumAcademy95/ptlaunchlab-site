"use client";
import { useState } from "react";
import Image from "next/image";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Home",    href: "/" },
    { label: "Course",  href: "/courses" },
    { label: "About",   href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F2040] border-b border-[#3B82F6]/20">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="PT Launch Lab"
            width={160}
            height={56}
            className="h-14 w-auto object-contain"
            priority
          />
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-[#8CA3BF] hover:text-white text-sm font-medium transition-colors">
              {l.label}
            </a>
          ))}
          <a href="https://ptlauchlab.merve.online/login" target="_blank" rel="noopener noreferrer" className="text-[#8CA3BF] hover:text-white text-xs transition-colors">
            Existing Students
          </a>
        </div>

        {/* CTA buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/book-call"
            className="px-5 py-2.5 rounded-full border border-[#F5C518] text-[#F5C518] text-sm font-semibold hover:bg-[#F5C518] hover:text-[#091524] transition-all"
          >
            Book a Free Call
          </a>
          <a
            href="https://signup-lauchlab.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-[#F5C518] text-[#091524] text-sm font-bold hover:brightness-110 transition-all"
          >
            Start Today →
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <div className={`w-6 h-0.5 bg-white transition-all ${open ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-6 h-0.5 bg-white my-1.5 transition-all ${open ? "opacity-0" : ""}`} />
          <div className={`w-6 h-0.5 bg-white transition-all ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#112035] border-t border-[#3B82F6]/20 px-6 py-6 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-[#8CA3BF] hover:text-white font-medium py-1 transition-colors">
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#3B82F6]/20">
            <a href="/book-call" className="text-center px-5 py-3 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold hover:bg-[#F5C518] hover:text-[#091524] transition-all">
              Book a Free Call
            </a>
            <a href="https://signup-lauchlab.co.uk/" target="_blank" rel="noopener noreferrer" className="text-center px-5 py-3 rounded-full bg-[#F5C518] text-[#091524] font-bold hover:brightness-110 transition-all">
              Start Today →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
