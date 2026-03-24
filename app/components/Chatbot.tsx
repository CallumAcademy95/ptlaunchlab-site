"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const OPENER = "Hey! I'm here to help with any questions about PT Launch Lab — the course, pricing, how it works, anything. What would you like to know?";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: OPENER },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });

    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let reply = "";

    setMessages([...next, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      reply += decoder.decode(value, { stream: true });
      setMessages([...next, { role: "assistant", content: reply }]);
    }

    setLoading(false);
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#F5C518] text-[#072B4A] flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
        style={{ boxShadow: "0 4px 24px rgba(245,197,24,0.4)" }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ height: "460px", background: "#072B4A", border: "1px solid rgba(59,130,246,0.25)" }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "#0D3559", borderBottom: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="w-9 h-9 rounded-full bg-[#F5C518] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#072B4A">
                <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">PT Launch Lab</p>
              <p className="text-[#8CA3BF] text-xs mt-0.5">Ask us anything</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "#F5C518", color: "#072B4A", borderBottomRightRadius: "4px" }
                      : { background: "#0D3559", color: "#CBD5E1", border: "1px solid rgba(59,130,246,0.2)", borderBottomLeftRadius: "4px" }
                  }
                >
                  {m.content || (
                    <span className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8CA3BF] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8CA3BF] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8CA3BF] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(59,130,246,0.2)", background: "#0D3559" }}>
            <div className="flex gap-2 items-center bg-[#072B4A] rounded-xl px-3 py-2" style={{ border: "1px solid rgba(59,130,246,0.25)" }}>
              <input
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#8CA3BF]"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg bg-[#F5C518] flex items-center justify-center shrink-0 disabled:opacity-40 hover:brightness-110 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#072B4A">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#072B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
