import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Questions — PT Launch Lab Admin",
  robots: { index: false, follow: false },
};

export default function LiveQuestionsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-deep text-white">{children}</div>;
}
