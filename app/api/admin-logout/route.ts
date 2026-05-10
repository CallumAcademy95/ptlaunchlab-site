import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/app/lib/admin-auth";

// POST /api/admin-logout — clears the admin auth cookie.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
