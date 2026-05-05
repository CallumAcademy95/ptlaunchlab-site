import BookCallPage from "./BookCallPage";
import Breadcrumbs from "../components/Breadcrumbs";

export const metadata = {
  title: "Book a Free 15-Minute Call — Talk to a PT Expert | PT Launch Lab",
  description: "Book a free 15-minute call with Callum, Miles or Ryan. No pressure, no script — just an honest conversation about becoming a personal trainer and whether PT Launch Lab is right for you.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/book-call",
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs trail={[{ name: "Book a Call", url: "https://ptlaunchlab.co.uk/book-call" }]} />
      <BookCallPage />
    </>
  );
}
