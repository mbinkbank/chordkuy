"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const CHORD_RE = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d+)?(?:\/[A-G][#b]?)?\b/g;

function Preview({ content }: { content: string }) {
  const html = useMemo(() => {
    const escaped = (content || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(CHORD_RE, (m) => `<b>${m}</b>`);
  }, [content]);
  return <div className="preview" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function SongForm({
  initial,
  onSubmit,
}: {
  initial: Record<string, any>;
  onSubmit: (payload: Record<string, any>) => Promise<string | null>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial.title || "",
    artist: initial.artist || "",
    content: initial.content || "",
    key_name: initial.key_name || "C",
    capo: initial.capo || "",
    tuning: initial.tuning || "E A D G B E",
    difficulty: initial.difficulty || "intermediate",
    language: initial.language || "ID",
    rating: initial.rating ?? 4.8,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onSubmit({ ...form, rating: Number(form.rating) || null });
    setBusy(false);
    if (err) setError(err);
    else router.push("/admin/songs");
  }

  return (
    <div style={{ marginTop: 14 }}>
      <form onSubmit={submit}>
        <div className="grid grid2">
          <div>
            <label>Judul *</label>
            <input value={form.title} onChange={set("title")} required />
          </div>
          <div>
            <label>Artis *</label>
            <input value={form.artist} onChange={set("artist")} required />
          </div>
        </div>
        <div className="grid grid2">
          <div>
            <label>Kunci dasar</label>
            <input value={form.key_name} onChange={set("key_name")} />
          </div>
          <div>
            <label>Capo (mis. "fret 2")</label>
            <input value={form.capo} onChange={set("capo")} />
          </div>
        </div>
        <div className="grid grid2">
          <div>
            <label>Tuning</label>
            <input value={form.tuning} onChange={set("tuning")} />
          </div>
          <div>
            <label>Kesulitan</label>
            <select value={form.difficulty} onChange={set("difficulty")}>
              <option value="novice">Pemula</option>
              <option value="intermediate">Menengah</option>
              <option value="advanced">Mahir</option>
            </select>
          </div>
        </div>
        <div className="grid grid2">
          <div>
            <label>Bahasa (ID / EN)</label>
            <input value={form.language} onChange={set("language")} />
          </div>
          <div>
            <label>Rating (1–5)</label>
            <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={set("rating")} />
          </div>
        </div>
        <label>Isi chord &amp; lirik *</label>
        <textarea value={form.content} onChange={set("content")} required />
        <Preview content={form.content} />
        {error && <p className="error">{error}</p>}
        <div className="row" style={{ marginTop: 14 }}>
          <button disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
          <button type="button" className="secondary" onClick={() => router.push("/admin/songs")}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
