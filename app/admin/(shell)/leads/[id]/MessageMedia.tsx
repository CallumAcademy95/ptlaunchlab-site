import type { MediaView } from "@/app/lib/message-media";

// Attachments under one message: thumbnails for images the page could sign,
// a neutral placeholder for ones it couldn't, and a chip for files the setter
// can't open. Server component — the signed URLs are made on the server and
// expire after ten minutes; nothing here touches storage.

export function MessageMedia({ views }: { views: MediaView[] }) {
  if (views.length === 0) return null;
  return (
    <ul className="mt-2 flex min-w-0 flex-wrap gap-2" aria-label="Attachments">
      {views.map((v, i) => (
        <li key={i} className="min-w-0 max-w-full">
          {v.kind === "image" ? (
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-400"
              title="Open full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not optimisable */}
              <img
                src={v.url}
                alt={v.alt}
                loading="lazy"
                className="block h-40 w-40 max-w-full object-cover"
              />
            </a>
          ) : v.kind === "unavailable" ? (
            <div className="flex h-40 w-40 max-w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-xs text-slate-500">
              {v.label}
            </div>
          ) : (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 [overflow-wrap:anywhere]">
              <span aria-hidden="true">📎</span>
              <span className="min-w-0">{v.label}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
