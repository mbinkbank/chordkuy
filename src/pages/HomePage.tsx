import { TrendingUp, Users, Shuffle } from "lucide-react";
import SearchBar from "../components/SearchBar";
import type { Song } from "../data/types";
import buildData from "../data/build-data.json";
import { mapDbRowToSong } from "../lib/api";
import { Link, navigate } from "../lib/router";
import { organizationSchema, useSeo, webPageSchema, websiteSchema } from "../lib/seo";
import { SITE } from "../lib/site";

const TRENDING: Song[] = (buildData.popularRows as any[]).map(mapDbRowToSong).slice(0, 7);
const ALL_SONGS: Song[] = (buildData.popularRows as any[]).map(mapDbRowToSong);

export default function HomePage() {
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
    <main id="main" className="search-home">
      <section className="search-home-main" aria-label="Pencarian chord gitar">
        <div className="search-home-logo">
          <img src="/chordkuy-logo.svg" alt="Chordkuy.id" className="logo-light" width={768} height={225} />
          <img src="/chordkuy-logodark.svg" alt="Chordkuy.id" className="logo-dark" width={768} height={225} />
        </div>
        <div className="search-home-box">
          <SearchBar size="lg" placeholder="Cari chord, artis, atau lirik lagu…" />
        </div>
        <div className="search-home-actions">
          <Link href="/artists" className="search-home-action">
            <Users size={16} />
            Daftar Artis
          </Link>
          <button
            type="button"
            className="search-home-action"
            onClick={() => {
              const song = ALL_SONGS[Math.floor(Math.random() * ALL_SONGS.length)];
              navigate(`/chord/${song.slug}`);
            }}
          >
            <Shuffle size={16} />
            Lagu Random
          </button>
        </div>
      </section>

      <section className="mobile-trending" aria-labelledby="trending-title">
        <div className="mobile-trending-head">
          <h2 id="trending-title">Chord Gitar Trending</h2>
        </div>
        <div className="mobile-trending-list">
          {TRENDING.map((song) => (
            <Link key={song.id} href={`/chord/${song.slug}`} className="mobile-trending-item">
              <TrendingUp size={16} aria-hidden="true" />
              <span>
                <strong>{song.title}</strong>
                <small>{song.artist}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
