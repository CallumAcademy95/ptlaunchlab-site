// Download a resource.
//
// Under /partners/* so the middleware gate covers it, and re-checks the session
// here so it stays safe if that gate is ever narrowed. The partner never sees a
// storage path or a public URL — this issues a 60-second signed URL and
// redirects to it, so a link copied out of the address bar is dead within the
// minute.

import { NextRequest, NextResponse } from "next/server";
import { getPartnerSession } from "@/app/lib/partner-auth";
import { getResourceForPartner, createSignedResourceUrl } from "@/app/lib/partner-resources";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  // Entitlement is enforced by the lookup: a resource belonging to another gym
  // simply doesn't resolve, so there is no separate check to forget.
  const resource = await getResourceForPartner(id, session.partner.id);
  if (!resource) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // External resources (Drive, Canva, YouTube) are links we don't host.
  if (resource.external_url) {
    return NextResponse.redirect(resource.external_url);
  }
  if (!resource.storage_path) {
    return NextResponse.json({ error: "That resource has no file attached." }, { status: 404 });
  }

  const signed = await createSignedResourceUrl(resource.storage_path);
  if (!signed) {
    return NextResponse.json({ error: "Could not prepare that download." }, { status: 502 });
  }

  return NextResponse.redirect(signed, {
    // The redirect itself must never be cached — the URL behind it expires.
    headers: { "Cache-Control": "private, no-store" },
  });
}
