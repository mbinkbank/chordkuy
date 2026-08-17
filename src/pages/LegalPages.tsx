import Breadcrumb from "../components/Breadcrumb";
import { Link } from "../lib/router";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

const UPDATED = "15 Januari 2026";

export function PrivacyPage() {
  const description = `Kebijakan privasi ${SITE.name}: data apa yang kami simpan, penggunaan localStorage, dan hak pengguna.`;

  useSeo({
    title: `Kebijakan Privasi | ${SITE.name}`,
    description,
    path: "/privacy",
    jsonLd: [
      webPageSchema("Kebijakan Privasi", description, "/privacy"),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Kebijakan Privasi", href: "/privacy" },
      ]),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Kebijakan Privasi", href: "/privacy" },
        ]}
      />
      <article className="prose">
        <p className="eyebrow">Legal · diperbarui {UPDATED}</p>
        <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
          Kebijakan Privasi
        </h1>
        <p>
          Kebijakan ini menjelaskan bagaimana {SITE.name} memperlakukan data saat kamu menggunakan situs ini.
          Ringkasnya: kami mengumpulkan sesedikit mungkin.
        </p>

        <h2>1. Data yang kami simpan di perangkat kamu</h2>
        <p>
          Preferensi tampilan disimpan secara lokal di peramban melalui <code>localStorage</code> dan tidak
          pernah dikirim ke server kami:
        </p>
        <ul>
          <li>
            <code>chordlab:theme</code> — mode gelap atau terang.
          </li>
          <li>
            <code>chordlab:font-size</code> — ukuran teks chord.
          </li>
          <li>
            <code>chordlab:scroll-speed</code> — kecepatan auto scroll.
          </li>
        </ul>
        <p>Menghapus data situs di peramban akan menghapus seluruh preferensi tersebut.</p>

        <h2>2. Cookie</h2>
        <p>
          Situs ini tidak memasang cookie iklan maupun cookie pelacak lintas situs. Tidak ada profil pengguna
          yang dibentuk dari aktivitas membaca chord.
        </p>

        <h2>3. Analitik</h2>
        <p>
          Jika analitik diaktifkan di masa mendatang, kami hanya akan menggunakan layanan yang bersifat
          agregat dan tidak menyimpan identitas pribadi, serta memperbarui halaman ini terlebih dahulu.
        </p>

        <h2>4. Data yang kamu kirim sukarela</h2>
        <p>
          Saat mengirim pesan melalui <Link href="/contact">halaman kontak</Link>, isi pesan dan alamat email
          kamu diproses melalui aplikasi email milikmu sendiri. Kami menggunakan informasi tersebut hanya
          untuk membalas dan menindaklanjuti permintaan.
        </p>

        <h2>5. Layanan pihak ketiga</h2>
        <p>
          Situs dilayani melalui Cloudflare Pages yang memproses log permintaan standar (alamat IP, agen
          pengguna) untuk keperluan keamanan dan pencegahan penyalahgunaan. Basis data konten dijalankan di
          Supabase; kredensialnya tidak pernah disertakan di sisi klien.
        </p>

        <h2>6. Hak kamu</h2>
        <p>
          Kamu berhak meminta informasi, koreksi, atau penghapusan data yang pernah kamu kirimkan kepada kami.
          Ajukan melalui <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>

        <h2>7. Perubahan kebijakan</h2>
        <p>
          Kebijakan dapat diperbarui sewaktu-waktu. Tanggal pembaruan terakhir selalu ditampilkan di bagian
          atas halaman ini.
        </p>
      </article>
    </main>
  );
}

export function TermsPage() {
  const description = `Syarat dan ketentuan penggunaan ${SITE.name}, termasuk aturan penggunaan chord, hak cipta, dan batasan tanggung jawab.`;

  useSeo({
    title: `Syarat & Ketentuan | ${SITE.name}`,
    description,
    path: "/terms",
    jsonLd: [
      webPageSchema("Syarat & Ketentuan", description, "/terms"),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Syarat & Ketentuan", href: "/terms" },
      ]),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Syarat & Ketentuan", href: "/terms" },
        ]}
      />
      <article className="prose">
        <p className="eyebrow">Legal · diperbarui {UPDATED}</p>
        <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
          Syarat &amp; Ketentuan
        </h1>
        <p>
          Dengan mengakses {SITE.name}, kamu dianggap menyetujui ketentuan di bawah ini. Bila tidak setuju,
          mohon berhenti menggunakan situs.
        </p>

        <h2>1. Penggunaan yang diizinkan</h2>
        <p>
          Chord, lirik, dan diagram di situs ini disediakan untuk keperluan belajar, latihan pribadi, dan
          apresiasi musik. Dilarang menggandeng ulang konten secara massal (scraping otomatis) atau
          menerbitkan ulang untuk tujuan komersial tanpa izin tertulis.
        </p>

        <h2>2. Hak cipta</h2>
        <p>
          Hak cipta lagu tetap menjadi milik pencipta, penerbit, dan pemegang lisensinya. Transkripsi chord
          merupakan interpretasi pendengaran untuk tujuan edukasi. Pemegang hak yang keberatan dapat mengajukan
          permintaan penurunan konten melalui <Link href="/contact">halaman kontak</Link>, dan kami akan
          menindaklanjuti secepatnya.
        </p>

        <h2>3. Akurasi konten</h2>
        <p>
          Kami berupaya menjaga akurasi transkripsi, namun tidak menjamin seluruh chord bebas dari kekeliruan.
          Konten disediakan “sebagaimana adanya”.
        </p>

        <h2>4. Kontribusi pengguna</h2>
        <p>
          Dengan mengirimkan koreksi atau materi, kamu menyatakan berhak membagikannya dan memberi kami izin
          non-eksklusif untuk menampilkan serta menyunting materi tersebut di situs ini.
        </p>

        <h2>5. Ketersediaan layanan</h2>
        <p>
          Kami dapat mengubah, menghentikan sementara, atau menghapus bagian layanan kapan saja, termasuk saat
          pemeliharaan terjadwal.
        </p>

        <h2>6. Batasan tanggung jawab</h2>
        <p>
          Sejauh diizinkan hukum yang berlaku, {SITE.name} tidak bertanggung jawab atas kerugian tidak
          langsung yang timbul dari penggunaan situs.
        </p>

        <h2>7. Hukum yang berlaku</h2>
        <p>
          Ketentuan ini tunduk pada hukum Republik Indonesia. Pertanyaan dapat dikirim ke{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </article>
    </main>
  );
}
