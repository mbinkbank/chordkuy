import { NextRequest } from "next/server";
import { verifyToken, getTokenFromHeader, JWTPayload } from "./auth";

export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload | null> {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = getTokenFromHeader(authHeader);

  // Fallback to cookie
  if (!token) {
    token = request.cookies.get("auth_token")?.value || null;
  }

  if (!token) return null;
  return verifyToken(token);
}
