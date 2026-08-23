"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { ArrowLeft, Edit2, Trash2, Music, Video, Disc3, Key, Calendar, Globe, Tag, User } from "lucide-react";
import toast from "react-hot-toast";

interface Song {
  judul: string;
  penyanyi: string;
  base_key: string;
  album: string;
  album_image: string;
  language: string;
  songtype: string;
  songwriter: string;
  year: string;
  youtube_url: string;
  isi_chord: string;
  lastmod: string;
}

function getYouTubeEmbedId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const judul = decodeURIComponent(params.judul as string);
  const penyanyi = decodeURIComponent(params.penyanyi as string);

  useEffect(() => {
    async function load() {
      const res = await api.get<Song>(
        `/api/songs/${encodeURIComponent(judul)}/${encodeURIComponent(penyanyi)}`
      );
      if (res.success) setSong(res.data);
      setLoading(false);
    }
    load();
  }, [judul, penyanyi]);

  async function handleDelete() {
    setDeleting(true);
    const res = await api.delete(
      `/api/songs/${encodeURIComponent(judul)}/${encodeURIComponent(penyanyi)}`
    );
    if (res.success) {
      toast.success("Lagu berhasil dihapus");
      router.push("/admin/songs");
    } else {
      toast.error(res.message || "Gagal menghapus");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="text-center py-16">
        <Music className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Lagu tidak ditemukan</h3>
        <Link href="/admin/songs" className="text-purple-500 text-sm mt-2 inline-block hover:underline">
          Kembali ke daftar lagu
        </Link>
      </div>
    );
  }

  const ytId = getYouTubeEmbedId(song.youtube_url);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/songs" className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 truncate">{song.judul}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{song.penyanyi}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/songs/${encodeURIComponent(judul)}/${encodeURIComponent(penyanyi)}/edit`}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Trash2 className="w-4 h-4" /> Hapus
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Song Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Details */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4">Informasi Lagu</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Key className="w-4 h-4" />, label: "Base Key", value: song.base_key },
                { icon: <Globe className="w-4 h-4" />, label: "Bahasa", value: song.language },
                { icon: <Tag className="w-4 h-4" />, label: "Tipe", value: song.songtype },
                { icon: <User className="w-4 h-4" />, label: "Pencipta", value: song.songwriter },
                { icon: <Calendar className="w-4 h-4" />, label: "Tahun", value: song.year },
                { icon: <Disc3 className="w-4 h-4" />, label: "Album", value: song.album },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-700">{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chord */}
          {song.isi_chord && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Isi Chord</h3>
              <pre className="font-mono text-sm text-slate-800 whitespace-pre-wrap bg-white border border-slate-200 p-4 rounded-xl overflow-auto max-h-[600px]">
                {song.isi_chord}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Album Image */}
          {song.album_image && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={song.album_image} alt={song.album} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="text-xs text-slate-400">Album</p>
                <p className="text-sm font-semibold text-slate-700">{song.album}</p>
              </div>
            </div>
          )}

          {/* YouTube */}
          {ytId ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                className="w-full h-48"
                allowFullScreen
                title={song.judul}
              />
              <div className="p-3 flex items-center gap-2 text-xs text-slate-400">
                <Video className="w-3.5 h-3.5 text-red-400" />
                Video tersedia
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
              <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Belum ada video YouTube</p>
              <Link
                href={`/admin/songs/${encodeURIComponent(judul)}/${encodeURIComponent(penyanyi)}/edit`}
                className="text-xs text-purple-500 hover:underline mt-1 inline-block"
              >
                Tambah URL
              </Link>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">Terakhir diperbarui</p>
            <p className="text-sm text-slate-700 font-medium">{song.lastmod || "—"}</p>
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Lagu?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              Yakin ingin menghapus <span className="font-semibold">"{song.judul}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl font-medium transition">
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
