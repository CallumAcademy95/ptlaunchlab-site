import type { Metadata } from "next";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import ManageBooking from "../../ManageBooking";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your call | PT Launch Lab", robots: { index: false } };

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <Nav />
      <main className="bg-base min-h-screen px-4 py-10 md:py-16"><div className="max-w-xl mx-auto"><ManageBooking token={token} /></div></main>
      <Footer />
    </>
  );
}
