import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

type Status = "idle" | "sent" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [topic, setTopic] = useState("koreksi");
  const description = `Hubungi tim ${SITE.name} untuk koreksi chord, permintaan lagu, kerja sama, atau laporan masalah aksesibilitas.`;

  useSeo({
    title: `Kontak | ${SITE.name}`,
    description,
    path: "/contact",
    jsonLd: [
      webPageSchema("Kontak", description, "/contact"),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Kontak", href: "/contact" },
      ]),
    ],
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!name || !message) {
      setStatus("error");
      return;
    }
    /* Tanpa backend & tanpa API key di klien: buka email client pengguna.
       Pada tahap Supabase, ganti dengan insert ke tabel `messages`. */
    const subject = encodeURIComponent(`[${topic}] Pesan untuk ${SITE.name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}`);
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
  };

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Kontak", href: "/contact" },
        ]}
      />

      <div className="chord-layout">
        <div>
          <p className="eyebrow">Kontak</p>
          <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
            Kirim pesan
          </h1>
          <p className="small muted" style={{ maxWidth: "58ch", marginBottom: "var(--s4)" }}>
            Koreksi chord, permintaan lagu baru, laporan bug, atau kerja sama. Kami membaca semuanya dan
            biasanya membalas dalam 2–3 hari kerja.
          </p>

          <form className="panel stack stack-4" onSubmit={submit} noValidate>
            <div className="field">
              <label className="label" htmlFor="topic">
                Topik
              </label>
              <select
                id="topic"
                name="topic"
                className="select"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option value="koreksi">Koreksi chord</option>
                <option value="permintaan">Permintaan lagu</option>
                <option value="bug">Laporan bug / aksesibilitas</option>
                <option value="kerja-sama">Kerja sama</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="name">
                Nama
              </label>
              <input id="name" name="name" className="input" type="text" autoComplete="name" required />
            </div>

            <div className="field">
              <label className="label" htmlFor="email">
                Email (opsional)
              </label>
              <input id="email" name="email" className="input" type="email" autoComplete="email" />
            </div>

            <div className="field">
              <label className="label" htmlFor="message">
                Pesan
              </label>
              <textarea id="message" name="message" className="textarea" required />
            </div>

            <div className="row">
              <button className="btn btn-accent btn-lg" type="submit">
                Kirim pesan
              </button>
              <span className="caption" role="status" aria-live="polite">
                {status === "sent" && "Aplikasi email kamu akan terbuka."}
                {status === "error" && "Nama dan pesan wajib diisi."}
              </span>
            </div>
          </form>
        </div>

        <aside className="sidebar" aria-label="Informasi kontak">
          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              Email langsung
            </h2>
            <p className="small" style={{ margin: 0 }}>
              <a href={`mailto:${SITE.email}`} style={{ color: "var(--accent)" }}>
                {SITE.email}
              </a>
            </p>
          </div>
          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              Sebelum mengirim
            </h2>
            <ul className="stack stack-1 small" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>› Sertakan tautan halaman chord terkait.</li>
              <li>› Untuk koreksi, tulis bar/baris yang keliru.</li>
              <li>› Untuk permintaan, sebutkan judul dan artis.</li>
            </ul>
          </div>
          <div className="card card-accent">
            <p className="caption" style={{ margin: 0 }}>
              Formulir ini tidak menyimpan data di peramban dan tidak memuat skrip pihak ketiga.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
