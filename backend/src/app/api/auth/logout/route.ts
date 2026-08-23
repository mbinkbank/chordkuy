import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  const res = ok({ loggedOut: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
