import { useEffect, useState } from "react";
import { TrendingUp, Languages, Shuffle } from "lucide-react";
import { useI18n } from "../lib/i18n";
import SearchBar from "../components/SearchBar";
import type { Song } from "../data/types";
import buildData from "../data/build-data.json";
import { getPopularSongs, mapDbRowToSong } from "../lib/api";
import { Link, navigate } from "../lib/router";
import { organizationSchema, useSeo, webPageSchema, websiteSchema } from "../lib/seo";
import { SITE } from "../lib/site";

const BUILT_IN_TRENDING: Song[] = (buildData.popularRows as any[]).map(mapDbRowToSong).slice(0, 7);
const ALL_SONGS: Song[] = (buildData.popularRows as any[]).map(mapDbRowToSong);

export default function HomePage() {
  const { t, toggleLang } = useI18n();
  const [trending, setTrending] = useState(BUILT_IN_TRENDING);

  useEffect(() => {
    getPopularSongs(7).then(setTrending).catch(() => {});
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
    <main id="main" className="search-home">
      <section className="search-home-main" aria-label="Pencarian chord gitar">
        <Link href="/" className="search-home-logo" aria-label="Beranda Chordkuy.id">
          <img src="/chordkuy-logo.svg" alt="Chordkuy.id" className="logo-light" width={768} height={225} />
          <img src="/chordkuy-logodark.svg" alt="Chordkuy.id" className="logo-dark" width={768} height={225} />
        </Link>
        <div className="search-home-box">
          <SearchBar size="lg" placeholder={t("searchPlaceholder")} />
        </div>
        <div className="search-home-actions">
          <button type="button" className="search-home-action" onClick={toggleLang}>
            <Languages size={16} />
            {t("changeLang")}
          </button>
          <button
            type="button"
            className="search-home-action"
            onClick={() => {
              const song = ALL_SONGS[Math.floor(Math.random() * ALL_SONGS.length)];
              navigate(`/chord/${song.slug}`);
            }}
          >
            <Shuffle size={16} />
            {t("randomSong")}
          </button>
        </div>
      </section>

      <section className="mobile-trending" aria-labelledby="trending-title">
        <div className="mobile-trending-head">
          <h2 id="trending-title">{t("trendingTitle")}</h2>
        </div>
        <div className="mobile-trending-list">
          {trending.map((song) => (
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
