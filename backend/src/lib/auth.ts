import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-ganti-di-produksi-minimal-32-karakter",
);

export const COOKIE_NAME = "ck_token";

export async function createToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string | undefined): Promise<{ email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { email: string };
  } catch {
    return null;
  }
}

/** Cek kredensial terhadap environment variable. */
export function checkCredentials(email: string, password: string): boolean {
  const e = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const p = process.env.ADMIN_PASSWORD || "";
  return e.length > 0 && p.length > 0 && email.trim().toLowerCase() === e && password === p;
}
