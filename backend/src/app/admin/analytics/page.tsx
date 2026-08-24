"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Summary = {
  totalPageViews: number;
  totalVisitors: number;
  today: { pageViews: number; visitors: number; firstTime: number };
  usersOnline: number;
  referrers: { label: string; c: number }[];
  countries: { label: string; c: number }[];
  topUrls: { label: string; c: number }[];
  topTitles: { label: string; c: number }[];
  daily: { d: string; pv: number; uv: number }[];
};

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
    <div style={{ marginTop: 14 }} className="grid">
      <div className="grid grid3">
        <div className="stat-card"><div className="stat-value">{data.today.pageViews}</div><div className="stat-label">Page views hari ini</div></div>
        <div className="stat-card"><div className="stat-value">{data.today.visitors}</div><div className="stat-label">Pengunjung hari ini</div></div>
        <div className="stat-card"><div className="stat-value">{data.usersOnline}</div><div className="stat-label">Users online (5 menit)</div></div>
      </div>
      <div className="grid grid3">
        <div className="stat-card"><div className="stat-value">{data.today.firstTime}</div><div className="stat-label">First time visitors (hari ini)</div></div>
        <div className="stat-card"><div className="stat-value">{data.totalPageViews}</div><div className="stat-label">Total page views</div></div>
        <div className="stat-card"><div className="stat-value">{data.totalVisitors}</div><div className="stat-label">Total pengunjung</div></div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>7 hari terakhir</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a33" />
              <XAxis dataKey="d" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="pv" stroke="#4ade80" name="Page views" />
              <Line type="monotone" dataKey="uv" stroke="#a78bfa" name="Visitors" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid2">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Trafik berdasarkan URL</h3>
          <table><thead><tr><th>URL</th><th>Views</th></tr></thead><tbody>
            {data.topUrls.map((r) => <tr key={r.label}><td>{r.label}</td><td>{r.c}</td></tr>)}
          </tbody></table>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Traffic by Title</h3>
          <table><thead><tr><th>Title</th><th>Views</th></tr></thead><tbody>
            {data.topTitles.map((r) => <tr key={r.label}><td>{r.label}</td><td>{r.c}</td></tr>)}
          </tbody></table>
        </div>
      </div>

      <div className="grid grid2">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Situs Perujuk</h3>
          <table><thead><tr><th>Referrer</th><th>Views</th></tr></thead><tbody>
            {data.referrers.map((r) => <tr key={r.label}><td style={{ wordBreak: "break-all" }}>{r.label}</td><td>{r.c}</td></tr>)}
          </tbody></table>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Geolocation</h3>
          <table><thead><tr><th>Negara</th><th>Views</th></tr></thead><tbody>
            {data.countries.map((r) => <tr key={r.label}><td>{r.label || "(tanpa negara)"}</td><td>{r.c}</td></tr>)}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
