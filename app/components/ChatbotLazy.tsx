"use client";
import dynamic from "next/dynamic";

// Defer the Chatbot bundle to client-only after hydration. The component
// previously mounted on every page load and ran ~30-50KB of JS even when
// nobody opened the chat — punishing mobile LCP and TBT.
const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false });

export default Chatbot;
