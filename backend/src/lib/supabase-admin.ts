import { createClient } from "@supabase/supabase-js";

/**
 * Client server-only dengan service role.
 * Dipakai untuk validasi login & manajemen user via Supabase Auth.
 */
const url = process.env.SUPABASE_URL || "https://tbpdopmbvuhxjktuwsej.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let client: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset di environment");
    if (!client) client = createClient(url, key);
    return (client as any)[prop];
  },
});

/** Validasi email+password dengan mencoba login (untuk verifikasi password lama). */
export async function signInForVerification(email: string, password: string) {
  return supabaseAdmin.auth.signInWithPassword({ email, password });
}
