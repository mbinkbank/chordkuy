import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email dan password wajib diisi", 400);
    }

    // Validasi kredensial lewat Supabase Auth (user yang terdaftar di dashboard)
    const { data, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      return errorResponse("Email atau password salah", 401);
    }

    const user = data.user;
    const name = (user.user_metadata?.name as string) || email.split("@")[0];
    const role = (user.user_metadata?.role as string) || "admin";

    const token = await signToken({
      userId: user.id,
      email: user.email || email,
      name,
      role,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return successResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name,
          role,
        },
      },
      "Login berhasil",
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}
