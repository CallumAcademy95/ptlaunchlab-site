"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home",    href: "/" },
    { label: "Course",  href: "/courses" },
    { label: "Podcast", href: "/podcast" },
    { label: "About",   href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-deep/96 backdrop-blur-md border-b border-white/[0.06] shadow-2xl shadow-black/30"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <a href="/" className="flex items-center group">
          <Image
            src="/logo.svg"
            alt="PT Launch Lab"
            width={160}
            height={56}
            className="h-11 w-auto object-contain block group-hover:hidden"
            priority
          />
          <Image
            src="/logo-hover.svg"
            alt="PT Launch Lab"
            width={160}
            height={56}
            className="h-11 w-auto object-contain hidden group-hover:block"
            priority
          />
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-white/55 hover:text-white text-sm font-medium transition-colors duration-200 tracking-wide"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/gym-partnership"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[11px] font-semibold hover:bg-gold/20 transition-all tracking-widest uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Partner Your Gym
          </a>
        </div>

        {/* CTA buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/book-call"
            className="px-5 py-2.5 rounded-full border border-gold/50 text-gold text-sm font-semibold hover:bg-gold hover:text-deep transition-all duration-200"
          >
            Discover Your Pathway
          </a>
          <a
            href="/enrol"
            className="px-5 py-2.5 rounded-full bg-gold text-deep text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20"
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
          <div className={`w-6 h-0.5 bg-white transition-all duration-200 ${open ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-6 h-0.5 bg-white my-1.5 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <div className={`w-6 h-0.5 bg-white transition-all duration-200 ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-deep/97 backdrop-blur-md border-t border-white/[0.06] px-6 py-6 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-white/55 hover:text-white font-medium py-1 transition-colors text-sm tracking-wide"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/gym-partnership"
            className="flex items-center gap-2 py-1 text-gold font-semibold text-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Partner Your Gym
          </a>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
            <a
              href="/book-call"
              className="text-center px-5 py-3 rounded-full border border-gold/50 text-gold font-semibold hover:bg-gold hover:text-deep transition-all"
            >
              Discover Your Pathway
            </a>
            <a
              href="/enrol"
              className="text-center px-5 py-3 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all"
            >
              Start Today →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
