import { useEffect, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import type { Artist, Genre, Song } from "../data/types";
import {
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
  const [popular, setPopular] = useState<Song[]>([]);
  const [recent, setRecent] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [stats, setStats] = useState({ songCount: 0, artistCount: 0, genreCount: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [popData, recData, artData, genData, statData] = await Promise.all([
          getPopularSongs(8),
          getRecentSongs(6),
          getPopularArtists(6),
          getGenres(),
          getStats(),
        ]);
        setPopular(popData || []);
        setRecent(recData || []);
        setArtists(artData || []);
        setGenres(genData || []);
        setStats(statData || { songCount: 0, artistCount: 0, genreCount: 0 });
      } catch (err: any) {
        console.error("Failed to load home page data:", err);
        setErrorMsg(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
              Chord library · {stats.songCount} lagu · {stats.artistCount} artis
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
              {["Oasis", "Dewa 19", "Green Day", "Slank"].map((term) => (
                <Link key={term} className="chip" href={`/search?q=${encodeURIComponent(term)}`}>
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <div className="stack stack-3">
            <div className="stat-grid">
              <div className="stat">
                <div className="n">{stats.songCount}</div>
                <div className="l">Lagu</div>
              </div>
              <div className="stat">
                <div className="n">{stats.artistCount}</div>
                <div className="l">Artis</div>
              </div>
              <div className="stat">
                <div className="n">{stats.genreCount}</div>
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
        {errorMsg && (
          <div className="container" style={{ padding: "20px 0", color: "#ff6b6b" }}>
            Error memuat data: {errorMsg}
          </div>
        )}

        <section className="container section" aria-labelledby="popular-songs">
          <div className="section-head">
            <h2 className="h-section" id="popular-songs">
              Lagu Populer
            </h2>
            <Link className="small" href="/search">
              Lihat semua →
            </Link>
          </div>
          {loading ? (
            <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Memuat lagu...</p>
          ) : popular.length === 0 ? (
            <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Belum ada lagu tersedia.</p>
          ) : (
            <div className="grid grid-auto">
              {popular.map((song, index) => (
                <SongCard key={song.id} song={song} index={index} />
              ))}
            </div>
          )}
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
          {loading ? (
            <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Memuat artis...</p>
          ) : (
            <div className="grid grid-auto">
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </section>

        <section className="container section" aria-labelledby="recent">
          <div className="section-head">
            <h2 className="h-section" id="recent">
              Baru Ditambahkan
            </h2>
            <span className="caption">Diperbarui berkala</span>
          </div>
          {loading ? (
            <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Memuat lagu baru...</p>
          ) : (
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
                  <span className="meta">{formatDate(song.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
