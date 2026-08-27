import { useEffect, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import SongCard from "../components/SongCard";
import ShareButton from "../components/ShareButton";
import type { Artist, Song } from "../data/types";
import { useI18n } from "../lib/i18n";
import { getSongsByArtist } from "../lib/api";
import { Link } from "../lib/router";
import { breadcrumbSchema, itemListSchema, useSeo } from "../lib/seo";
import { SITE, absoluteUrl } from "../lib/site";
import { UserStar } from "lucide-react";

export default function ArtistPage({ artist }: { artist: Artist }) {
  const { t } = useI18n();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSongs() {
      const data = await getSongsByArtist(artist.slug);
      setSongs(data);
      setLoading(false);
    }
    loadSongs();
  }, [artist.slug]);

  const path = `/artist/${artist.slug}`;
  const description = `${t("songCount")(songs.length)} ${artist.name}: kunci lengkap, transpose real-time, dan auto scroll. ${artist.bio}`.slice(
    0,
    300,
  );

  useSeo({
    title: `${t("chordGitar")} ${artist.name} — ${t("songCount")(songs.length)} | ${SITE.name}`,
    description,
    path,
    type: "profile",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: absoluteUrl(path),
        inLanguage: SITE.lang,
        mainEntity: {
          "@type": "MusicGroup",
          name: artist.name,
          description: artist.bio,
          genre: artist.genres,
          url: absoluteUrl(path),
        },
      },
      breadcrumbSchema([
        { name: t("home"), href: "/" },
        { name: t("navArtists"), href: "/artists" },
        { name: artist.name, href: path },
      ]),
      itemListSchema(
        `${t("chordGitar")} ${artist.name}`,
        songs.map((s) => `/chord/${s.slug}`),
      ),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: t("home"), href: "/" },
          { name: t("navArtists"), href: "/artists" },
          { name: artist.name, href: path },
        ]}
      />

      <header className="panel" style={{ marginBottom: "var(--s5)" }}>
        <div className="row" style={{ alignItems: "flex-start", gap: "var(--s4)" }}>
          <span className="avatar avatar-lg" aria-hidden="true">
            <UserStar size={24} />
          </span>
          <div className="stack stack-2" style={{ flex: "1 1 260px", minWidth: 0 }}>
            <p className="eyebrow">{t("sidebarArtist")} · {artist.country}</p>
            <h1 className="h-page">{t("chordGitar")} {artist.name}</h1>
            <p className="small muted" style={{ maxWidth: "62ch" }}>
              {artist.bio}
            </p>
            <div className="row">
              {artist.genres.map((genre) => (
                <Link key={genre} className="badge" href={`/search?q=${encodeURIComponent(genre)}`}>
                  {genre}
                </Link>
              ))}
              <span className="badge badge-muted">{songs.length} {t("songs")}</span>
              <ShareButton title={`${t("chordGitar")} ${artist.name}`} />
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="artist-songs">
        <div className="section-head">
          <h2 className="h-section" id="artist-songs">
            {t("allSongs")(artist.name)}
          </h2>
          <span className="caption">{t("sortedByPop")}</span>
        </div>

        {loading ? (
          <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>{t("artistLoading")}</p>
        ) : songs.length === 0 ? (
          <div className="empty">{t("artistNoChords")}</div>
        ) : (
          <div className="grid grid-auto">
            {songs.map((song, index) => (
              <SongCard key={song.id} song={song} index={index} showArtist={false} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="card card-accent">
          <p className="small" style={{ margin: 0 }}>
            {t("artistRequestFind")(artist.name)}{" "}
            <Link href="/contact" style={{ color: "var(--accent)" }}>
              {t("artistRequestLink")}
            </Link>{" "}
            {t("artistRequestEnd")}
          </p>
        </div>
      </section>
    </main>
  );
}
