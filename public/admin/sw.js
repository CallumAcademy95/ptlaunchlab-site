// PTLL Admin — service worker for phone alerts (Web Push).
//
// Served at /admin/sw.js and registered with scope "/admin/" so it only ever
// controls the admin. Deliberately no fetch handler: there is no offline
// caching, because admin data has to be live. It receives pushes (sent by
// Leads Central) and routes taps back into the admin.

const FALLBACK_URL = "/admin/leads";
const ICON = "/admin-icon-192.png";

// Only ever open a same-origin admin page. Anything else (another origin, a
// non-admin path, garbage) falls back to the leads list.
function safeAdminUrl(raw, origin) {
  try {
    const u = new URL(raw || FALLBACK_URL, origin);
    if (u.origin === origin && u.pathname.startsWith("/admin/")) return u.href;
  } catch {}
  return new URL(FALLBACK_URL, origin).href;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  if (!data || typeof data !== "object") data = {};
  const title = data.title || "PTLL Admin";
  const options = {
    body: data.body || "",
    icon: ICON,
    badge: ICON,
    data: { url: data.url || FALLBACK_URL },
    timestamp: Date.now(),
  };
  if (data.tag) {
    options.tag = String(data.tag);
    options.renotify = true;
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const origin = self.location.origin;
  const target = safeAdminUrl(event.notification.data && event.notification.data.url, origin);
  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of list) {
        let path = "";
        try {
          const cu = new URL(client.url);
          if (cu.origin !== origin) continue;
          path = cu.pathname;
        } catch {
          continue;
        }
        if (!path.startsWith("/admin/")) continue;
        try {
          const focused = await client.focus();
          if ("navigate" in client) {
            await (focused || client).navigate(target);
          }
          return;
        } catch {
          // fall through to openWindow
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })()
  );
});
