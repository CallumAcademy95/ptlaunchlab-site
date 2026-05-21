"use client";
import { useRef, useState, useEffect } from "react";

const reviews = [
  { name: "Jonathan Plummer",       label: "Level 3 Personal Training",  quote: "I completed my PT qualification with PT Launch Lab around Christmas time and I couldn't recommend them enough. Within the first week you get the feeling Callum genuinely cares — he's always on hand to answer any questions you have despite being a busy person himself, and always coming up with new ideas of how he can help support his learners. What I also love about PT Launch Lab is the amount of support they give you once you've completed the course. Most PTs will fail because they don't understand the business and marketing side of things, and PT Launch Lab help you improve in all these areas." },
  { name: "Rachel Waldock",         label: "Level 2 & Level 3 PT",      quote: "From start to finish, the course was structured, supportive, and everything I needed to make the career change I'd been putting off for years. Couldn't be happier with the experience." },
  { name: "Rebecca Davies",         label: "Level 3 Personal Training",  quote: "The support I received was second to none. After having my baby, I thought I'd struggle to find the time — but Callum and the team were so supportive and helpful every step of the way." },
  { name: "Matthew Bell",           label: "Level 3 Personal Training",  quote: "Fantastic from start to finish. The support didn't stop once I qualified — they've continued to offer guidance and help that's been invaluable as I build my business." },
  { name: "Annie Chomba-Kilbride",  label: "Level 3 Personal Training",  quote: "My training experience with PT Launch Lab has been amazing. I've gained new skills, knowledge and confidence. I was able to learn at my own pace and was well supported throughout." },
  { name: "Jordan Wills",           label: "Level 3 Personal Training",  quote: "I got qualified through PT Launch Lab who were really helpful throughout the process and have continued to help me get my PT business up and running. Highly recommended." },
  { name: "Leon Jones",             label: "Level 3 Personal Training",  quote: "Friendly, responsive and very helpful. Helped me every step of the way and provided great information and knowledge. Would highly recommend to anyone wanting their PT certification." },
  { name: "Sam Jordan",             label: "Level 3 Personal Training",  quote: "Great experience all round. They make getting your qualification so simple with an easy-to-use online learning platform. Highly recommend." },
  { name: "Sam Brown",              label: "PT Launch Lab Student",       quote: "Callum and Ryan helped me so much with not only the course but with also any other challenges I was unsure on. Nothing was too much to ask and both explained everything brilliantly — both really patient and understanding people. Could not recommend enough, thank you both very much!" },
  { name: "Liam Greenwood",         label: "Level 3 Personal Training",  quote: "Very good place to do your PT course, very knowledgeable on everything. You learn everything you need and the tutoring from Callum is great." },
  { name: "Kenan Kocar",            label: "PT Launch Lab Student",       quote: "Constantly getting face to face support as well as online, always giving you tips and help on questions you are unsure about." },
  { name: "Rebecca Sykes",          label: "Level 3 Personal Training",  quote: "Wow absolutely amazing place to train and learn to become a qualified PT! I've just become qualified and I honestly wouldn't have been able to do it without the support from Callum Brown all throughout. He's there every step of the way. If you're looking to learn to become qualified then I can 100% recommend these guys!" },
  { name: "Michelle",               label: "Level 3 Personal Training",  quote: "Highly recommend using PT Launch Lab. I work full time on a busy schedule, but they allowed me to complete the coursework and learn in my own time. I had the support and knowledge every step of the way from Cal. I am now a qualified Level 3 Personal Trainer and I couldn't have done it without the team!" },
  { name: "Terri Altilar",          label: "Level 3 Personal Training",  quote: "Highly recommend PT Launch Lab, especially if you want flexible learning. I work full time and generally very busy day to day, however PT Launch Lab allowed me to learn at my own rate while still ensuring I had the support and knowledge every step of the way. Callum Brown has been on hand pretty much 24/7 to help advise, support and answer any questions. I can't thank you all enough for helping me become a Level 3 Qualified PT!" },
  { name: "Mel Hume",               label: "Level 3 Personal Training",  quote: "Passed my Level 3 Personal Training yesterday with PT Launch Lab. Loved every minute. Callum was on hand to answer all my questions. Thank you for all the help and support." },
  { name: "Aydan Colley",           label: "PT Launch Lab Student",       quote: "Very positive experience with great content and support." },
  { name: "Declan Marsden",         label: "Level 3 Personal Training",  quote: "Officially passed my Level 3 personal training qualification today. Just want to give a shout-out to Cal, Chris and Craig for all the support I was given. If you're thinking about becoming a personal trainer then do not hesitate to go to PT Launch Lab." },
  { name: "Rob Fullam",             label: "PT Launch Lab Student",       quote: "Joined over a year ago, never looked back. Great set of lads running the place with plenty of knowledge and experience. From beginners to more experienced — PT Launch Lab suits all levels. If you want to train, lift or work 1-to-1 with a trainer, you're sure to find a fit here." },
];

export default function Reviews() {
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const startX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = reviews.length - visibleCount;
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));
  const next = () => setCurrent((c) => Math.min(c + 1, maxIndex));

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) next(); else if (diff < -50) prev();
  }
  function onMouseDown(e: React.MouseEvent) { isDragging.current = true; startX.current = e.clientX; }
  function onMouseUp(e: React.MouseEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startX.current - e.clientX;
    if (diff > 50) next(); else if (diff < -50) prev();
  }

  const cardWidthPct = 100 / visibleCount;

  return (
    <section className="bg-base py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-3">
              Student reviews
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-none tracking-tight">
              Don&apos;t just take
              <br />our word for it.
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 16 16" className="w-4 h-4 text-gold fill-current">
                    <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z"/>
                  </svg>
                ))}
              </div>
              <span className="text-white text-sm font-semibold">5.0</span>
              <span className="text-soft/60 text-sm">· 19 Verified Reviews</span>
              <a
                href="https://www.google.com/search?q=pt+launch+lab+pontefract+reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-sm font-medium hover:underline ml-1"
              >
                See all →
              </a>
            </div>
          </div>

          {/* Arrow buttons */}
          <div className="flex gap-3">
            <button
              onClick={prev}
              disabled={current === 0}
              aria-label="Previous review"
              className="w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center text-white hover:border-gold/50 hover:text-gold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={next}
              disabled={current >= maxIndex}
              aria-label="Next review"
              className="w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center text-white hover:border-gold/50 hover:text-gold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * cardWidthPct}%)` }}
          >
            {reviews.map((rev) => (
              <div
                key={rev.name}
                className="shrink-0 px-2.5"
                style={{ width: `${cardWidthPct}%` }}
              >
                <div className="bg-card border border-white/[0.07] rounded-2xl p-6 h-full flex flex-col gap-4 hover:border-gold/20 transition-colors">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gold fill-current">
                        <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/85 text-sm leading-relaxed flex-1">
                    &ldquo;{rev.quote}&rdquo;
                  </p>
                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-gold text-sm font-bold">{rev.name}</p>
                    <p className="text-soft/50 text-xs mt-0.5">{rev.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-gold w-6" : "bg-white/20 w-1.5 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
