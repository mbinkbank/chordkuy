import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signInForVerification } from "@/lib/supabase-admin";

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

  // Verifikasi password lama dengan mencoba login
  const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
    email: authUser.email,
    password: current_password,
  });
  if (verifyError) return errorResponse("Password lama salah", 401);

  // Update password di Supabase Auth
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    authUser.userId,
    { password: new_password }
  );
  if (updateError) return errorResponse(updateError.message, 500);

  return successResponse(null, "Password berhasil diubah");
}
