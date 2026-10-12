import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentor Partner Agreement | PT Launch Lab",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
