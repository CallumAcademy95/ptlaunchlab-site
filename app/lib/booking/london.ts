// Europe/London wall-clock <-> UTC with Intl only. Pure (no @/ imports) so
// node --test can load it. Business hours never fall in the 01:00-02:00 gap,
// so the nonexistent/ambiguous hour needs no special handling.

const TZ = "Europe/London";
const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

function wallParts(ms: number) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** Minutes London is ahead of UTC at this instant (0 or 60). */
function offsetMinutes(ms: number): number {
  const w = wallParts(ms);
  return Math.round((Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - ms) / 60000);
}

export function londonDate(ms: number): string {
  const w = wallParts(ms);
  return `${w.y}-${String(w.m).padStart(2, "0")}-${String(w.d).padStart(2, "0")}`;
}

export function londonWallToUtc(date: string, hhmm: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let utc = guess - offsetMinutes(guess) * 60000;
  const off2 = offsetMinutes(utc);
  if (guess - off2 * 60000 !== utc) utc = guess - off2 * 60000;
  return utc;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function time12(ms: number): string {
  const w = wallParts(ms);
  const h = w.h % 12 === 0 ? 12 : w.h % 12;
  const ap = w.h < 12 ? "am" : "pm";
  return w.mi === 0 ? `${h}${ap}` : `${h}:${String(w.mi).padStart(2, "0")}${ap}`;
}

/** "Wed 21 Oct, 2:30pm" — the same shape the setter's Calendly slots used. */
export function slotLabel(ms: number): string {
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(ms));
  return `${day.replace(",", "")}, ${time12(ms)}`;
}

/** "2:30pm, Wednesday 21 October" */
export function longLabel(ms: number): string {
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(ms));
  return `${time12(ms)}, ${day.replace(",", "")}`;
}
