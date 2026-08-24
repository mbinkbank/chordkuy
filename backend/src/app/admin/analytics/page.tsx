"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Eye, Users, UserPlus, Clock, Activity,
  Globe, Link2, FileText, TrendingUp,
} from "lucide-react";

type Summary = {
  totalPageViews: number;
  totalVisitors: number;
  today: { pageViews: number; visitors: number; firstTime: number };
  usersOnline: number;
  avgDuration: string;
  pagesPerVisit: number;
  referrers: { label: string; c: number }[];
  countries: { label: string; c: number }[];
  topUrls: { label: string; c: number }[];
  topTitles: { label: string; c: number }[];
  daily: { d: string; pv: number; uv: number }[];
};

function StatCard({ icon, label, value, accent, sub }: {
  icon: React.ReactNode; label: string; value: string | number; accent: string; sub?: string;
}) {
  return (
    <div className="panel" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 16px", borderLeft: `3px solid ${accent}` }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, display: "grid", placeItems: "center",
        background: `${accent}18`, color: accent, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function TableCard({ title, icon, rows, emptyText }: {
  title: string; icon: React.ReactNode; rows: { label: string; c: number }[]; emptyText: string;
}) {
  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="muted" style={{ padding: "20px 16px", fontSize: 13 }}>{emptyText}</p>
      ) : (
        <table>
          <thead>
            <tr><th style={{ width: "75%" }}>{title.includes("URL") ? "URL" : title.includes("Title") ? "Judul" : title.includes("Perujuk") ? "Sumber" : "Negara"}</th><th style={{ textAlign: "right" }}>Views</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.label}>{r.label || "(langsung)"}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else setError(j.message || "Gagal memuat");
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Memuat statistik…</p>;

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>Statistik Pengunjung</h2>
        <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>Data real-time dari tracking internal — selaras dengan Histats</p>
      </div>

      <div className="grid grid3" style={{ gap: 12 }}>
        <StatCard icon={<Eye size={18} />} label="Page views hari ini" value={data.today.pageViews} accent="#4ade80" />
        <StatCard icon={<Users size={18} />} label="Pengunjung hari ini" value={data.today.visitors} accent="#60a5fa" />
        <StatCard icon={<UserPlus size={18} />} label="First time hari ini" value={data.today.firstTime} accent="#a78bfa" />
        <StatCard
          icon={<span style={{ width: 10, height: 10, borderRadius: 999, background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 6px #22c55e22" }} />}
          label="Users online"
          value={data.usersOnline}
          accent="#22c55e"
          sub="5 menit terakhir"
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon={<Clock size={18} />} label="Waktu rata-rata" value={data.avgDuration} accent="#f59e0b" />
        <StatCard icon={<Activity size={18} />} label="Halaman / kunjungan" value={data.pagesPerVisit} accent="#f472b6" />
        <StatCard icon={<TrendingUp size={18} />} label="Total page views" value={data.totalPageViews} accent="#38bdf8" />
        <StatCard icon={<Users size={18} />} label="Total pengunjung" value={data.totalVisitors} accent="#94a3b8" />
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={16} /> 30 hari terakhir</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily}>
              <defs>
                <linearGradient id="g-pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-uv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a33" />
              <XAxis dataKey="d" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a22", border: "1px solid #2a2a33", borderRadius: 8 }} />
              <Area type="monotone" dataKey="pv" name="Page views" stroke="#4ade80" fill="url(#g-pv)" strokeWidth={2} />
              <Area type="monotone" dataKey="uv" name="Visitors" stroke="#a78bfa" fill="url(#g-uv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid2">
        <TableCard title="Trafik berdasarkan URL" icon={<Link2 size={16} />} rows={data.topUrls} emptyText="Belum ada data URL." />
        <TableCard title="Traffic by Title" icon={<FileText size={16} />} rows={data.topTitles} emptyText="Belum ada data judul." />
      </div>

      <div className="grid grid2">
        <TableCard title="Situs Perujuk" icon={<Globe size={16} />} rows={data.referrers} emptyText="Belum ada perujuk." />
        <TableCard title="Geolocation" icon={<Globe size={16} />} rows={data.countries} emptyText="Belum ada data negara." />
      </div>
    </div>
  );
}
