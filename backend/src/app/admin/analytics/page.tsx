"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Eye, Users, UserPlus, Clock, Activity,
  Globe, Link2, FileText, TrendingUp,
} from "lucide-react";
import Link from "next/link";

type Summary = {
  totalPageViews: number;
  totalVisitors: number;
  today: { pageViews: number; visitors: number; firstTime: number };
  usersOnline: number;
  onlineDetails: { visitor_id: string; last_seen: string; paths: string[]; titles: string[]; countries: string[]; pages: number }[];
  avgDuration: string;
  pagesPerVisit: number;
  referrers: { label: string; c: number }[];
  countries: { label: string; c: number }[];
  topUrls: { label: string; c: number }[];
  topTitles: { label: string; c: number }[];
  daily: { d: string; pv: number; uv: number }[];
};

function StatCard({ icon, label, value, accent, sub, onClick }: {
  icon: React.ReactNode; label: string; value: string | number; accent: string; sub?: string; onClick?: () => void;
}) {
  return (
    <div
      className="panel"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "18px 16px",
        borderLeft: `3px solid ${accent}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
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
  const max = Math.max(...rows.map((r) => r.c), 1);
  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--accent)", color: "#06220e" }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <span className="badge" style={{ marginLeft: "auto", fontSize: 11 }}>{rows.length} item</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: "28px 16px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg)", border: "1px dashed var(--border)", display: "grid", placeItems: "center", margin: "0 auto 10px", color: "var(--muted)" }}>{icon}</div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>{emptyText}</p>
          <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>Data akan muncul setelah ada kunjungan.</p>
        </div>
      ) : (
        <div style={{ overflow: "auto", maxHeight: 320 }}>
          <table style={{ fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--panel)", zIndex: 1 }}>
              <tr>
                <th style={{ width: 28, textAlign: "center" }}>#</th>
                <th>{title.includes("URL") ? "URL" : title.includes("Title") ? "Judul Lagu" : title.includes("Perujuk") ? "Sumber" : "Negara"}</th>
                <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const displayLabel = r.label.replace(/\/+/g, "/").replace(/^\/chord\/chord\//, "/chord/");
                return (
                  <tr key={r.label} style={{ borderBottom: i === rows.length - 1 ? "none" : undefined }}>
                    <td style={{ textAlign: "center", color: "var(--muted)", fontWeight: 600, width: 28 }}>{i + 1}</td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}
                          title={r.label}
                        >
                          {displayLabel || "(langsung)"}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg)", borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ width: `${Math.round((r.c / max) * 100)}%`, height: "100%", background: "var(--accent)" }} />
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="badge" style={{ background: "var(--accent)", color: "#06220e", borderColor: "transparent", fontWeight: 700 }}>{r.c}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else setError(j.message || "Gagal memuat");
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
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
        <Link href="/admin/analytics/online" style={{ textDecoration: "none" }}>
          <StatCard
            icon={<span style={{ width: 10, height: 10, borderRadius: 999, background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 6px #22c55e22" }} />}
            label="Users online"
            value={data.usersOnline}
            accent="#22c55e"
            sub="5 menit terakhir → klik untuk detail"
          />
        </Link>
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
