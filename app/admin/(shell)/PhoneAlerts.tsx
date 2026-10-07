"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

// Phone alerts — turn Web Push on/off for this device and send a test.
//
// Leads Central sends the actual alerts (handover / Prime lead) to every
// subscribed device; this only manages the subscription. Lives in the rail
// (desktop) and the drawer (phone), on the dark background.

const SW_URL = "/admin/sw.js";
const SW_SCOPE = "/admin/";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Status = "loading" | "unsupported" | "ios-install" | "off" | "blocked" | "on";

// Several copies can mount (rail + drawer); only re-sync the server once per page load.
let resynced = false;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports as Mac; touch points give it away.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

async function postJson(url: string, body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || data.ok === false) {
    throw new Error(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
  }
  return data;
}

async function existingSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export function PhoneAlerts() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported) {
      // iPhone Safari only exposes push once installed to the home screen.
      setStatus(isIos() && !isStandalone() ? "ios-install" : "unsupported");
      return;
    }
    if (isIos() && !isStandalone()) {
      setStatus("ios-install");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("blocked");
      return;
    }
    try {
      const sub = await existingSubscription();
      if (sub) {
        setStatus("on");
        if (!resynced) {
          resynced = true;
          // Idempotent upsert keeps the server in sync (e.g. after a DB cleanup).
          postJson("/api/admin-push/subscribe", sub.toJSON()).catch(() => {});
        }
      } else {
        setStatus("off");
      }
    } catch {
      setStatus("off");
    }
  }, []);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    void refresh();
  }, [refresh]);

  if (!VAPID_PUBLIC_KEY) {
    return <p className="px-3 text-[11px] text-slate-500">Phone alerts not configured</p>;
  }

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      await postJson("/api/admin-push/subscribe", sub.toJSON());
      setStatus("on");
      setMessage("Alerts are on for this device.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not turn on alerts.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    try {
      const data = await postJson("/api/admin-push/test");
      const sent = Number(data.sent ?? 0);
      setMessage(`Sent to ${sent} device${sent === 1 ? "" : "s"}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const sub = await existingSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await postJson("/api/admin-push/unsubscribe", { endpoint });
      }
      setStatus("off");
      setMessage("Alerts are off for this device.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not turn off alerts.");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60";

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-slate-300">
      <p className="flex items-center gap-2 text-xs font-semibold text-white">
        {status === "on" ? (
          <Bell className="h-3.5 w-3.5 text-[#F5C518]" />
        ) : (
          <BellOff className="h-3.5 w-3.5 text-slate-500" />
        )}
        Phone alerts{status === "on" ? ": on" : status === "off" ? ": off" : ""}
      </p>

      {status === "loading" && <p className="mt-1.5 text-[11px] text-slate-500">Checking…</p>}
      {status === "unsupported" && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
          This browser can&apos;t receive push notifications.
        </p>
      )}
      {status === "ios-install" && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
          On iPhone: Share → Add to Home Screen, then open PTLL Admin from your home screen and turn
          on alerts.
        </p>
      )}
      {status === "blocked" && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
          Notifications are blocked in your browser settings.
        </p>
      )}

      {status === "off" && (
        <button
          type="button"
          disabled={busy}
          onClick={turnOn}
          className={`${btn} mt-2 w-full bg-[#F5C518] text-slate-900 hover:bg-[#ffd43b]`}
        >
          {busy ? "Turning on…" : "Turn on phone alerts"}
        </button>
      )}
      {status === "on" && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={sendTest}
            className={`${btn} flex-1 bg-blue-700 text-white hover:bg-blue-600`}
          >
            Send test
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={turnOff}
            className={`${btn} text-slate-300 hover:bg-white/10 hover:text-white`}
          >
            Turn off
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="mt-2 text-[11px] leading-snug text-slate-300">
          {message}
        </p>
      )}
    </div>
  );
}
