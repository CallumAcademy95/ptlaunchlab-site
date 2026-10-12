import type { Metadata } from "next";
import type { ReactNode } from "react";

// noindex for /funnel (an ad landing page). page.tsx is a server shell that
// could export metadata, but it lives here so it also covers anything nested.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
