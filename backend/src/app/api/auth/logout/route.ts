import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { cookies } from "next/headers";

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return successResponse(null, "Logout berhasil");
}
