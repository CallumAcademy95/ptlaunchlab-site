// Which paths the middleware puts behind the admin auth cookie.
//
// Pure (no Next imports) so tests can exercise it directly. The webhook is
// intentionally excluded — Meta hits it without our cookie and has its own
// verify token defence.
//
// Note: /api/admin/* is NOT gated here (those routes check auth themselves
// or are public). New admin-only APIs should live under a prefix listed below.
export function isProtectedAdminPath(pathname: string): boolean {
  if (pathname === "/admin/login") return false;
  if (pathname.startsWith("/admin/")) return true;
  if (pathname === "/admin") return true;
  // Protected WhatsApp API endpoints (everything except the webhook + login + logout)
  if (pathname === "/api/whatsapp-send") return true;
  if (pathname === "/api/whatsapp-conversations") return true;
  if (pathname === "/api/whatsapp-messages") return true;
  if (pathname === "/api/whatsapp-upload-media") return true;
  // Phone alerts (web push) subscribe / unsubscribe / test
  if (pathname.startsWith("/api/admin-push/")) return true;
  return false;
}
