"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Conversation = {
  phone: string;
  contact_name: string | null;
  latest_body: string;
  latest_direction: "inbound" | "outbound";
  latest_at: string;
  latest_type: string;
  inbound_count: number;
  outbound_count: number;
};

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  phone: string;
  contact_name: string | null;
  body: string | null;
  message_type: string | null;
  status: string | null;
  created_at: string;
};

const CONV_POLL_MS = 5000;
const MSG_POLL_MS = 3000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const sameYesterday =
    d.getDate() === yest.getDate() &&
    d.getMonth() === yest.getMonth() &&
    d.getFullYear() === yest.getFullYear();
  if (sameYesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatPhoneDisplay(phone: string): string {
  // 447399635694 -> +44 7399 635694
  if (phone.startsWith("44") && phone.length === 12) {
    return `+44 ${phone.slice(2, 6)} ${phone.slice(6)}`;
  }
  return `+${phone}`;
}

function ChatBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2 shadow-sm ${
          isOutbound
            ? "bg-gold text-deep rounded-br-sm"
            : "bg-card text-white border border-white/10 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {message.body || `[${message.message_type || "non-text"} message]`}
        </p>
        <p
          className={`text-[10px] mt-1 ${
            isOutbound ? "text-deep/60" : "text-white/50"
          }`}
        >
          {formatTime(message.created_at)}
          {isOutbound && message.status ? ` · ${message.status}` : ""}
        </p>
      </div>
    </div>
  );
}

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const threadRef = useRef<HTMLDivElement | null>(null);

  // ─── Conversations polling ────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp-conversations", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        setError(data.error || "Failed to load conversations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const t = setInterval(fetchConversations, CONV_POLL_MS);
    return () => clearInterval(t);
  }, [fetchConversations]);

  // ─── Messages polling for selected phone ──────────────────────────────────
  const fetchMessages = useCallback(async (phone: string) => {
    try {
      const res = await fetch(
        `/api/whatsapp-messages?phone=${encodeURIComponent(phone)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch {
      // silent — keep prior messages
    }
  }, []);

  useEffect(() => {
    if (!selectedPhone) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedPhone);
    const t = setInterval(() => fetchMessages(selectedPhone), MSG_POLL_MS);
    return () => clearInterval(t);
  }, [selectedPhone, fetchMessages]);

  // Scroll thread to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPhone || !compose.trim() || sending) return;
      setSending(true);
      setError(null);
      const text = compose.trim();
      try {
        const res = await fetch("/api/whatsapp-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: selectedPhone, message: text }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Send failed");
          setSending(false);
          return;
        }
        setCompose("");
        // Refresh thread + conversation list immediately after send
        await Promise.all([fetchMessages(selectedPhone), fetchConversations()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      } finally {
        setSending(false);
      }
    },
    [selectedPhone, compose, sending, fetchMessages, fetchConversations]
  );

  // ─── Filtered conversations by search ─────────────────────────────────────
  const visibleConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.phone.includes(q) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(q)) ||
        (c.latest_body && c.latest_body.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const selected = conversations.find((c) => c.phone === selectedPhone);

  return (
    <div className="flex h-screen [height:100dvh] overflow-hidden">
      {/* SIDEBAR — full width on mobile when no conversation selected; hidden on mobile when one is */}
      <aside
        className={`flex-shrink-0 bg-base border-r border-white/10 flex-col sm:flex sm:w-[340px] md:w-[380px] ${
          selectedPhone ? "hidden w-full" : "flex w-full"
        }`}
      >
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-gold text-[10px] font-bold tracking-widest uppercase">
              PT Launch Lab
            </p>
            <h1 className="text-white font-bold text-lg">WhatsApp Inbox</h1>
          </div>
          <a href="/" className="text-soft text-xs hover:text-gold transition-colors">
            ← Site
          </a>
        </header>

        <div className="px-4 py-3 border-b border-white/10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, number, message…"
            className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-white placeholder:text-soft text-sm focus:border-gold/60 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading && conversations.length === 0 && (
            <p className="text-soft text-sm px-5 py-8 text-center">Loading…</p>
          )}
          {!convLoading && visibleConversations.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-soft text-sm mb-2">No conversations yet.</p>
              <p className="text-soft/70 text-xs leading-relaxed">
                When someone messages your business WhatsApp number, they&apos;ll appear here.
              </p>
            </div>
          )}
          {visibleConversations.map((c) => {
            const isActive = c.phone === selectedPhone;
            return (
              <button
                key={c.phone}
                onClick={() => setSelectedPhone(c.phone)}
                className={`w-full text-left px-5 py-3 border-b border-white/[0.04] transition-colors ${
                  isActive
                    ? "bg-card"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="text-white font-semibold text-sm truncate">
                    {c.contact_name || formatPhoneDisplay(c.phone)}
                  </p>
                  <p className="text-soft text-[11px] flex-shrink-0">
                    {formatTime(c.latest_at)}
                  </p>
                </div>
                {c.contact_name && (
                  <p className="text-soft text-[11px] mb-0.5">
                    {formatPhoneDisplay(c.phone)}
                  </p>
                )}
                <p className="text-white/70 text-[13px] truncate leading-snug">
                  {c.latest_direction === "outbound" && (
                    <span className="text-gold">→ </span>
                  )}
                  {c.latest_body || `[${c.latest_type || "non-text"}]`}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* THREAD + COMPOSE — hidden on mobile until a conversation is selected */}
      <main
        className={`flex-1 flex-col bg-surface min-w-0 sm:flex ${
          selectedPhone ? "flex" : "hidden"
        }`}
      >
        {!selectedPhone && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6 max-w-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-white/10 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gold">
                  <path
                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg mb-2">
                Pick a conversation
              </h2>
              <p className="text-soft text-sm leading-relaxed">
                Select a chat from the left to read messages and reply. Free-form replies
                only work within 24h of the lead&apos;s last message.
              </p>
            </div>
          </div>
        )}

        {selectedPhone && (
          <>
            <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-base flex items-center gap-3">
              <button
                onClick={() => setSelectedPhone(null)}
                aria-label="Back to conversations"
                className="text-white hover:text-gold transition-colors sm:hidden flex-shrink-0 -ml-1 p-1"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-bold text-base truncate">
                  {selected?.contact_name || formatPhoneDisplay(selectedPhone)}
                </h2>
                <p className="text-soft text-xs truncate">
                  {selected?.contact_name && formatPhoneDisplay(selectedPhone)}
                </p>
              </div>
            </header>

            <div
              ref={threadRef}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, rgba(245,197,24,0.03), transparent 40%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.04), transparent 40%)",
              }}
            >
              {messages.length === 0 && (
                <p className="text-soft text-sm text-center py-12">No messages yet.</p>
              )}
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
            </div>

            {error && (
              <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSend}
              className="border-t border-white/10 bg-base px-3 sm:px-4 py-3 flex items-end gap-2 sm:gap-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <textarea
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                onKeyDown={(e) => {
                  // On mobile keyboards Enter often inserts a newline; only intercept
                  // on devices likely to have a physical keyboard (no fine-pointer hint).
                  if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(hover: hover)").matches) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                rows={1}
                placeholder="Type a message…"
                className="flex-1 px-4 py-3 rounded-2xl bg-card border border-white/10 text-white placeholder:text-soft text-[15px] resize-none focus:border-gold/60 focus:outline-none max-h-32"
                style={{ minHeight: "48px" }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!compose.trim() || sending}
                className="px-5 py-3 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
