import { useMemo, useState } from "react";
import { supabase } from "./supabaseClient.js";

const CHORD_RE = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d+)?(?:\/[A-G][#b]?)?\b/g;

/** Preview sederhana: chord dibungkus <b>, sisanya teks apa adanya. */
function Preview({ content }) {
  const html = useMemo(() => {
    const escaped = (content || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(CHORD_RE, (m) => `<b>${m}</b>`);
  }, [content]);
  return <div className="preview panel" style={{ marginTop: 14 }}>{html}</div>;
}

export default function SongForm({ row, onDone }) {
  const isNew = !row.id;
  const [form, setForm] = useState({
    title: row.title || "",
    artist: row.artist || "",
    content: row.content || "",
    key_name: row.key_name || "C",
    capo: row.capo || "",
    tuning: row.tuning || "E A D G B E",
    difficulty: row.difficulty || "intermediate",
    language: row.language || "ID",
    rating: row.rating ?? 4.8,
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = { ...form, rating: Number(form.rating) || null };
    let error;
    if (isNew) ({ error } = await supabase.from("chords").insert(payload));
    else ({ error } = await supabase.from("chords").update(payload).eq("id", row.id));
    setBusy(false);
    if (error) setError(error.message);
    else onDone(isNew ? `Ditambahkan: ${form.title}` : `Tersimpan: ${form.title}`);
  }

  return (
    <div className="panel" style={{ margin: "14px 0" }}>
      <h3 style={{ marginTop: 0 }}>{isNew ? "Tambah Chord" : `Edit: ${row.title}`}</h3>
      <form onSubmit={submit}>
        <div className="grid2">
          <div>
            <label>Judul *</label>
            <input value={form.title} onChange={set("title")} required />
          </div>
          <div>
            <label>Artis *</label>
            <input value={form.artist} onChange={set("artist")} required />
          </div>
        </div>
        <div className="grid2">
          <div>
            <label>Kunci dasar</label>
            <input value={form.key_name} onChange={set("key_name")} />
          </div>
          <div>
            <label>Capo (mis. "fret 2", kosong = tanpa capo)</label>
            <input value={form.capo} onChange={set("capo")} />
          </div>
        </div>
        <div className="grid2">
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
        <div className="grid2">
          <div>
            <label>Bahasa (ID / EN)</label>
            <input value={form.language} onChange={set("language")} />
          </div>
          <div>
            <label>Rating (1–5)</label>
            <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={set("rating")} />
          </div>
        </div>
        <label>Isi chord & lirik</label>
        <textarea value={form.content} onChange={set("content")} />
        <Preview content={form.content} />
        {error && <p className="error">{error}</p>}
        <div className="row" style={{ marginTop: 14 }}>
          <button disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
          <button type="button" className="secondary" onClick={() => onDone(null)}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
