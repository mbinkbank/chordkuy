import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import SongForm from "./SongForm.jsx";

const PER_PAGE = 20;
const COLS = "id,title,artist,key_name,capo,tuning,difficulty,rating,language";

export default function Songs() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (baru) | row
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PER_PAGE;
    let q = supabase
      .from("chords")
      .select(COLS, { count: "exact" })
      .order("id", { ascending: false })
      .range(from, from + PER_PAGE - 1);
    if (query) q = q.or(`title.ilike.%${query}%,artist.ilike.%${query}%`);
    const { data, count, error } = await q;
    if (!error) {
      setRows(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => {
    if (!editing) load();
  }, [load, editing]);

  async function hapus(row) {
    if (!confirm(`Hapus "${row.title}" — ${row.artist}?`)) return;
    const { error } = await supabase.from("chords").delete().eq("id", row.id);
    setNotice(error ? `Gagal: ${error.message}` : `Terhapus: ${row.title}`);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (editing !== null) {
    return <SongForm row={editing} onDone={(msg) => { setEditing(null); setNotice(msg); }} />;
  }

  return (
    <>
      {notice && (
        <p className="panel" style={{ color: "var(--accent)" }}>
          {notice}
        </p>
      )}
      <div className="row" style={{ margin: "14px 0" }}>
        <input
          style={{ maxWidth: 280 }}
          placeholder="Cari judul atau artis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setQuery(search), setPage(1))}
        />
        <button className="secondary" onClick={() => (setQuery(search), setPage(1))}>Cari</button>
        <span style={{ flex: 1 }} />
        <button onClick={() => setEditing({})}>+ Tambah Chord</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Judul</th>
              <th>Artis</th>
              <th>Key</th>
              <th>Capo</th>
              <th>Rating</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="muted">Memuat…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="muted">Tidak ada data.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td className="muted">{r.artist}</td>
                  <td>{r.key_name}</td>
                  <td>{r.capo}</td>
                  <td>{r.rating != null ? r.rating.toFixed(1) : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="secondary" onClick={() => setEditing(r)}>Edit</button>{" "}
                    <button className="danger" onClick={() => hapus(r)}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pager">
            <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span className="badge">Halaman {page} / {totalPages} · {total} lagu</span>
            <button className="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        )}
      </div>
    </>
  );
}
