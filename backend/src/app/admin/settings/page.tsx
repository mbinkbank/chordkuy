"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import { User, Lock, Save, Shield } from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameForm, setNameForm] = useState({ name: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await api.get<UserInfo>("/api/auth/me");
      if (res.success) {
        setUser(res.data);
        setNameForm({ name: res.data.name });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error("Semua field password wajib diisi");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Password baru tidak cocok");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    setSavingPassword(true);
    const res = await api.post("/api/auth/change-password", {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
    if (res.success) {
      toast.success("Password berhasil diubah");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } else {
      toast.error(res.message || "Gagal mengubah password");
    }
    setSavingPassword(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola akun dan preferensi Anda</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-slate-800">Profil Akun</h3>
        </div>
        {user && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {user.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600 font-medium capitalize">{user.role}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-1">User ID</p>
                <p className="text-slate-600 font-mono text-xs truncate">{user.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Bergabung</p>
                <p className="text-slate-600 text-xs">
                  {new Date(user.created_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-slate-800">Ubah Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password Saat Ini</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password Baru</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="input"
              placeholder="Min 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="input"
              placeholder="Ulangi password baru"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition"
          >
            {savingPassword ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savingPassword ? "Menyimpan..." : "Ubah Password"}
          </button>
        </form>
      </div>

      {/* API Info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Informasi API</h3>
        <div className="space-y-2">
          {[
            { method: "POST", path: "/api/auth/login" },
            { method: "GET", path: "/api/songs" },
            { method: "GET", path: "/api/songs/:judul/:penyanyi" },
            { method: "POST", path: "/api/songs" },
            { method: "PUT", path: "/api/songs/:judul/:penyanyi" },
            { method: "DELETE", path: "/api/songs/:judul/:penyanyi" },
            { method: "POST", path: "/api/songs/bulk" },
            { method: "GET", path: "/api/albums" },
            { method: "GET", path: "/api/dashboard/stats" },
            { method: "GET", path: "/api/export/json" },
            { method: "GET", path: "/api/export/csv" },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                ep.method === "GET" ? "bg-emerald-100 text-emerald-700" :
                ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                ep.method === "PUT" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {ep.method}
              </span>
              <code className="text-xs text-slate-600 font-mono">{ep.path}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
