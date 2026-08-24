import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const NEW_PASSWORD = process.argv[2] || "Risna@19972003";

const { data, error } = await sb.auth.admin.listUsers();
if (error) throw error;
const user = data.users.find((u) => u.email === "admin@chordkuy.id");
if (!user) {
  console.log("User tidak ditemukan");
  process.exit(1);
}

const { error: updErr } = await sb.auth.admin.updateUserById(user.id, {
  password: NEW_PASSWORD,
});
if (updErr) throw updErr;
console.log("✅ Password untuk", user.email, "direset menjadi:", NEW_PASSWORD);
