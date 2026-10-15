// A single-event .ics for "Add to my calendar". Pure.
const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function icsFor(b: { id: string; startMs: number; endMs: number; title: string; description: string }): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PT Launch Lab//Booking//EN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@ptlaunchlab.co.uk`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(b.startMs)}`,
    `DTEND:${stamp(b.endMs)}`,
    `SUMMARY:${esc(b.title)}`,
    `DESCRIPTION:${esc(b.description)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
