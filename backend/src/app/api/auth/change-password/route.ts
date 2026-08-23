import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authUser = await requireAuth(request);
  if (!authUser) return errorResponse("Tidak terautentikasi", 401);

  const body = await request.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return errorResponse("Password lama dan baru wajib diisi", 400);
  }

  if (new_password.length < 6) {
    return errorResponse("Password baru minimal 6 karakter", 400);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.userId))
    .limit(1);

  if (!user) return errorResponse("User tidak ditemukan", 404);

  const valid = await comparePassword(current_password, user.password_hash);
  if (!valid) return errorResponse("Password lama salah", 401);

  const newHash = await hashPassword(new_password);
  await db
    .update(users)
    .set({ password_hash: newHash })
    .where(eq(users.id, authUser.userId));

  return successResponse(null, "Password berhasil diubah");
}
