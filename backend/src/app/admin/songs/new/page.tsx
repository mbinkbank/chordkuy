"use client";

import SongForm from "@/components/SongForm";

export default function NewSongPage() {
  async function create(payload: Record<string, any>) {
    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.success ? null : json.error || "Gagal menyimpan";
  }

  return (
    <>
      <h2>Tambah Chord</h2>
      <SongForm initial={{}} onSubmit={create} />
    </>
  );
}
