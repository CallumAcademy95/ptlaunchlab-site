"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VoiceRecorder from "./components/VoiceRecorder";

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
  media_id: string | null;
  media_url: string | null;
  media_filename: string | null;
  media_mime_type: string | null;
  media_caption: string | null;
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

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (dDay === today) return "Today";
  if (dDay === today - dayMs) return "Yesterday";
  if (dDay > today - 7 * dayMs) {
    return d.toLocaleDateString("en-GB", { weekday: "long" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function StatusTicks({ status }: { status: string | null }) {
  // sent (single grey), delivered (double grey), read (double blue), failed (red !)
  const s = (status || "sent").toLowerCase();
  if (s === "failed") {
    return (
      <span className="inline-flex items-center" title="Failed to send">
        <svg viewBox="0 0 16 16" className="w-4 h-4 text-red-500">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 4v5M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  const isRead = s === "read";
  const isDouble = isRead || s === "delivered";
  const colorClass = isRead ? "text-blue" : "text-deep/50";
  return (
    <span
      className={`inline-flex items-center ${colorClass}`}
      title={s.charAt(0).toUpperCase() + s.slice(1)}
    >
      <svg viewBox="0 0 18 12" className="w-4 h-3" fill="none">
        {/* first tick */}
        <path
          d="M1 6.5L4.5 10L11 2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* second tick (only if delivered or read) */}
        {isDouble && (
          <path
            d="M7 10L17 2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  const isImage =
    message.message_type === "image" ||
    !!(message.media_mime_type && message.media_mime_type.startsWith("image/"));
  const isAudio =
    message.message_type === "audio" ||
    message.message_type === "voice" ||
    !!(message.media_mime_type && message.media_mime_type.startsWith("audio/"));
  const isDocument =
    message.message_type === "document" ||
    message.media_mime_type === "application/pdf";
  const hasMedia = isImage || isAudio || isDocument || !!message.media_url;
  // For text messages: show the body. For media messages: show the caption (if any).
  const text = hasMedia ? message.media_caption : message.body;

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-1.5`}>
      <div
        className={`max-w-[78%] rounded-2xl shadow-sm overflow-hidden ${
          isOutbound
            ? "bg-gold text-deep rounded-br-sm"
            : "bg-card text-white border border-white/10 rounded-bl-sm"
        } ${hasMedia ? "p-1.5" : "px-3.5 py-2"}`}
      >
        {/* Media preview */}
        {hasMedia && isImage && message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl overflow-hidden bg-black/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.media_url}
              alt={message.media_filename || "Image"}
              className="block w-full h-auto max-h-[420px] object-cover"
              loading="lazy"
            />
          </a>
        )}
        {hasMedia && isImage && !message.media_url && (
          <div className="rounded-xl bg-black/20 px-3 py-8 text-center text-xs opacity-70">
            Image (still processing…)
          </div>
        )}
        {hasMedia && isAudio && message.media_url && (
          <div className={`rounded-xl px-2 py-1 ${isOutbound ? "bg-deep/10" : "bg-white/5"}`}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio
              src={message.media_url}
              controls
              preload="metadata"
              className="block w-full max-w-[260px]"
              style={isOutbound ? {} : { filter: "invert(0.85) hue-rotate(180deg)" }}
            />
          </div>
        )}
        {hasMedia && isAudio && !message.media_url && (
          <div className="rounded-xl bg-black/20 px-3 py-4 text-center text-xs opacity-70">
            Voice message (still processing…)
          </div>
        )}
        {hasMedia && isDocument && (
          <a
            href={message.media_url || "#"}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              isOutbound ? "bg-deep/10" : "bg-white/5"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 flex-shrink-0">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="text-sm truncate">{message.media_filename || "Document"}</span>
          </a>
        )}

        {/* Text or caption */}
        <div className={hasMedia ? "px-2.5 pt-1.5 pb-1" : ""}>
          {text && (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
          )}
          {!text && !hasMedia && (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed italic opacity-70">
              [{message.message_type || "non-text"} message]
            </p>
          )}
          <div
            className={`flex items-center gap-1 justify-end mt-0.5 -mb-0.5 ${
              isOutbound ? "text-deep/55" : "text-white/45"
            }`}
          >
            <span className="text-[10px] leading-none">{formatTime(message.created_at)}</span>
            {isOutbound && <StatusTicks status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="px-3 py-1 rounded-full bg-deep/70 backdrop-blur-sm text-white/70 text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
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
  const [attachment, setAttachment] = useState<{
    file: File;
    previewUrl: string;
    mediaId: string | null;
    uploading: boolean;
    error: string | null;
  } | null>(null);

  const [attachMenuOpen, setAttachMenuOpen] = useState(false);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);

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

  // ─── Attachment picker + upload ───────────────────────────────────────────
  const handleAttachmentChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // reset so picking the same file again triggers onChange
      if (!file) return;
      if (file.size > 16 * 1024 * 1024) {
        setError("File too large (max 16MB)");
        return;
      }
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : "";
      setAttachment({ file, previewUrl, mediaId: null, uploading: true, error: null });

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/whatsapp-upload-media", { method: "POST", body: fd });
        const data = await res.json();
        if (!data.success) {
          setAttachment((prev) =>
            prev ? { ...prev, uploading: false, error: data.error || "Upload failed" } : null
          );
          return;
        }
        setAttachment((prev) =>
          prev ? { ...prev, uploading: false, mediaId: data.media_id } : null
        );
      } catch (err) {
        setAttachment((prev) =>
          prev
            ? {
                ...prev,
                uploading: false,
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : null
        );
      }
    },
    []
  );

  const clearAttachment = useCallback(() => {
    setAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  // Close the attach menu when clicking outside it
  useEffect(() => {
    if (!attachMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (attachMenuRef.current && target && !attachMenuRef.current.contains(target)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [attachMenuOpen]);

  // ─── Voice message send ───────────────────────────────────────────────────
  const handleVoiceSend = useCallback(
    async (audioBlob: Blob, audioMime: string) => {
      if (!selectedPhone) return;
      setError(null);

      // 1) Upload the recorded audio to Meta via our upload endpoint
      const fd = new FormData();
      const ext =
        audioMime.includes("ogg") ? "ogg" : audioMime.includes("mp4") ? "m4a" : "webm";
      const filename = `voice-${Date.now()}.${ext}`;
      fd.append("file", new File([audioBlob], filename, { type: audioMime }));

      const uploadRes = await fetch("/api/whatsapp-upload-media", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Voice upload failed");
      }

      // 2) Send the audio via Cloud API
      const sendRes = await fetch("/api/whatsapp-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedPhone,
          media: {
            media_id: uploadData.media_id,
            type: "audio",
            filename,
            mime_type: audioMime,
            media_url: uploadData.media_url,
          },
        }),
      });
      const sendData = await sendRes.json();
      if (!sendData.success) {
        throw new Error(sendData.error || "Voice send failed");
      }

      // 3) Refresh thread + conversation list
      await Promise.all([fetchMessages(selectedPhone), fetchConversations()]);
    },
    [selectedPhone, fetchMessages, fetchConversations]
  );

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPhone || sending) return;

      const text = compose.trim();
      const hasMedia = attachment && attachment.mediaId;
      if (!text && !hasMedia) return;
      if (attachment && attachment.uploading) return; // wait for upload to finish

      setSending(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = { phone: selectedPhone };
        if (text) payload.message = text;
        if (hasMedia && attachment) {
          payload.media = {
            media_id: attachment.mediaId,
            type: attachment.file.type === "application/pdf" ? "document" : "image",
            filename: attachment.file.name,
            mime_type: attachment.file.type,
          };
        }

        const res = await fetch("/api/whatsapp-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Send failed");
          setSending(false);
          return;
        }
        setCompose("");
        clearAttachment();
        await Promise.all([fetchMessages(selectedPhone), fetchConversations()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      } finally {
        setSending(false);
      }
    },
    [selectedPhone, compose, sending, attachment, clearAttachment, fetchMessages, fetchConversations]
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/admin-logout", { method: "POST" });
                } finally {
                  window.location.href = "/admin/login";
                }
              }}
              className="text-soft text-xs hover:text-gold transition-colors"
              aria-label="Sign out"
            >
              Sign out
            </button>
            <a href="/" className="text-soft text-xs hover:text-gold transition-colors">
              ← Site
            </a>
          </div>
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
                // Subtle "doodle" wallpaper pattern (cheap inline SVG, no extra request).
                // Plus a soft warm-gold + cool-blue radial wash to add depth.
                backgroundColor: "#0C1F3A",
                backgroundImage: [
                  "radial-gradient(circle at 30% 15%, rgba(245,197,24,0.04), transparent 45%)",
                  "radial-gradient(circle at 80% 85%, rgba(59,130,246,0.05), transparent 45%)",
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.025' stroke-width='1'%3E%3Ccircle cx='20' cy='20' r='4'/%3E%3Cpath d='M40 60 q10 -10 20 0 t20 0'/%3E%3Cpath d='M70 30 l10 10 -10 10'/%3E%3Ccircle cx='100' cy='100' r='3'/%3E%3Cpath d='M10 90 l8 -8 8 8'/%3E%3C/g%3E%3C/svg%3E\")",
                ].join(", "),
              }}
            >
              {messages.length === 0 && (
                <p className="text-soft text-sm text-center py-12">No messages yet.</p>
              )}
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const showDate = !prev || !isSameDay(prev.created_at, m.created_at);
                return (
                  <div key={m.id}>
                    {showDate && <DateSeparator label={formatDateSeparator(m.created_at)} />}
                    <ChatBubble message={m} />
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Attachment preview strip — sits above the compose form when something is queued */}
            {attachment && (
              <div className="border-t border-white/10 bg-card px-3 sm:px-4 py-3 flex items-center gap-3">
                {attachment.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.previewUrl}
                    alt="Attachment preview"
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-deep/60 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gold">
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{attachment.file.name}</p>
                  <p className="text-soft text-xs">
                    {attachment.uploading
                      ? "Uploading…"
                      : attachment.error
                      ? `Error: ${attachment.error}`
                      : attachment.mediaId
                      ? "Ready to send"
                      : "Pending"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAttachment}
                  aria-label="Remove attachment"
                  className="text-soft hover:text-white p-2 -mr-1"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            <form
              onSubmit={handleSend}
              className="border-t border-white/10 bg-base px-3 sm:px-4 py-3 flex items-end gap-2 sm:gap-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAttachmentChange}
                className="hidden"
              />
              <input
                ref={docInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleAttachmentChange}
                className="hidden"
              />
              <div ref={attachMenuRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAttachMenuOpen((v) => !v)}
                  aria-label="Attach file"
                  aria-expanded={attachMenuOpen}
                  disabled={sending || (attachment && attachment.uploading) || false}
                  className="p-2.5 rounded-full text-soft hover:text-gold hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path
                      d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {attachMenuOpen && (
                  <div
                    className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-card border border-white/15 shadow-xl shadow-black/40 overflow-hidden z-10"
                    role="menu"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen(false);
                        imageInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/5 transition-colors"
                      role="menuitem"
                    >
                      <span className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm font-medium">Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen(false);
                        docInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/5 transition-colors border-t border-white/10"
                      role="menuitem"
                    >
                      <span className="w-9 h-9 rounded-full bg-blue/20 text-blue flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm font-medium">Document <span className="text-soft text-xs">(PDF)</span></span>
                    </button>
                  </div>
                )}
              </div>
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
                disabled={
                  sending ||
                  (!compose.trim() && !attachment?.mediaId) ||
                  Boolean(attachment && attachment.uploading)
                }
                className="px-5 py-3 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {sending ? "Sending…" : "Send"}
              </button>
              <VoiceRecorder
                onSend={handleVoiceSend}
                disabled={sending || Boolean(attachment && attachment.uploading)}
              />
            </form>
          </>
        )}
      </main>
    </div>
  );
}
