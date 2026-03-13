import { useState, useEffect } from 'react';
import logo from 'figma:asset/985203223b671013c9e7c68129e5bfa1bfeaa435.png';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[rgba(7,43,74,0.9)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.12)]'
          : 'bg-gradient-to-b from-[#072B4A] to-[#0A3A66]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="https://ptlaunchlab.co.uk/">
              <img src={logo} alt="PT Launch Lab" className="h-16" />
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="https://ptlaunchlab.co.uk/" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">
              Home
            </a>
            <a href="https://ptlaunchlab.co.uk/courses" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">
              Courses
            </a>
            <a href="https://ptlaunchlab.co.uk/about" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">
              About
            </a>
            <a href="https://ptlaunchlab.co.uk/trial" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">
              Free Trial
            </a>
            <a href="https://ptlaunchlab.co.uk/blog" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">
              Blog
            </a>
            <a href="https://ptlaunchlab.co.uk/contact" className="text-[#D6DEE6] hover:text-white transition-colors text-sm">
              Contact
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://ptlauchlab.merve.online/login"
              className="hidden md:block px-4 py-2 border border-[rgba(255,255,255,0.3)] text-white text-sm rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-all"
            >
              Existing Students
            </a>
            <a 
              href="https://calendly.com/ptlaunchlab-info/free-consultation"
              className="px-5 py-2 bg-[#FFD400] hover:bg-[#F5C400] text-[#072B4A] text-sm rounded-lg transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}