"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[rgba(7,43,74,0.9)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.12)]"
          : "bg-gradient-to-b from-[#072B4A] to-[#0A3A66]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <a href="/">
            <Image src="/logo.png" alt="PT Launch Lab" width={140} height={50} className="h-14 w-auto object-contain" />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">Home</a>
            <a href="/quiz" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">Free Quiz</a>
            <a href="/#how-it-works" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">How It Works</a>
            <a href="/#faq" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="https://signup-lauchlab.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-[#FFD400] hover:bg-[#F5C400] text-[#072B4A] text-sm font-bold rounded-lg transition-all"
            >
              Enrol Now
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
