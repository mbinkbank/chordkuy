"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PER_PAGE = 20;

export default function SongsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/songs?page=${page}&perPage=${PER_PAGE}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
    );
    const json = await res.json();
    if (json.success) {
      setRows(json.data.items || []);
      setTotal(json.data.total || 0);
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function hapus(r: any) {
    if (!confirm(`Hapus "${r.title}" — ${r.artist}?`)) return;
    await fetch(`/api/songs/${r.id}`, { method: "DELETE" });
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div style={{ marginTop: 14 }}>
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
        <button onClick={() => router.push("/admin/songs/new")}>+ Tambah Chord</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr><th>Judul</th><th>Artis</th><th>Key</th><th>Capo</th><th>Rating</th><th></th></tr>
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
                  <td>{r.rating != null ? Number(r.rating).toFixed(1) : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="secondary" onClick={() => router.push(`/admin/songs/${r.id}`)}>Edit</button>{" "}
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
    </div>
  );
}
