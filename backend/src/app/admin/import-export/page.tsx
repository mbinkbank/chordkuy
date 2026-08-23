"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import {
  UploadCloud,
  Download,
  FileJson,
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Music,
  Activity,
} from "lucide-react";

interface SyncStatus {
  last_sync: string | null;
  total_songs: number;
  status: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  errors: string[];
}

interface PreviewSong {
  judul?: string;
  penyanyi?: string;
  album?: string;
  language?: string;
  songtype?: string;
}

export default function ImportExportPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewSong[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function loadSyncStatus() {
    setSyncing(true);
    const res = await api.get<SyncStatus>("/api/sync/status");
    if (res.success) setSyncStatus(res.data);
    setSyncing(false);
  }

  useEffect(() => { loadSyncStatus(); }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["json", "csv"].includes(ext || "")) {
      toast.error("Hanya file JSON atau CSV yang didukung");
      return;
    }
    setImportFile(file);
    setImportResult(null);

    // Parse preview
    try {
      const text = await file.text();
      if (ext === "json") {
        const parsed = JSON.parse(text);
        const songs = Array.isArray(parsed) ? parsed : parsed.songs || [];
        setPreviewData(songs.slice(0, 5));
      } else {
        const lines = text.split("\n").filter(Boolean);
        const headers = lines[0].split(",").map((h: string) => h.trim().replace(/"/g, ""));
        const rows = lines.slice(1, 6).map((line: string) => {
          const values = line.split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
          const obj: Record<string, string> = {};
          headers.forEach((h: string, i: number) => { obj[h] = values[i] || ""; });
          return obj;
        });
        setPreviewData(rows);
      }
      setShowPreview(true);
    } catch {
      setPreviewData([]);
    }
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);

    const ext = importFile.name.split(".").pop()?.toLowerCase();
    const endpoint = ext === "csv" ? "/api/import/csv" : "/api/import/json";

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await res.json();

    if (data.success) {
      setImportResult(data.data);
      toast.success(data.message);
      loadSyncStatus();
    } else {
      toast.error(data.message || "Import gagal");
    }
    setImporting(false);
  }

  function exportFile(format: "json" | "csv") {
    window.open(`/api/export/${format}`, "_blank");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Import / Export</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola data lagu melalui file JSON atau CSV</p>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Status Sinkronisasi</h3>
          <button onClick={loadSyncStatus} disabled={syncing} className="p-2 text-slate-400 hover:text-slate-600 transition">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {syncStatus ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
              <Activity className="w-6 h-6 text-purple-500" />
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <span className={`text-sm font-semibold ${syncStatus.status === "ok" ? "text-emerald-600" : "text-amber-600"}`}>
                  {syncStatus.status === "ok" ? "Aktif" : "Kosong"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
              <Music className="w-6 h-6 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-400">Total Lagu</p>
                <p className="text-sm font-semibold text-slate-700">{syncStatus.total_songs.toLocaleString("id")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
              <RefreshCw className="w-6 h-6 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Terakhir Sync</p>
                <p className="text-sm font-semibold text-slate-700">
                  {syncStatus.last_sync ? syncStatus.last_sync.slice(0, 16) : "Belum ada"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Import */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Import Data</h3>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              dragging ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${dragging ? "text-purple-500" : "text-slate-300"}`} />
            <p className="text-sm font-medium text-slate-600">
              Drag & drop file atau klik untuk pilih
            </p>
            <p className="text-xs text-slate-400 mt-1">Mendukung JSON dan CSV</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Selected File */}
          {importFile && (
            <div className="mt-4 flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              {importFile.name.endsWith(".json") ? (
                <FileJson className="w-6 h-6 text-amber-500 flex-shrink-0" />
              ) : (
                <FileText className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{importFile.name}</p>
                <p className="text-xs text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => { setImportFile(null); setShowPreview(false); setPreviewData([]); setImportResult(null); }}
                className="p-1 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Preview */}
          {showPreview && previewData.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Preview (5 data pertama):</p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["judul", "penyanyi", "album", "language"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-700 truncate max-w-[100px]">{(row as Record<string, string>).judul}</td>
                        <td className="px-3 py-2 text-slate-600 truncate max-w-[80px]">{(row as Record<string, string>).penyanyi}</td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[80px]">{(row as Record<string, string>).album}</td>
                        <td className="px-3 py-2 text-slate-500">{(row as Record<string, string>).language}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {importFile && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-medium text-sm transition"
            >
              {importing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {importing ? "Mengimport..." : "Import Sekarang"}
            </button>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {importResult.inserted} ditambahkan, {importResult.updated} diperbarui
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{importResult.errors.length} error:</span>
                  </div>
                  <ul className="text-xs text-red-500 space-y-1 max-h-24 overflow-auto">
                    {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Export Data</h3>
          <p className="text-sm text-slate-500 mb-5">
            Download semua data lagu dalam format JSON atau CSV.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => exportFile("json")}
              className="w-full flex items-center gap-4 p-4 border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 rounded-xl transition group"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition">
                <FileJson className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800">Export JSON</p>
                <p className="text-xs text-slate-400">Format terstruktur, cocok untuk API</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 ml-auto" />
            </button>

            <button
              onClick={() => exportFile("csv")}
              className="w-full flex items-center gap-4 p-4 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl transition group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800">Export CSV</p>
                <p className="text-xs text-slate-400">Format spreadsheet, cocok untuk Excel</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 ml-auto" />
            </button>
          </div>

          {/* Also export via songs endpoint */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-3">API Endpoint</p>
            <div className="space-y-2">
              {[
                { label: "GET /api/songs/export?format=json", url: "/api/songs/export?format=json" },
                { label: "GET /api/songs/export?format=csv", url: "/api/songs/export?format=csv" },
              ].map((ep) => (
                <div key={ep.url} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <code className="text-xs text-slate-600 font-mono">{ep.label}</code>
                  <button onClick={() => window.open(ep.url, "_blank")} className="text-purple-500 hover:text-purple-600">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
