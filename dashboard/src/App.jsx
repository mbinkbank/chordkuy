import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Login from "./Login.jsx";
import Songs from "./Songs.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="container" style={{ padding: 40 }}>Memuat…</div>;
  if (!session) return <Login />;

  return (
    <>
      <div className="topbar">
        <h1>Chordkuy Admin</h1>
        <div className="row">
          <span className="muted" style={{ fontSize: 12 }}>{session.user.email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>Keluar</button>
        </div>
      </div>
      <div className="container">
        <Songs />
      </div>
    </>
  );
}
