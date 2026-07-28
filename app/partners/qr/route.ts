// Downloadable QR code for the partner's own academy URL.
//
// Lives under /partners/* so the middleware gate covers it, and re-checks the
// session here so the route is safe even if that gate is ever narrowed. The QR
// always encodes the partner resolved from the session — never a URL supplied
// by the caller, which would turn this into an open QR generator on our domain.

import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getPartnerSession, partnerAcademyUrl } from "@/app/lib/partner-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPartnerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const url = partnerAcademyUrl(session.partner);
  if (!url) {
    return NextResponse.json(
      { error: "No academy page is set up for this partner yet." },
      { status: 404 }
    );
  }

  // High error correction so it still scans off a printed poster that has been
  // scuffed, and a wide margin so it survives being placed on a busy background.
  const png = await QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    width: 1200,
    margin: 4,
    color: { dark: "#070D1BFF", light: "#FFFFFFFF" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${session.partner.slug}-academy-qr.png"`,
      // Per-partner and behind auth — must never be held in a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
}
