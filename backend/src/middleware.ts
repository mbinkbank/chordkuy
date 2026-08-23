import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/** Route yang dilindungi middleware. */
const PROTECTED = ["/admin", "/api/songs", "/api/dashboard", "/api/export", "/api/import"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = await verifyToken(token);
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/songs/:path*",
    "/api/dashboard/:path*",
    "/api/export/:path*",
    "/api/import/:path*",
  ],
};
