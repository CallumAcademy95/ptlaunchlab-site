// Booking URLs carry secrets (?t= signed lead link; /book/manage/<token>).
// Third-party tags stay off /book/* and anything that does see a URL gets it
// scrubbed. Pure. app/layout.tsx inlines the same regex (it runs before React).
export const BOOKING_PATH_RE_SRC = String.raw`^\/book(\/|$)`;
const BOOKING_PATH_RE = new RegExp(BOOKING_PATH_RE_SRC);

export function isBookingPath(pathname: string | null | undefined): boolean {
  return typeof pathname === "string" && BOOKING_PATH_RE.test(pathname);
}

export function scrubBookingUrl(url: string): string {
  let u: URL;
  try { u = new URL(url); } catch { return url; }
  if (!isBookingPath(u.pathname)) return url;
  u.searchParams.delete("t");
  u.pathname = u.pathname.replace(/^\/book\/manage\/[^/]+/, "/book/manage/[token]");
  return u.toString().replace("%5Btoken%5D", "[token]");
}
