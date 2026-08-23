"use client";

import { useEffect, useState } from "react";

type Stats = {
  songCount: number;
  artistCount: number;
  avgRating: number | null;
  languageStats: { name: string; count: number }[];
  topRated: { id: number; title: string; artist: string; rating: number | null }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([
        fetch("/api/dashboard/stats").then((x) => x.json()),
        fetch("/api/dashboard/recent").then((x) => x.json()),
      ]);
      if (s.success) setStats(s.data);
      else setError(s.error);
      if (r.success) setRecent(r.data.items || []);
    })();
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Memuat statistik…</p>;

  return (
    <div className="grid" style={{ marginTop: 14 }}>
      <div className="grid grid3">
        <div className="stat-card">
          <div className="stat-value">{stats.songCount}</div>
          <div className="stat-label">Total chord</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.artistCount}</div>
          <div className="stat-label">Total artis</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgRating ?? "—"}</div>
          <div className="stat-label">Rating rata-rata</div>
        </div>
      </div>

      <div className="grid grid2">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Bahasa</h3>
          {stats.languageStats.map((l) => (
            <p key={l.name}>
              {l.name}: <strong>{l.count}</strong> chord
            </p>
          ))}
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Rating tertinggi</h3>
          {(stats.topRated || []).map((t) => (
            <p key={t.id} style={{ margin: "6px 0" }}>
              ★ {Number(t.rating ?? 0).toFixed(1)} — {t.title}{" "}
              <span className="muted">({t.artist})</span>
            </p>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Chord terbaru</h3>
        <table>
          <thead>
            <tr><th>Judul</th><th>Artis</th><th>Key</th></tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td className="muted">{r.artist}</td>
                <td>{r.key_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
