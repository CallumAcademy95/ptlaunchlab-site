// page.tsx is a client component ("use client") so it cannot export metadata.
// Next.js takes route metadata from the nearest layout, so it lives here.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact PT Launch Lab | Speak to a Tutor Before You Enrol",
  description:
    "Questions about becoming a personal trainer? Talk to the team at PT Launch Lab — NCFE and Ofqual-regulated PT courses, studied online across the UK.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
