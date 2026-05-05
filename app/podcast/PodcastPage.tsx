"use client";

import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useState } from "react";

export type Episode = {
  id: string;
  ep: number | null;
  title: string;
  desc: string;
  date: string;
  category: "transformation" | "business" | "industry";
};

const CATEGORIES = [
  { key: "all", label: "All Episodes" },
  { key: "transformation", label: "Transformation Stories" },
  { key: "business", label: "PT Business" },
  { key: "industry", label: "Industry Interviews" },
];

type Props = {
  episodes: Episode[];
  spotifyUrl: string;
  youtubeUrl: string;
  rssUrl: string;
};

export default function PodcastPage({ episodes, spotifyUrl, youtubeUrl, rssUrl }: Props) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all" ? episodes : episodes.filter((e) => e.category === active);

  return (
    <>
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-base py-20 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[400px] h-[400px] rounded-full bg-blue opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto text-center">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">
              The Podcast
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              Real stories. Real{" "}
              <span className="text-gold">Yorkshire honesty.</span>
            </h1>
            <p className="text-xl text-soft/60 leading-relaxed max-w-2xl mx-auto mb-8">
              Every week Callum, Miles and Ryan sit down with people who&apos;ve built careers in fitness — transformation stories, PT business building, and the honest side of the industry. <span className="text-white">Watch on YouTube or listen on Spotify.</span>
            </p>

            {/* LISTEN ON */}
            <p className="text-soft/60 text-xs font-semibold tracking-widest uppercase mb-4">
              Listen / Watch
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Listen on Spotify"
                className="inline-flex items-center hover:brightness-110 transition-all"
              >
                {/* Official Spotify "Listen on" badge — must not be modified per Spotify brand guidelines */}
                <Image
                  src="/spotify-badges/listen-wht-grn.svg"
                  alt="Listen on Spotify"
                  width={165}
                  height={40}
                  unoptimized
                />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch on YouTube"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#FF0000] text-white font-bold text-sm hover:brightness-110 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </a>
              <span
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-blue/30 text-soft/60 font-semibold text-sm cursor-default"
                title="Coming soon to Apple Podcasts"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5a3 3 0 110 6 3 3 0 010-6zM6.7 17.4c0-3.5 5.3-3.5 5.3-3.5s5.3 0 5.3 3.5c0 1-1 1.6-2.5 1.6-1 0-1.7-.5-2.8-.5s-1.8.5-2.8.5c-1.5 0-2.5-.6-2.5-1.6z" />
                </svg>
                Apple Podcasts (soon)
              </span>
              <a
                href={rssUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RSS feed"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gold/40 text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20A2.18 2.18 0 0 1 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
                </svg>
                RSS
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <a
                href="/quiz"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
              >
                Take the 60-Second Quiz →
              </a>
              <a
                href="https://www.instagram.com/ptlaunchlab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
              >
                Follow on Instagram
              </a>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="bg-surface border-y border-blue/15 py-6 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
            {[
              { value: `${episodes.length}+`, label: "Episodes" },
              { value: "Weekly", label: "New episodes" },
              { value: "Spotify + YouTube", label: "Listen or watch" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-gold text-2xl font-bold">{s.value}</p>
                <p className="text-soft/60 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EPISODES */}
        <section className="bg-base py-16 px-6">
          <div className="max-w-6xl mx-auto">

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-10">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    active === cat.key
                      ? "bg-gold text-deep"
                      : "border border-blue/30 text-soft/60 hover:border-gold/40 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Episode grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((ep) => (
                <a
                  key={ep.id}
                  href={`https://www.youtube.com/watch?v=${ep.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card border border-white/[0.07] rounded-2xl overflow-hidden hover:border-gold/40 transition-all hover:-translate-y-0.5"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video bg-base">
                    <Image
                      src={`https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg`}
                      alt={ep.title}
                      fill
                      className="object-cover"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center">
                        <svg className="w-6 h-6 text-deep ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* Episode badge */}
                    {ep.ep && (
                      <span className="absolute top-3 left-3 bg-gold text-deep text-xs font-bold px-2.5 py-1 rounded-full">
                        EP.{ep.ep}
                      </span>
                    )}
                    {/* Category badge */}
                    <span className="absolute top-3 right-3 bg-deep/80 text-soft/60 text-xs px-2.5 py-1 rounded-full capitalize">
                      {ep.category === "transformation" ? "Story" : ep.category === "business" ? "Business" : "Interview"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-white font-bold text-sm leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {ep.title}
                    </h2>
                    <p className="text-soft/60 text-xs leading-relaxed line-clamp-2 mb-4">
                      {ep.desc}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Watch on YouTube →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface py-20 px-6 text-center border-t border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-4">
              Ready to write your own story?
            </h2>
            <p className="text-soft/60 text-lg mb-8">
              Every person on this podcast started where you are now. Book a free call and find out if PT Launch Lab is the right next step for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/book-call"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20"
              >
                Discover Your Pathway →
              </a>
              <a
                href="/courses"
                className="px-8 py-4 rounded-full border border-gold text-gold font-semibold hover:bg-gold hover:text-deep transition-all"
              >
                View the Course
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
