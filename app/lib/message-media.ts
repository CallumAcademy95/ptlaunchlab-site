// Attachments on a lead message, for the admin lead page.
//
// lead_messages.media is written by Leads Central (pt-app) — see the data
// contract in docs/superpowers/specs/2026-10-08-setter-images-design.md:
//
//   { type: "image", bucket: "lead-media", path: "<consultation_id>/<uuid>.<ext>",
//     mime, size, source: "whatsapp" | "email", filename | null }
//   { type: "unsupported", mime, size | null, source, filename | null, error? }
//
// The bucket is private. The page signs short-lived URLs with the service role,
// and only for paths this module accepts: the right bucket, the contract's path
// shape, and a first segment equal to the consultation being viewed. A row that
// points anywhere else is shown as "Image unavailable", never signed.
//
// Pure and dependency-free so it runs under `node --test` as well as in the page.

export const LEAD_MEDIA_BUCKET = "lead-media";

const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif)$/i;

export interface ImageEntry {
  type: "image";
  bucket: string;
  path: string;
  mime: string | null;
  filename: string | null;
}

export interface UnsupportedEntry {
  type: "unsupported";
  mime: string | null;
  filename: string | null;
  error: string | null;
}

export type MediaEntry = ImageEntry | UnsupportedEntry;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

/**
 * Read the jsonb column defensively. Anything that isn't an array of objects
 * with a known `type` is dropped; an image entry missing its bucket or path is
 * kept (as an image the page can't sign) so it still shows as "unavailable"
 * rather than vanishing.
 */
export function parseMedia(raw: unknown): MediaEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaEntry[] = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    if (o.type === "image") {
      out.push({
        type: "image",
        bucket: str(o.bucket) ?? "",
        path: str(o.path) ?? "",
        mime: str(o.mime),
        filename: str(o.filename),
      });
    } else if (o.type === "unsupported") {
      out.push({ type: "unsupported", mime: str(o.mime), filename: str(o.filename), error: str(o.error) });
    }
  }
  return out;
}

/** True only for a path this page may sign: right bucket, contract shape, this consultation. */
export function isSignablePath(bucket: unknown, path: unknown, consultationId: string): boolean {
  if (bucket !== LEAD_MEDIA_BUCKET) return false;
  if (typeof path !== "string" || !PATH_RE.test(path)) return false;
  const first = path.split("/")[0];
  return first.toLowerCase() === consultationId.toLowerCase();
}

/** A human name for a MIME type: "PDF", "Word document", "video", … */
export function fileTypeLabel(mime: string | null | undefined): string {
  const m = (mime ?? "").toLowerCase().split(";")[0].trim();
  if (!m) return "file";
  if (m === "application/pdf") return "PDF";
  if (m === "application/msword" || m.includes("wordprocessingml")) return "Word document";
  if (m === "application/vnd.ms-excel" || m.includes("spreadsheetml") || m === "text/csv") return "spreadsheet";
  if (m === "application/vnd.ms-powerpoint" || m.includes("presentationml")) return "presentation";
  if (m === "application/zip" || m === "application/x-zip-compressed") return "zip file";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("text/")) return "text file";
  return "file";
}

/** The words on an unsupported-attachment chip, without the paperclip. */
export function unsupportedChipLabel(e: Pick<UnsupportedEntry, "mime" | "filename" | "error">): string {
  const name = e.filename?.trim() || fileTypeLabel(e.mime);
  const err = (e.error ?? "").trim().toLowerCase();
  const why = err === "pending" ? "image still loading" : err === "too large" ? "too large to keep" : "can't be previewed";
  return `${name} — ${why}`;
}

/** Every path on the page that may be signed, de-duplicated, in order. */
export function signablePaths(entries: MediaEntry[], consultationId: string): string[] {
  const seen = new Set<string>();
  for (const e of entries) {
    if (e.type === "image" && isSignablePath(e.bucket, e.path, consultationId)) seen.add(e.path);
  }
  return [...seen];
}

export type MediaView =
  | { kind: "image"; url: string; alt: string }
  | { kind: "unavailable"; label: string }
  | { kind: "chip"; label: string };

/**
 * What to draw for one message's attachments, given the signed URLs the page
 * managed to get (path → url). Missing from the map means unsigned: shown as a
 * neutral placeholder, never a broken image.
 */
export function mediaViews(
  entries: MediaEntry[],
  signed: ReadonlyMap<string, string>,
  consultationId: string,
): MediaView[] {
  return entries.map((e): MediaView => {
    if (e.type === "unsupported") return { kind: "chip", label: unsupportedChipLabel(e) };
    const url = isSignablePath(e.bucket, e.path, consultationId) ? signed.get(e.path) : undefined;
    if (!url || !/^https?:\/\//i.test(url)) return { kind: "unavailable", label: "Image unavailable" };
    return { kind: "image", url, alt: e.filename ? `Attached image: ${e.filename}` : "Attached image" };
  });
}
