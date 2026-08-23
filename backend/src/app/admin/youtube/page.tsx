"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import { Video, CheckCircle, XCircle, Save, RefreshCw, Search, Upload, Eye, EyeOff } from "lucide-react";

interface YtStats {
  with_youtube: number;
  without_youtube: number;
  without_list: Array<{ judul: string; penyanyi: string; album: string; language: string }>;
}

interface Song {
  judul: string;
  penyanyi: string;
  album: string;
  language: string;
  youtube_url: string;
  lastmod: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function YoutubePage() {
  const [stats, setStats] = useState<YtStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  async function loadStats() {
    const res = await api.get<YtStats>("/api/youtube/stats");
    if (res.success) setStats(res.data);
  }

  const loadSongs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search && { search }),
      ...(filter === "with" && { has_youtube: "yes" }),
      ...(filter === "without" && { has_youtube: "no" }),
    });
    const res = await fetch(`/api/songs?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setSongs(data.data as Song[]);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, search, filter]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadSongs(); }, [loadSongs]);
  useEffect(() => { setPage(1); }, [search, filter]);

  function songKey(s: Song) { return `${s.judul}|${s.penyanyi}`; }

  function getYtId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  async function saveSingleYt(song: Song) {
    const key = songKey(song);
    const url = editUrls[key] ?? song.youtube_url;
    setSavingKey(key);
    const res = await api.put(
      `/api/songs/${encodeURIComponent(song.judul)}/${encodeURIComponent(song.penyanyi)}/youtube`,
      { youtube_url: url }
    );
    if (res.success) {
      toast.success("YouTube URL diperbarui");
      loadSongs();
      loadStats();
      setEditUrls((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } else {
      toast.error(res.message || "Gagal memperbarui");
    }
    setSavingKey(null);
  }

  async function handleBulkUpdate() {
    if (!bulkCsv.trim()) { toast.error("CSV kosong"); return; }
    setBulkLoading(true);
    try {
      const lines = bulkCsv.split("\n").filter(Boolean);
      const items = lines.map((line) => {
        const [judul, penyanyi, youtube_url] = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        return { judul, penyanyi, youtube_url };
      }).filter((i) => i.judul && i.penyanyi);

      const res = await api.post<{ updated: number; notFound: number }>("/api/youtube/bulk", { items });
      if (res.success) {
        toast.success(`${res.data.updated} URL berhasil diperbarui`);
        setBulkCsv("");
        setShowBulk(false);
        loadSongs();
        loadStats();
      } else {
        toast.error(res.message || "Gagal bulk update");
      }
    } catch {
      toast.error("Format CSV tidak valid");
    }
    setBulkLoading(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">YouTube Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola URL YouTube untuk setiap lagu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { loadSongs(); loadStats(); }}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" /> Bulk Update
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{stats.with_youtube.toLocaleString("id")}</p>
              <p className="text-sm text-emerald-600">Sudah ada YouTube</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.without_youtube.toLocaleString("id")}</p>
              <p className="text-sm text-amber-600">Belum ada YouTube</p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Panel */}
      {showBulk && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Bulk Update YouTube URL</h3>
          <p className="text-sm text-slate-500 mb-3">
            Format CSV: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">judul,penyanyi,youtube_url</code> (satu per baris)
          </p>
          <textarea
            value={bulkCsv}
            onChange={(e) => setBulkCsv(e.target.value)}
            placeholder={"Amazing Grace,Chris Tomlin,https://youtube.com/watch?v=xxx\nHoly Holy,Hillsong,https://youtu.be/yyy"}
            className="w-full h-40 font-mono text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-slate-50"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowBulk(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
              Batal
            </button>
            <button onClick={handleBulkUpdate} disabled={bulkLoading} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition">
              {bulkLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {bulkLoading ? "Memproses..." : "Update"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari lagu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(["all", "with", "without"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filter === f ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f === "all" ? "Semua" : f === "with" ? "Ada YT" : "Tanpa YT"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada lagu ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Lagu</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Album</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500 w-10">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">YouTube URL</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {songs.map((song, i) => {
                  const key = songKey(song);
                  const currentUrl = editUrls[key] ?? song.youtube_url;
                  const ytId = getYtId(currentUrl);
                  const isDirty = editUrls[key] !== undefined;

                  return (
                    <>
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 truncate max-w-[160px]">{song.judul}</p>
                          <p className="text-xs text-slate-400">{song.penyanyi}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400 truncate max-w-[100px]">
                          {song.album || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {song.youtube_url ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-amber-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="url"
                            value={currentUrl}
                            onChange={(e) => setEditUrls({ ...editUrls, [key]: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {ytId && (
                              <button
                                onClick={() => setPreviewKey(previewKey === key ? null : key)}
                                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                                title="Preview"
                              >
                                {previewKey === key ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {isDirty && (
                              <button
                                onClick={() => saveSingleYt(song)}
                                disabled={savingKey === key}
                                className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"
                                title="Simpan"
                              >
                                {savingKey === key ? (
                                  <span className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {previewKey === key && ytId && (
                        <tr key={`${i}-preview`} className="bg-slate-900">
                          <td colSpan={5} className="p-4">
                            <div className="max-w-xl mx-auto">
                              <iframe
                                src={`https://www.youtube.com/embed/${ytId}`}
                                className="w-full h-56 rounded-xl"
                                allowFullScreen
                                title="Preview"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {pagination.total.toLocaleString("id")} lagu
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-50 transition">
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-slate-500">
                {page} / {pagination.totalPages}
              </span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
