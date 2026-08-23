"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Video,
  ChevronLeft,
  ChevronRight,
  Music,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Song {
  judul: string;
  penyanyi: string;
  base_key: string;
  album: string;
  language: string;
  songtype: string;
  youtube_url: string;
  lastmod: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LANGUAGES = ["Indonesia", "English", "Mandarin", "Lainnya"];
const SONGTYPES = ["Lagu", "Nasiid", "Kidung", "Praise", "Worship"];

export default function SongsPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [songtype, setSongtype] = useState("");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState("lastmod");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [baseKeyFilter, setBaseKeyFilter] = useState("");
  const [ytFilter, setYtFilter] = useState("");

  const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm"];

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search && { search }),
      ...(language && { language }),
      ...(songtype && { songtype }),
      ...(baseKeyFilter && { base_key: baseKeyFilter }),
      ...(ytFilter && { has_youtube: ytFilter }),
      sort_by: sortBy,
      sort_dir: sortDir,
    });
    const res = await fetch(`/api/songs?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setSongs(data.data);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, search, language, songtype, baseKeyFilter, ytFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search, language, songtype, baseKeyFilter, ytFilter, sortBy, sortDir]);

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function SortHeader({ col, children }: { col: string; children: React.ReactNode }) {
    const active = sortBy === col;
    return (
      <th
        className="text-left px-4 py-3 font-medium text-slate-500 cursor-pointer hover:text-purple-500 select-none transition"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active ? (
            sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3 opacity-30" />
          )}
        </span>
      </th>
    );
  }

  async function handleDelete(song: Song) {
    setDeleting(true);
    const res = await api.delete(
      `/api/songs/${encodeURIComponent(song.judul)}/${encodeURIComponent(song.penyanyi)}`
    );
    if (res.success) {
      toast.success("Lagu berhasil dihapus");
      setDeleteConfirm(null);
      fetchSongs();
    } else {
      toast.error(res.message || "Gagal menghapus lagu");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Lagu</h1>
          <p className="text-slate-500 text-sm mt-1">
            Total {pagination.total.toLocaleString("id")} lagu
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSongs}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin/songs/new"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Tambah Lagu
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul, penyanyi, pencipta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="">Semua Bahasa</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <select
              value={songtype}
              onChange={(e) => setSongtype(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            >
              <option value="">Semua Tipe</option>
              {SONGTYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={baseKeyFilter}
                onChange={(e) => setBaseKeyFilter(e.target.value)}
                className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="">Semua Key</option>
                {KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <select
              value={ytFilter}
              onChange={(e) => setYtFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            >
              <option value="">Semua YT</option>
              <option value="yes">Ada YouTube</option>
              <option value="no">Tanpa YouTube</option>
            </select>
          </div>
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
            <Music className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada lagu ditemukan</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? "Coba kata kunci lain" : "Mulai tambah lagu pertama"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <SortHeader col="judul">Judul</SortHeader>
                  <SortHeader col="penyanyi">Penyanyi</SortHeader>
                  <SortHeader col="base_key"><span className="hidden md:inline">Key</span></SortHeader>
                  <SortHeader col="album"><span className="hidden lg:inline">Album</span></SortHeader>
                  <SortHeader col="language"><span className="hidden lg:inline">Bahasa</span></SortHeader>
                  <SortHeader col="youtube_url">YT</SortHeader>
                  <SortHeader col="lastmod">Lastmod</SortHeader>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {songs.map((song, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[180px]">{song.judul}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[120px]">{song.penyanyi}</td>
                    <td className="px-4 py-3">
                      {song.base_key && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-mono">
                          {song.base_key}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[120px]">
                      {song.album || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {song.language && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {song.language}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {song.youtube_url ? (
                        <Video className="w-4 h-4 text-red-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {song.lastmod?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/songs/${encodeURIComponent(song.judul)}/${encodeURIComponent(song.penyanyi)}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                          title="Lihat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/songs/${encodeURIComponent(song.judul)}/${encodeURIComponent(song.penyanyi)}/edit`}
                          className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(song)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {((page - 1) * pagination.limit + 1)} -{" "}
              {Math.min(page * pagination.limit, pagination.total)} dari{" "}
              {pagination.total.toLocaleString("id")} lagu
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                      p === page
                        ? "bg-purple-500 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Lagu?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              Yakin ingin menghapus{" "}
              <span className="font-semibold text-slate-700">"{deleteConfirm.judul}"</span> oleh{" "}
              {deleteConfirm.penyanyi}? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl font-medium transition"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
