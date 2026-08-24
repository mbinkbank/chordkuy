"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OnlineVisitor = {
  visitor_id: string;
  last_seen: string;
  paths: string[];
  titles: string[];
  countries: string[];
  referrers?: string[];
  pages: number;
};

type Summary = {
  usersOnline: number;
  onlineDetails: OnlineVisitor[];
};

export default function UsersOnlinePage() {
  const [data, setData] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState<
    "summary" | "terbaru" | "most_active" | "popular_pages" | "popular_referrer" | "geolocation"
  >("summary");

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
      });
    const id = setInterval(() => {
      fetch("/api/analytics/summary")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setData(j.data);
        });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  if (!data) return <p className="muted" style={{ padding: 40, textAlign: "center" }}>Memuat…</p>;

  const totalBrowsing = data.onlineDetails.reduce((a, v) => a + v.pages, 0);

  // Derived for tabs
  const terbaru = [...data.onlineDetails]
    .flatMap((v) => v.paths.map((p, i) => ({ path: p, title: v.titles[i] || "", visitor: v.visitor_id, time: v.last_seen })))
    .slice(0, 20);

  const mostActive = [...data.onlineDetails].sort((a, b) => b.pages - a.pages);
  const popularPagesMap = new Map<string, number>();
  data.onlineDetails.forEach((v) => v.paths.forEach((p) => popularPagesMap.set(p, (popularPagesMap.get(p) || 0) + 1)));
  const popularPages = [...popularPagesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div style={{ marginTop: 14 }}>
      {/* Header bar like Histats */}
      <div
        style={{
          background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
          color: "white",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        <span>Users online: {data.usersOnline}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          browsing: {totalBrowsing} halaman
          <Link
            href="/admin/analytics"
            style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "white" }}
          >
            Kembali
          </Link>
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        {[
          ["summary", "Summary"],
          ["terbaru", "Terbaru"],
          ["most_active", "Most active visitors"],
          ["popular_pages", "Popular pages"],
          ["popular_referrer", "Popular referrer"],
          ["geolocation", "Geolocation"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={activeTab === key ? "" : "secondary"}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === key ? "var(--accent)" : "transparent",
              color: activeTab === key ? "#06220e" : "var(--text)",
              border: activeTab === key ? "1px solid var(--accent)" : "1px solid var(--border)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ marginTop: 14 }}>
        {activeTab === "summary" && (
          <div className="grid grid2">
            <div className="panel">
              <h3 style={{ marginTop: 0, fontSize: 14 }}>Ringkasan</h3>
              <p style={{ fontSize: 13 }}><strong>{data.usersOnline}</strong> pengunjung online, <strong>{totalBrowsing}</strong> halaman sedang dibaca.</p>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Data diperbarui otomatis tiap 15 detik. 1 visitor bisa membuka beberapa tab.</p>
            </div>
            <div className="panel">
              <h3 style={{ marginTop: 0, fontSize: 14 }}>Cara membaca</h3>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                • <strong>Terbaru</strong>: daftar kunjungan terbaru dari pengunjung online<br />
                • <strong>Most active</strong>: pengunjung dengan tab terbanyak<br />
                • <strong>Popular pages</strong>: halaman paling banyak dibuka saat ini
              </p>
            </div>
          </div>
        )}

        {activeTab === "terbaru" && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>Terbaru</div>
            {terbaru.length === 0 ? (
              <p className="muted" style={{ padding: 20, textAlign: "center" }}>Belum ada aktivitas.</p>
            ) : (
              <table>
                <thead><tr><th>Waktu</th><th>Judul / URL</th><th>Visitor</th></tr></thead>
                <tbody>
                  {terbaru.map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(t.time).toLocaleTimeString("id-ID")}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title || "(tanpa judul)"}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{t.path}</div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{t.visitor.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "most_active" && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>Most active visitors</div>
            <table>
              <thead><tr><th>#</th><th>Visitor</th><th>Halaman</th><th>Tab terakhir</th></tr></thead>
              <tbody>
                {mostActive.map((v, i) => (
                  <tr key={v.visitor_id}>
                    <td>{i + 1}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{v.visitor_id.slice(0, 8)}…</td>
                    <td><span className="badge" style={{ background: "var(--accent)", color: "#06220e" }}>{v.pages}</span></td>
                    <td style={{ fontSize: 13 }}>{v.titles[0] || v.paths[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "popular_pages" && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>Popular pages (online)</div>
            <table>
              <thead><tr><th>Halaman</th><th>Views</th></tr></thead>
              <tbody>
                {popularPages.map(([path, c]) => (
                  <tr key={path}><td style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{path}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "popular_referrer" && (
          <div className="panel" style={{ padding: 24, textAlign: "center" }}>
            <p className="muted">Data perujuk untuk pengunjung online akan tampil di sini setelah ada trafik dengan referrer.</p>
          </div>
        )}

        {activeTab === "geolocation" && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>Geolocation (online)</div>
            <table>
              <thead><tr><th>Negara</th><th>Visitors</th></tr></thead>
              <tbody>
                {(() => {
                  const map = new Map<string, number>();
                  data.onlineDetails.forEach((v) => {
                    const c = v.countries?.[0] || "Unknown";
                    map.set(c, (map.get(c) || 0) + 1);
                  });
                  return [...map.entries()].map(([country, count]) => (
                    <tr key={country}><td>{country || "(tanpa negara)"}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{count}</td></tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
