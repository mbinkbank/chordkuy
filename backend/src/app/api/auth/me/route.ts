import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authUser = await requireAuth(request);
  if (!authUser) return errorResponse("Tidak terautentikasi", 401);

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      created_at: users.created_at,
    })
    .from(users)
    .where(eq(users.id, authUser.userId))
    .limit(1);

  if (!user) return errorResponse("User tidak ditemukan", 404);

  return successResponse(user, "Berhasil");
}
