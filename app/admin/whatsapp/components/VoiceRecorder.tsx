"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// VoiceRecorder
// In-browser audio recording for WhatsApp Cloud API voice messages.
//
// Format selection: prefer audio/ogg;codecs=opus (Firefox + accepted by Meta),
// fall back to audio/mp4 (Safari + accepted by Meta), then audio/webm;codecs=opus
// (Chrome default — same Opus stream as ogg but wrapped in WebM container).
// We send whatever mime type was actually recorded; in practice Meta accepts
// ogg-opus and mp4. WebM recordings may be rejected by Meta — surface the
// error to the user clearly if so.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  /** Fired when the user hits Send. Parent handles upload + Cloud API send. */
  onSend: (blob: Blob, mimeType: string, durationSec: number) => Promise<void> | void;
  /** Disable the recorder (e.g. while another upload is in flight). */
  disabled?: boolean;
};

type RecorderState = "idle" | "requesting" | "recording" | "preview" | "sending" | "error";

const PREFERRED_FORMATS = [
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm;codecs=opus",
];

function pickFormat(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const fmt of PREFERRED_FORMATS) {
    if (MediaRecorder.isTypeSupported(fmt)) return fmt;
  }
  return null;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder({ onSend, disabled }: Props) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount / state reset
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    stopStream();
    stopTimer();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setMimeType("");
    setDuration(0);
    setError(null);
    setState("idle");
    recorderRef.current = null;
    chunksRef.current = [];
  }, [stopStream, stopTimer, previewUrl]);

  useEffect(() => {
    return () => {
      stopStream();
      stopTimer();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopStream, stopTimer, previewUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    const fmt = pickFormat();
    if (!fmt) {
      setError("Your browser does not support voice recording.");
      setState("error");
      return;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: fmt });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalMime = fmt.split(";")[0]; // strip codec spec from mime type for upload
        const audioBlob = new Blob(chunksRef.current, { type: finalMime });
        const url = URL.createObjectURL(audioBlob);
        setBlob(audioBlob);
        setMimeType(finalMime);
        setPreviewUrl(url);
        setState("preview");
        stopStream();
        stopTimer();
      };
      recorder.start();
      startTimeRef.current = Date.now();
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 250);
      setState("recording");
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Microphone access blocked. Allow microphone access in your browser settings."
          : err instanceof Error
          ? err.message
          : "Couldn't access microphone.";
      setError(msg);
      setState("error");
      stopStream();
    }
  }, [stopStream, stopTimer]);

  const stopRecording = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") r.stop();
  }, []);

  const handleSend = useCallback(async () => {
    if (!blob) return;
    setState("sending");
    try {
      await onSend(blob, mimeType, duration);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send voice message.");
      setState("preview");
    }
  }, [blob, mimeType, duration, onSend, resetAll]);

  // ─── RENDER ────────────────────────────────────────────────────────────────

  // Idle — just the mic button
  if (state === "idle" || state === "error") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          aria-label="Record voice message"
          className="flex-shrink-0 p-2.5 rounded-full text-soft hover:text-gold hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <rect x="9" y="2" width="6" height="13" rx="3" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {error && (
          <p className="text-red-400 text-[10px] max-w-[180px] text-right leading-snug">{error}</p>
        )}
      </div>
    );
  }

  // Requesting mic permission
  if (state === "requesting") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card text-soft text-xs">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        Waiting for mic…
      </div>
    );
  }

  // Recording — pulsing red dot, timer, stop button
  if (state === "recording") {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-card border border-red-500/40">
        <span className="relative flex h-3 w-3 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <span className="text-white font-mono tabular-nums text-sm">
          {formatDuration(duration)}
        </span>
        <button
          type="button"
          onClick={resetAll}
          aria-label="Cancel recording"
          className="text-soft hover:text-white transition-colors p-1"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={stopRecording}
          aria-label="Stop recording"
          className="px-3 py-1.5 rounded-full bg-gold text-deep font-bold text-xs hover:brightness-110 transition-all"
        >
          Stop
        </button>
      </div>
    );
  }

  // Preview — play, duration, discard, send
  if (state === "preview" || state === "sending") {
    return (
      <div className="flex items-center gap-2 px-2 py-2 rounded-full bg-card border border-gold/30">
        {previewUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio
            src={previewUrl}
            controls
            preload="metadata"
            className="h-8 max-w-[180px] sm:max-w-[220px]"
            style={{ filter: "invert(0.85) hue-rotate(180deg)" }}
          />
        )}
        <button
          type="button"
          onClick={resetAll}
          disabled={state === "sending"}
          aria-label="Discard recording"
          className="text-soft hover:text-white transition-colors p-1 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={state === "sending"}
          aria-label="Send voice message"
          className="px-3 py-1.5 rounded-full bg-gold text-deep font-bold text-xs hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {state === "sending" ? "…" : "Send"}
        </button>
      </div>
    );
  }

  return null;
}
