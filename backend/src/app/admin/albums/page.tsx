"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import { Disc3, Music, Edit2, Trash2, ExternalLink, RefreshCw, X, Save } from "lucide-react";

interface Album {
  album: string;
  album_image: string;
  artists: string[];
  song_count: number;
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [editForm, setEditForm] = useState({ new_name: "", album_image: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Album | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get<Album[]>("/api/albums");
    if (res.success) setAlbums(res.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(album: Album) {
    setEditAlbum(album);
    setEditForm({ new_name: album.album, album_image: album.album_image });
  }

  async function handleSaveEdit() {
    if (!editAlbum) return;
    setSaving(true);
    const res = await api.put(`/api/albums/${encodeURIComponent(editAlbum.album)}`, editForm);
    if (res.success) {
      toast.success("Album berhasil diperbarui");
      setEditAlbum(null);
      load();
    } else {
      toast.error(res.message || "Gagal memperbarui album");
    }
    setSaving(false);
  }

  async function handleDelete(album: Album) {
    setDeleting(true);
    const res = await api.delete(`/api/albums/${encodeURIComponent(album.album)}`);
    if (res.success) {
      toast.success("Album berhasil dihapus");
      setDeleteConfirm(null);
      load();
    } else {
      toast.error(res.message || "Gagal menghapus album");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Album</h1>
          <p className="text-slate-500 text-sm mt-1">{albums.length} album ditemukan</p>
        </div>
        <button onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <Disc3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada album</p>
          <p className="text-slate-400 text-sm mt-1">Tambahkan album dari halaman lagu</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {albums.map((album, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition">
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200">
                {album.album_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.album_image}
                    alt={album.album}
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(album)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/admin/albums/${encodeURIComponent(album.album)}`}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(album)}
                    className="p-2 bg-red-500/70 hover:bg-red-500 rounded-lg text-white transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">{album.album}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {album.artists.slice(0, 2).join(", ")}
                  {album.artists.length > 2 && ` +${album.artists.length - 2}`}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <Music className="w-3.5 h-3.5" />
                  <span>{album.song_count} lagu</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Edit Album</h3>
              <button onClick={() => setEditAlbum(null)} className="p-1 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Nama Album</label>
                <input
                  type="text"
                  value={editForm.new_name}
                  onChange={(e) => setEditForm({ ...editForm, new_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">URL Gambar Album</label>
                <input
                  type="url"
                  value={editForm.album_image}
                  onChange={(e) => setEditForm({ ...editForm, album_image: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              {editForm.album_image && (
                <div className="rounded-xl overflow-hidden h-32 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editForm.album_image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditAlbum(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition">
                Batal
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white rounded-xl font-medium transition">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Album?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              Album <span className="font-semibold">"{deleteConfirm.album}"</span> akan dihapus dan {deleteConfirm.song_count} lagu akan dikosongkan albumnya.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl font-medium transition">
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
