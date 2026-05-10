"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Defer the Chatbot bundle to client-only after hydration. The component
// previously mounted on every page load and ran ~30-50KB of JS even when
// nobody opened the chat — punishing mobile LCP and TBT.
const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false });

// Hide the public visitor chatbot on internal admin routes (it overlaps with
// the WhatsApp inbox UI and isn't relevant to operators).
export default function ChatbotLazy() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <Chatbot />;
}
