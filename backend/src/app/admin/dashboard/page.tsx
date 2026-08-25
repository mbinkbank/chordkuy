"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
  Music,
  Users,
  TrendingUp,
  Clock,
  Plus,
  UploadCloud,
  Video,
  Star,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Stats {
  total_songs: number;
  total_artists: number;
  new_this_month: number;
  with_youtube: number;
  avg_rating: number;
  difficulty: { novice: number; intermediate: number; advanced: number };
  last_updated: { judul: string; penyanyi: string; lastmod: string } | null;
}

interface RecentSong {
  judul: string;
  penyanyi: string;
  album: string;
  base_key: string;
  language: string;
  youtube_url: string;
  lastmod: string;
}

interface LangStat {
  language: string;
  count: number;
}

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentSong[]>([]);
  const [langStats, setLangStats] = useState<LangStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, r, l] = await Promise.all([
        api.get<Stats>("/api/dashboard/stats"),
        api.get<RecentSong[]>("/api/dashboard/recent"),
        api.get<LangStat[]>("/api/dashboard/language-stats"),
      ]);
      if (s.success) setStats(s.data);
      if (r.success) setRecent(r.data);
      if (l.success) setLangStats(l.data);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    {
      label: "Total Lagu",
      value: stats?.total_songs ?? 0,
      icon: <Music className="w-6 h-6" />,
      color: "bg-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Total Artis",
      value: stats?.total_artists ?? 0,
      icon: <Users className="w-6 h-6" />,
      color: "bg-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Lagu Baru Bulan Ini",
      value: stats?.new_this_month ?? 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Terakhir Diupdate",
      value: stats?.last_updated?.lastmod?.slice(0, 10) ?? "-",
      sub: stats?.last_updated ? `${stats.last_updated.judul} — ${stats.last_updated.penyanyi}` : undefined,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-amber-500",
      bg: "bg-amber-50",
    },
  ];

  const diffRows = [
    { key: "novice", label: "Pemula", value: stats?.difficulty?.novice ?? 0 },
    { key: "intermediate", label: "Menengah", value: stats?.difficulty?.intermediate ?? 0 },
    { key: "advanced", label: "Mahir", value: stats?.difficulty?.advanced ?? 0 },
  ];
  const diffTotal = diffRows.reduce((a, b) => a + b.value, 0) || 1;
  const diffColors: Record<string, string> = {
    novice: "bg-emerald-400",
    intermediate: "bg-amber-400",
    advanced: "bg-rose-400",
  };

  const sortedLang = [...langStats].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Selamat datang di ChordKu Admin Panel</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/songs/new"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Tambah Lagu
          </Link>
          <Link
            href="/admin/import-export"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <UploadCloud className="w-4 h-4" /> Import
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <span className={card.color.replace("bg-", "text-")}>{card.icon}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {typeof card.value === "number" ? card.value.toLocaleString("id") : card.value}
              </p>
              {"sub" in card && card.sub && (
                <p className="text-xs text-slate-400 truncate mt-1">{card.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Row: YouTube, Rating, Kesulitan */}
      {loading ? (
        <div className="grid lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* YouTube */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-50 p-2 rounded-lg">
                <Video className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Lagu dengan YouTube
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {(stats?.with_youtube ?? 0).toLocaleString("id")}
                  <span className="text-sm font-normal text-slate-400">
                    {" "}
                    / {(stats?.total_songs ?? 0).toLocaleString("id")}
                  </span>
                </p>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full"
                style={{
                  width: `${stats?.total_songs ? Math.round(((stats.with_youtube ?? 0) / stats.total_songs) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {stats?.total_songs
                ? `${Math.round(((stats.with_youtube ?? 0) / stats.total_songs) * 100)}% lagu punya video`
                : "-"}
            </p>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Rating Rata-rata
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {(stats?.avg_rating ?? 0).toFixed(2)}
                  <span className="text-sm font-normal text-slate-400"> / 5.0</span>
                </p>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${((stats?.avg_rating ?? 0) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Dari lagu yang sudah diberi rating</p>
          </div>

          {/* Kesulitan */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-sky-50 p-2 rounded-lg">
                <Gauge className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tingkat Kesulitan
              </p>
            </div>
            <div className="space-y-2">
              {diffRows.map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">{d.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${diffColors[d.key]}`}
                      style={{ width: `${(d.value / diffTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-12 text-right">
                    {d.value.toLocaleString("id")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Language Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Lagu per Bahasa</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : langStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sortedLang} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="language" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v) => [v, "Lagu"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {sortedLang.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Songs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Lagu Terbaru Diupdate</h3>
            <Link
              href="/admin/songs"
              className="text-xs text-purple-500 hover:underline font-medium"
            >
              Lihat Semua
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Belum ada lagu
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((song, i) => (
                <Link
                  key={i}
                  href={`/admin/songs/${encodeURIComponent(song.judul)}/${encodeURIComponent(song.penyanyi)}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-purple-600 transition">
                      {song.judul}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{song.penyanyi}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {song.youtube_url && (
                      <Video className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="text-xs text-slate-400">
                      {song.lastmod?.slice(0, 10)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
