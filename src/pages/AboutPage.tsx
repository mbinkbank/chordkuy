import Breadcrumb from "../components/Breadcrumb";
import { getStats } from "../lib/api";
import { Link } from "../lib/router";
import { breadcrumbSchema, organizationSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function AboutPage() {
  const stats = getStats();
  const description = `${SITE.name} adalah platform chord gitar yang mengutamakan kecepatan, keterbacaan, dan pengalaman membaca chord tanpa gangguan.`;

  useSeo({
    title: `Tentang Kami | ${SITE.name}`,
    description,
    path: "/about",
    jsonLd: [
      webPageSchema("Tentang Kami", description, "/about"),
      organizationSchema(),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Tentang", href: "/about" },
      ]),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Tentang", href: "/about" },
        ]}
      />

      <article className="prose">
        <p className="eyebrow">Tentang</p>
        <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
          Membaca chord seharusnya sesederhana ini
        </h1>
        <p>
          {SITE.name} dibangun karena satu alasan sederhana: mencari chord gitar sering kali lebih melelahkan
          daripada memainkan lagunya. Halaman berat, iklan menutupi lirik, dan tombol transpose yang memuat
          ulang seluruh halaman. Kami membalik urutannya — chord dulu, sisanya belakangan.
        </p>

        <h2>Prinsip kami</h2>
        <ul>
          <li>
            <strong>Cepat.</strong> Halaman dirender sebagai HTML statis, JavaScript hanya dipakai untuk
            fitur interaktif seperti transpose dan auto scroll.
          </li>
          <li>
            <strong>Terbaca.</strong> Tipografi monospace, kontras tinggi, dan pemisahan visual yang jelas
            antara chord dan lirik.
          </li>
          <li>
            <strong>Aksesibel.</strong> Navigasi keyboard penuh, elemen semantik, area sentuh besar, serta
            mode gelap dan terang.
          </li>
          <li>
            <strong>Menghormati karya.</strong> Chord disediakan untuk keperluan belajar dan latihan pribadi.
          </li>
        </ul>

        <h2>Isi katalog saat ini</h2>
        <p>
          Saat ini tersedia <strong>{stats.songs} lagu</strong> dari <strong>{stats.artists} artis</strong>{" "}
          dalam <strong>{stats.genres} genre</strong>. Seluruh lagu dan artis pada versi template ini adalah
          materi demo orisinal yang ditulis khusus untuk pengujian tata letak — bukan transkripsi karya pihak
          lain. Katalog produksi akan diisi melalui basis data Supabase dengan proses kurasi dan atribusi yang
          jelas.
        </p>

        <h2>Teknologi</h2>
        <p>
          Situs ini statis, dilayani dari CDN global (Cloudflare Pages), dengan CSS vanilla tanpa framework UI
          dan tanpa pelacak pihak ketiga. Struktur data lagu dirancang agar cocok satu banding satu dengan
          tabel Supabase, sehingga penambahan ribuan halaman chord tidak mengubah antarmuka sama sekali.
        </p>

        <h2>Ingin berkontribusi?</h2>
        <p>
          Kirim koreksi chord, permintaan lagu, atau masukan aksesibilitas melalui{" "}
          <Link href="/contact">halaman kontak</Link>. Setiap koreksi ditinjau manual sebelum diterbitkan.
        </p>
      </article>
    </main>
  );
}
