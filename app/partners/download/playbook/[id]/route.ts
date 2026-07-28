// Download a file attached to an uploaded playbook entry.
//
// Separate from /partners/download/[id] because playbook entries and resources
// are different tables. Same rules: session required, private bucket, 60-second
// signed URL, never a public object.
//
// Playbook entries aren't scoped to a partner — every partner sees the whole
// playbook — so the check here is simply "are you a partner", which is what the
// session establishes.

import { NextRequest, NextResponse } from "next/server";
import { getPartnerSession } from "@/app/lib/partner-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { createSignedResourceUrl } from "@/app/lib/partner-resources";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  }

  const { data } = await getSupabaseAdmin()
    .from("pp_playbook_entries")
    .select("storage_path, external_url")
    .eq("id", id)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (data.external_url) return NextResponse.redirect(data.external_url as string);
  if (!data.storage_path) {
    return NextResponse.json({ error: "Nothing attached to that entry." }, { status: 404 });
  }

  const signed = await createSignedResourceUrl(data.storage_path as string);
  if (!signed) return NextResponse.json({ error: "Could not prepare that download." }, { status: 502 });

  return NextResponse.redirect(signed, { headers: { "Cache-Control": "private, no-store" } });
}
