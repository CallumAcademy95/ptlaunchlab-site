// The partner Resource Drive.
//
// Files live in the PRIVATE `partner-resources` Supabase Storage bucket. A
// partner never receives a storage path or a public URL — downloads go through
// a server route that checks the session, then issues a short-lived signed URL.
// Public objects would mean a link forwarded once is a link that works forever,
// including for a gym whose partnership has ended.

import { getSupabaseAdmin } from "./supabase-admin";

export const RESOURCE_BUCKET = "partner-resources";

/** Long enough to start a download, short enough that a shared link is useless. */
const SIGNED_URL_TTL_SECONDS = 60;

export const RESOURCE_CATEGORIES = [
  { key: "print", label: "Print & in-gym", blurb: "Posters, QR cards and flyers for the floor" },
  { key: "digital", label: "Digital & screens", blurb: "Social posts and gym TV adverts" },
  { key: "branding", label: "Branding", blurb: "Your academy logo pack and colours" },
  { key: "learner", label: "Learner handouts", blurb: "What to give a member who asks" },
  { key: "training", label: "Selling the course", blurb: "How you and your staff talk about it" },
  { key: "legal", label: "Legal", blurb: "Your signed agreement and terms" },
  { key: "delivery", label: "Supporting your learners", blurb: "What the course involves and how to help" },
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]["key"];

export interface PartnerResource {
  id: string;
  partner_id: string | null;
  category: ResourceCategory;
  title: string;
  description: string | null;
  storage_path: string | null;
  external_url: string | null;
  mime: string | null;
  file_size: number | null;
  version: string | null;
  sort_order: number;
  created_at: string;
}

/**
 * Everything this partner can see: shared resources (partner_id null) plus
 * anything uploaded specifically for them.
 */
export async function getPartnerResources(partnerId: string): Promise<PartnerResource[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_resources")
    .select(
      "id, partner_id, category, title, description, storage_path, external_url, mime, file_size, version, sort_order, created_at"
    )
    .or(`partner_id.is.null,partner_id.eq.${partnerId}`)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[partner-resources] list failed:", error);
    return [];
  }
  return (data ?? []) as unknown as PartnerResource[];
}

/**
 * Resolve a resource the given partner is actually entitled to.
 *
 * The entitlement check is here rather than in the route so it cannot be
 * skipped: a resource belongs to this partner, or to everyone, or they don't
 * get it — an id from another gym returns null however it was obtained.
 */
export async function getResourceForPartner(
  resourceId: string,
  partnerId: string
): Promise<PartnerResource | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_resources")
    .select(
      "id, partner_id, category, title, description, storage_path, external_url, mime, file_size, version, sort_order, created_at"
    )
    .eq("id", resourceId)
    .or(`partner_id.is.null,partner_id.eq.${partnerId}`)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PartnerResource;
}

/**
 * A one-minute URL for a private object. Never store or log the result.
 *
 * `download: false` is what makes an image render in an <img> instead of
 * triggering a save dialog — same object, same expiry, only the
 * Content-Disposition differs.
 */
export async function createSignedResourceUrl(
  storagePath: string,
  opts: { download?: boolean } = {}
): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(RESOURCE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS, { download: opts.download ?? true });

  if (error || !data?.signedUrl) {
    console.error("[partner-resources] signing failed:", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Resources belonging to a campaign pack, keyed by the playbook slug they
 * belong to. Scoped to the partner, same rule as everything else — a pack is
 * their own artwork plus anything shared.
 *
 * One query for every pack rather than one per campaign: there are nine
 * campaigns on that page and nine round trips to render it would be silly.
 */
export async function getPackResources(
  partnerId: string
): Promise<Map<string, PartnerResource[]>> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_resources")
    .select(
      "id, partner_id, category, title, description, storage_path, external_url, mime, file_size, version, sort_order, created_at, pack"
    )
    .not("pack", "is", null)
    .or(`partner_id.is.null,partner_id.eq.${partnerId}`)
    .order("sort_order");

  if (error) {
    // Most likely the pack column isn't there yet. A campaign without its
    // artwork is still a usable campaign, so degrade rather than fail.
    console.error("[partner-resources] pack lookup failed:", error.message);
    return new Map();
  }

  const byPack = new Map<string, PartnerResource[]>();
  for (const row of (data ?? []) as unknown as (PartnerResource & { pack: string })[]) {
    byPack.set(row.pack, [...(byPack.get(row.pack) ?? []), row]);
  }
  return byPack;
}

/** Images get a thumbnail. */
export function isPreviewable(mime: string | null): boolean {
  return Boolean(mime?.startsWith("image/"));
}

/** Video plays inline — a screen loop is worth watching before you download 14MB. */
export function isVideo(mime: string | null): boolean {
  return Boolean(mime?.startsWith("video/"));
}

/**
 * A short label for formats that can't be previewed, so a partner knows what
 * they're about to download and what will open it.
 */
export function fileKind(mime: string | null): string | null {
  if (!mime) return null;
  if (mime.includes("presentationml")) return "PowerPoint";
  if (mime.includes("wordprocessingml")) return "Word";
  if (mime === "application/pdf") return "PDF";
  return null;
}

export function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Added in the last fortnight — worth a badge, past that it's just noise. */
export function isNewResource(createdAt: string): boolean {
  return Date.now() - Date.parse(createdAt) < 14 * 86400000;
}
