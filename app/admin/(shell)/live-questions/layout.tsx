import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Questions — PT Launch Lab Admin",
  robots: { index: false, follow: false },
};

// The admin shell (app/admin/(shell)/layout.tsx) provides the background,
// the font, the navigation and the content width. This layout used to draw
// its own, which is how the admin ended up as a set of pages that looked
// like different products.
export default function LiveQuestionsAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
