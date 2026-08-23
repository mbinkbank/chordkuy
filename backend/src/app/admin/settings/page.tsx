export default function SettingsPage() {
  return (
    <div style={{ marginTop: 14 }}>
      <h2>Settings</h2>
      <div className="panel">
        <p>
          Kredensial admin dikelola lewat <strong>environment variables</strong>:
        </p>
        <ul style={{ lineHeight: 1.9 }}>
          <li><code>ADMIN_EMAIL</code> — email login</li>
          <li><code>ADMIN_PASSWORD</code> — password login</li>
          <li><code>AUTH_SECRET</code> — kunci signing JWT</li>
          <li><code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code></li>
        </ul>
        <p className="muted" style={{ fontSize: 12 }}>
          Ubah nilai di Vercel (Settings → Environment Variables) lalu redeploy. Tidak ada password yang
          disimpan di database.
        </p>
      </div>
    </div>
  );
}
