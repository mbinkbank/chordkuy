import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import { getPopularSongs } from "../lib/api";
import { Link } from "../lib/router";
import { useSeo } from "../lib/seo";
import { SITE } from "../lib/site";

export default function NotFoundPage() {
  useSeo({
    title: `Halaman tidak ditemukan (404) | ${SITE.name}`,
    description: "Halaman yang kamu cari tidak tersedia. Cari chord lagu lain atau kembali ke beranda.",
    path: "/404",
    noindex: true,
  });

  return (
    <main id="main" className="container section">
      <p className="eyebrow">Error 404</p>
      <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
        Halaman tidak ditemukan
      </h1>
      <p className="small muted" style={{ maxWidth: "56ch", marginBottom: "var(--s4)" }}>
        Chord atau halaman yang kamu tuju mungkin sudah dipindahkan. Coba cari lagi, atau kembali ke{" "}
        <Link href="/" style={{ color: "var(--accent)" }}>
          beranda
        </Link>
        .
      </p>

      <div style={{ maxWidth: 560 }}>
        <SearchBar size="lg" />
      </div>

      <section className="section" aria-labelledby="nf-popular">
        <div className="section-head">
          <h2 className="h-section" id="nf-popular">
            Chord populer
          </h2>
        </div>
        <div className="grid grid-auto">
          {getPopularSongs(4).map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </main>
  );
}
