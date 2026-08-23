import { useEffect, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import SongCard from "../components/SongCard";
import ShareButton from "../components/ShareButton";
import type { Artist, Song } from "../data/types";
import { getSongsByArtist } from "../lib/api";
import { Link } from "../lib/router";
import { breadcrumbSchema, itemListSchema, useSeo } from "../lib/seo";
import { SITE, absoluteUrl } from "../lib/site";
import { UserStar } from "lucide-react";

export default function ArtistPage({ artist }: { artist: Artist }) {
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
  const description = `${songs.length} chord gitar ${artist.name}: kunci lengkap, transpose real-time, dan auto scroll. ${artist.bio}`.slice(
    0,
    300,
  );

  useSeo({
    title: `Chord ${artist.name} — ${songs.length} Lagu Lengkap | ${SITE.name}`,
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
        { name: "Beranda", href: "/" },
        { name: "Artis", href: "/artists" },
        { name: artist.name, href: path },
      ]),
      itemListSchema(
        `Chord ${artist.name}`,
        songs.map((s) => `/chord/${s.slug}`),
      ),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Artis", href: "/artists" },
          { name: artist.name, href: path },
        ]}
      />

      <header className="panel" style={{ marginBottom: "var(--s5)" }}>
        <div className="row" style={{ alignItems: "flex-start", gap: "var(--s4)" }}>
          <span className="avatar avatar-lg" aria-hidden="true">
            <UserStar size={24} />
          </span>
          <div className="stack stack-2" style={{ flex: "1 1 260px", minWidth: 0 }}>
            <p className="eyebrow">Artis · {artist.country}</p>
            <h1 className="h-page">Chord {artist.name}</h1>
            <p className="small muted" style={{ maxWidth: "62ch" }}>
              {artist.bio}
            </p>
            <div className="row">
              {artist.genres.map((genre) => (
                <Link key={genre} className="badge" href={`/search?q=${encodeURIComponent(genre)}`}>
                  {genre}
                </Link>
              ))}
              <span className="badge badge-muted">{songs.length} lagu</span>
              <ShareButton title={`Chord ${artist.name}`} />
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="artist-songs">
        <div className="section-head">
          <h2 className="h-section" id="artist-songs">
            Semua lagu {artist.name}
          </h2>
          <span className="caption">Diurutkan berdasarkan popularitas</span>
        </div>

        {loading ? (
          <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Memuat lagu artis...</p>
        ) : songs.length === 0 ? (
          <div className="empty">Belum ada chord untuk artis ini.</div>
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
            Tidak menemukan lagu {artist.name} yang kamu cari?{" "}
            <Link href="/contact" style={{ color: "var(--accent)" }}>
              Kirim permintaan chord
            </Link>{" "}
            dan kami tambahkan ke antrean.
          </p>
        </div>
      </section>
    </main>
  );
}
