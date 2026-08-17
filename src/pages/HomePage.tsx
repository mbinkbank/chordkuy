import ArtistCard from "../components/ArtistCard";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import {
  countSongsInGenre,
  formatDate,
  getGenres,
  getPopularArtists,
  getPopularSongs,
  getRecentSongs,
  getStats,
} from "../lib/api";
import { Link } from "../lib/router";
import { organizationSchema, useSeo, webPageSchema, websiteSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function HomePage() {
  const popular = getPopularSongs(8);
  const artists = getPopularArtists(6);
  const recent = getRecentSongs(6);
  const genres = getGenres();
  const stats = getStats();

  useSeo({
    title: `${SITE.name} — Chord Gitar Lengkap, Transpose & Auto Scroll`,
    description: SITE.description,
    path: "/",
    jsonLd: [
      websiteSchema(),
      organizationSchema(),
      webPageSchema(`${SITE.name} — Chord Gitar`, SITE.description, "/"),
    ],
  });

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="stack stack-4">
            <p className="eyebrow">
              Chord library · {stats.songs} lagu · {stats.artists} artis
            </p>
            <h1 className="h-display">
              Chord gitar yang bersih,
              <br />
              cepat, dan enak dibaca.
            </h1>
            <p className="lead">
              Transpose real-time, auto scroll, diagram chord, dan kontrol ukuran teks — semuanya tanpa
              gangguan. Dibuat untuk gitaris yang ingin langsung memainkan lagunya.
            </p>

            <SearchBar size="lg" placeholder="Cari judul lagu atau nama artis…" />

            <div className="row">
              <span className="caption">Populer:</span>
              {["Senja Kolektif", "Folk", "Am", "Rana Astari"].map((term) => (
                <Link key={term} className="chip" href={`/search?q=${encodeURIComponent(term)}`}>
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <div className="stack stack-3">
            <div className="stat-grid">
              <div className="stat">
                <div className="n">{stats.songs}</div>
                <div className="l">Lagu</div>
              </div>
              <div className="stat">
                <div className="n">{stats.artists}</div>
                <div className="l">Artis</div>
              </div>
              <div className="stat">
                <div className="n">{stats.genres}</div>
                <div className="l">Genre</div>
              </div>
            </div>

            <div className="card">
              <p className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
                Fitur pembaca chord
              </p>
              <ul className="stack stack-1 small" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li>› Transpose ±11 semitone tanpa reload</li>
                <li>› Auto scroll dengan kontrol kecepatan</li>
                <li>› Diagram chord saat hover atau tap</li>
                <li>› Ukuran teks tersimpan otomatis</li>
                <li>› Mode gelap &amp; terang</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <main id="main">
        <section className="container section" aria-labelledby="popular-songs">
          <div className="section-head">
            <h2 className="h-section" id="popular-songs">
              Lagu Populer
            </h2>
            <Link className="small" href="/search">
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-auto">
            {popular.map((song, index) => (
              <SongCard key={song.id} song={song} index={index} />
            ))}
          </div>
        </section>

        <section className="container section" aria-labelledby="popular-artists">
          <div className="section-head">
            <h2 className="h-section" id="popular-artists">
              Artis Populer
            </h2>
            <Link className="small" href="/artists">
              Semua artis →
            </Link>
          </div>
          <div className="grid grid-auto">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>

        <section className="container section" aria-labelledby="genres">
          <div className="section-head">
            <h2 className="h-section" id="genres">
              Genre
            </h2>
            <span className="caption">Telusuri berdasarkan gaya musik</span>
          </div>
          <div className="grid grid-auto-sm">
            {genres.map((genre) => (
              <Link key={genre.slug} className="card" href={`/search?q=${encodeURIComponent(genre.name)}`}>
                <span className="row" style={{ justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 13 }}>{genre.name}</strong>
                  <span className="badge badge-muted">{countSongsInGenre(genre.slug)}</span>
                </span>
                <span className="caption" style={{ display: "block", marginTop: 4 }}>
                  {genre.description}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container section" aria-labelledby="recent">
          <div className="section-head">
            <h2 className="h-section" id="recent">
              Baru Ditambahkan
            </h2>
            <span className="caption">Diperbarui berkala</span>
          </div>
          <div className="list-rows">
            {recent.map((song) => (
              <Link key={song.id} className="card song-card" href={`/chord/${song.slug}`}>
                <span className="thumb" aria-hidden="true">
                  {song.originalKey}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="title">{song.title}</span>
                  <span className="sub">
                    {song.artist} · {song.genre}
                  </span>
                </span>
                <span className="meta">{formatDate(song.updatedAt)}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
