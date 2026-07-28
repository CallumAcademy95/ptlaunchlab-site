"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Defer the Chatbot bundle to client-only after hydration. The component
// previously mounted on every page load and ran ~30-50KB of JS even when
// nobody opened the chat — punishing mobile LCP and TBT.
const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false });

// Hide the public visitor chatbot on internal routes. /admin overlaps with the
// WhatsApp inbox UI, and /partners is a signed-in business portal — a prospect
// chat widget there is answering a question its occupants aren't asking, and it
// covers the corner of every page they use.
export default function ChatbotLazy() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/partners")) return null;
  return <Chatbot />;
}
