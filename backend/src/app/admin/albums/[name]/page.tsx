"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { ArrowLeft, Music, Video, Edit2 } from "lucide-react";

interface Song {
  judul: string;
  penyanyi: string;
  base_key: string;
  language: string;
  youtube_url: string;
  lastmod: string;
}

interface AlbumDetail {
  album: string;
  album_image: string;
  song_count: number;
  songs: Song[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const [detail, setDetail] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const name = decodeURIComponent(params.name as string);

  useEffect(() => {
    async function load() {
      const res = await api.get<AlbumDetail>(`/api/albums/${encodeURIComponent(name)}`);
      if (res.success) setDetail(res.data);
      setLoading(false);
    }
    load();
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/admin/albums" className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{detail?.album || name}</h1>
          <p className="text-slate-500 text-sm mt-1">{detail?.song_count || 0} lagu</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (detail?.songs || []).length === 0 ? (
          <div className="p-12 text-center">
            <Music className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada lagu dalam album ini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(detail?.songs || []).map((song, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-500 font-mono text-xs flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{song.judul}</p>
                  <p className="text-xs text-slate-400">{song.penyanyi}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {song.base_key && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-mono">
                      {song.base_key}
                    </span>
                  )}
                  {song.youtube_url && <Video className="w-4 h-4 text-red-400" />}
                  <Link
                    href={`/admin/songs/${encodeURIComponent(song.judul)}/${encodeURIComponent(song.penyanyi)}/edit`}
                    className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
