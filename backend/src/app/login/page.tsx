"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error || "Login gagal");
    router.push(params.get("next") || "/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>Password</label>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button style={{ width: "100%", marginTop: 14 }} disabled={busy}>
        {busy ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 380, marginTop: 90 }}>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Chordkuy Admin</h2>
        <Suspense fallback={<p className="muted">Memuat…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
