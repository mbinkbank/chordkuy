import { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { bad, ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await verifyToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) return bad("Unauthorized", 401);
  return ok({ email: user.email });
}
