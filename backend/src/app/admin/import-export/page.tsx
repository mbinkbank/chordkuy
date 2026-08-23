"use client";

import { useState } from "react";

export default function ImportExportPage() {
  const [type, setType] = useState<"json" | "csv">("json");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doImport() {
    setMsg(null);
    setError(null);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data: type === "json" ? safeJson(text) : text }),
    });
    const json = await res.json();
    if (!json.success) return setError(json.error || "Import gagal");
    const d = json.data;
    setMsg(`Berhasil: ${d.inserted} ditambahkan, ${d.failed} gagal. ${d.errors?.join("; ") || ""}`);
  }

  function safeJson(s: string) {
    try {
      return JSON.parse(s);
    } catch {
      return [];
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <h2>Export</h2>
      <div className="row">
        <a className="btn secondary" style={{ padding: "8px 14px" }} href="/api/export?type=json">
          Export JSON
        </a>
        <a className="btn secondary" style={{ padding: "8px 14px" }} href="/api/export?type=csv">
          Export CSV
        </a>
      </div>

      <h2 style={{ marginTop: 28 }}>Import</h2>
      <div className="row">
        <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ maxWidth: 140 }}>
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>
      <label>Paste data di sini</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={type === "json" ? '[{"title":"…","artist":"…","content":"…"}]' : "title,artist,content,…"} />
      {msg && <p className="panel" style={{ color: "var(--accent)" }}>{msg}</p>}
      {error && <p className="error">{error}</p>}
      <button style={{ marginTop: 10 }} onClick={doImport} disabled={!text}>
        Import
      </button>
    </div>
  );
}
