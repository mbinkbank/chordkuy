"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { COUNTRIES, REGIONAL } from "@/lib/countries";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Eye, Music } from "lucide-react";
import Link from "next/link";

const KEYS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F",
  "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dbm", "Dm", "D#m", "Ebm", "Em", "Fm",
  "F#m", "Gbm", "Gm", "G#m", "Abm", "Am", "A#m", "Bbm", "Bm",
];
const DIFFICULTIES = [
  { value: "novice", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Mahir" },
];

export interface SongFormData {
  judul: string;
  penyanyi: string;
  base_key: string;
  tuning: string;
  capo: string;
  difficulty: string;
  rating: string;
  language: string;
  youtube_url: string;
  isi_chord: string;
}

const defaultForm: SongFormData = {
  judul: "",
  penyanyi: "",
  base_key: "",
  tuning: "E A D G B E",
  capo: "",
  difficulty: "intermediate",
  rating: "",
  language: "Indonesia",
  youtube_url: "",
  isi_chord: "",
};

interface Props {
  initialData?: Partial<SongFormData>;
  isEdit?: boolean;
  originalJudul?: string;
  originalPenyanyi?: string;
}

function getYouTubeEmbedId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function SongForm({ initialData, isEdit, originalJudul, originalPenyanyi }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<SongFormData>({
    ...defaultForm,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "chord">("form");

  function handleChange(field: keyof SongFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.judul.trim()) { toast.error("Judul wajib diisi"); return; }
    if (!form.penyanyi.trim()) { toast.error("Penyanyi wajib diisi"); return; }

    setSaving(true);
    try {
      let res;
      if (isEdit && originalJudul && originalPenyanyi) {
        res = await api.put(
          `/api/songs/${encodeURIComponent(originalJudul)}/${encodeURIComponent(originalPenyanyi)}`,
          form
        );
      } else {
        res = await api.post("/api/songs", form);
      }

      if (res.success) {
        toast.success(isEdit ? "Lagu berhasil diperbarui" : "Lagu berhasil ditambahkan");
        router.push("/admin/songs");
      } else {
        toast.error(res.message || "Gagal menyimpan lagu");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const ytId = getYouTubeEmbedId(form.youtube_url);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/songs"
          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "Edit Lagu" : "Tambah Lagu Baru"}
          </h1>
          {isEdit && (
            <p className="text-slate-500 text-sm mt-1">
              {originalJudul} — {originalPenyanyi}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("form")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "form" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Informasi Lagu
        </button>
        <button
          onClick={() => setActiveTab("chord")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "chord" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Isi Chord
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === "form" && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Left */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                  Info Utama
                </h3>
                <Field label="Judul *" required>
                  <input
                    type="text"
                    value={form.judul}
                    onChange={(e) => handleChange("judul", e.target.value)}
                    placeholder="Masukkan judul lagu"
                    className="input"
                    required
                  />
                </Field>
                <Field label="Penyanyi *" required>
                  <input
                    type="text"
                    value={form.penyanyi}
                    onChange={(e) => handleChange("penyanyi", e.target.value)}
                    placeholder="Nama penyanyi"
                    className="input"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Base Key">
                    <select
                      value={form.base_key}
                      onChange={(e) => handleChange("base_key", e.target.value)}
                      className="input"
                    >
                      <option value="">Pilih Key</option>
                      {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </Field>
                  <Field label="Tuning">
                    <input
                      type="text"
                      value={form.tuning}
                      onChange={(e) => handleChange("tuning", e.target.value)}
                      placeholder="E A D G B E"
                      className="input"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bahasa">
                    <select
                      value={form.language}
                      onChange={(e) => handleChange("language", e.target.value)}
                      className="input"
                    >
                      <option value="">Pilih Bahasa</option>
                      <option value="-">- (Belum ditag)</option>
                      <optgroup label="Negara">
                        {COUNTRIES.map(([v, flag]) => <option key={v} value={v}>{flag} {v}</option>)}
                      </optgroup>
                      <optgroup label="Bahasa Daerah">
                        {REGIONAL.map((v) => <option key={v} value={v}>{v}</option>)}
                      </optgroup>
                    </select>
                  </Field>
                  <Field label="Capo">
                    <input
                      type="text"
                      value={form.capo}
                      onChange={(e) => handleChange("capo", e.target.value)}
                      placeholder="fret 2 atau kosong"
                      className="input"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Kesulitan">
                    <select
                      value={form.difficulty}
                      onChange={(e) => handleChange("difficulty", e.target.value)}
                      className="input"
                    >
                      {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Rating">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.rating}
                      onChange={(e) => handleChange("rating", e.target.value)}
                      placeholder="4.8"
                      className="input"
                    />
                  </Field>
                </div>
              </div>

            </div>

            {/* Right - YouTube */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">YouTube</h3>
                <Field label="YouTube URL">
                  <input
                    type="url"
                    value={form.youtube_url}
                    onChange={(e) => handleChange("youtube_url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="input"
                  />
                </Field>
                {ytId && (
                  <div className="rounded-xl overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-48"
                      allowFullScreen
                      title="YouTube Preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "chord" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                  Isi Chord
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-600 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? "Sembunyikan" : "Preview"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Format: baris CHORD dan LYRIC bergantian. Chord diawali dengan tanda [ ] atau kapital.
              </p>
              <div className={showPreview ? "grid lg:grid-cols-2 gap-4" : ""}>
                <textarea
                  value={form.isi_chord}
                  onChange={(e) => handleChange("isi_chord", e.target.value)}
                  placeholder={"[Verse 1]\nG         Em\nJudul lagu ini\nC         D\nLirik selanjutnya"}
                  className="w-full h-96 font-mono text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-slate-50"
                />
                {showPreview && (
                  <div className="bg-white border border-slate-200 text-slate-800 rounded-xl p-4 h-96 overflow-auto font-mono text-sm whitespace-pre-wrap">
                    {form.isi_chord || <span className="text-slate-500">Preview chord akan muncul di sini...</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/songs"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
