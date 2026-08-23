import { useState } from "react";
import { supabase } from "./supabaseClient.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="container" style={{ maxWidth: 380, marginTop: 80 }}>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Chordkuy Admin</h2>
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
      </div>
    </div>
  );
}
