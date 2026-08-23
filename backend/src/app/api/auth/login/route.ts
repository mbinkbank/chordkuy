import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createToken, COOKIE_NAME } from "@/lib/auth";
import { bad, ok } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}) as any);
  if (!email || !password) return bad("Email dan password wajib diisi");
  if (!checkCredentials(email, password)) return bad("Kredensial salah", 401);

  const token = await createToken(email);
  const res = ok({ email });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
