"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SongForm from "@/components/SongForm";

export default function EditSongPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/songs/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRow(json.data);
        else setError(json.error || "Tidak ditemukan");
      });
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!row) return <p className="muted">Memuat…</p>;

  async function update(payload: Record<string, any>) {
    const res = await fetch(`/api/songs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.success ? null : json.error || "Gagal menyimpan";
  }

  return (
    <>
      <h2>Edit: {row.title}</h2>
      <SongForm initial={row} onSubmit={update} />
    </>
  );
}
