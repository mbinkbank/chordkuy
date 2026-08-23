"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import SongForm, { SongFormData } from "@/components/SongForm";
import { Music } from "lucide-react";

export default function EditSongPage() {
  const params = useParams();
  const [song, setSong] = useState<SongFormData | null>(null);
  const [loading, setLoading] = useState(true);

  const judul = decodeURIComponent(params.judul as string);
  const penyanyi = decodeURIComponent(params.penyanyi as string);

  useEffect(() => {
    async function load() {
      const res = await api.get<SongFormData>(
        `/api/songs/${encodeURIComponent(judul)}/${encodeURIComponent(penyanyi)}`
      );
      if (res.success) setSong(res.data);
      setLoading(false);
    }
    load();
  }, [judul, penyanyi]);

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
      </div>
    );
  }

  return (
    <SongForm
      initialData={song}
      isEdit
      originalJudul={judul}
      originalPenyanyi={penyanyi}
    />
  );
}
