import { useEffect, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import { ListMusic } from "lucide-react";
import type { Artist, Song } from "../data/types";
import buildData from "../data/build-data.json";
import {
  formatDate,
  getRecentSongsPage,
  mapDbRowToSong,
  RECENT_PER_PAGE,
} from "../lib/api";
import { Link, useRoute } from "../lib/router";
import { organizationSchema, useSeo, webPageSchema, websiteSchema } from "../lib/seo";
import { SITE } from "../lib/site";

const BAKED_POPULAR: Song[] = (buildData.popularRows as any[]).map(mapDbRowToSong);
const BAKED_ARTISTS: Artist[] = ((buildData.artistNames as string[]) || []).map((name) => ({
  id: name,
  name,
  slug: name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, ""),
  bio: `Kumpulan chord gitar dari ${name}.`,
  country: "Indonesia",
  genres: ["Pop"],
  thumbnail: null,
  createdAt: new Date().toISOString(),
}));
const BAKED_RECENT: Song[] = (buildData.recentRows as any[]).map(mapDbRowToSong);

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter((p) => p >= 1 && p <= total),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

const pageHref = (p: number) => (p <= 1 ? "/" : `/?page=${p}`);

export default function HomePage() {
  const route = useRoute();
  const pageParam = parseInt(new URLSearchParams(route.search).get("page") || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const [popular] = useState<Song[]>(BAKED_POPULAR);
  const [artists] = useState<Artist[]>(BAKED_ARTISTS);
  const [recent, setRecent] = useState<Song[]>(page === 1 ? BAKED_RECENT : []);
  const [recentTotal, setRecentTotal] = useState<number>(buildData.songCount);
  const [loadingRecent, setLoadingRecent] = useState(page !== 1);

  useEffect(() => {
    if (page === 1) {
      setRecent(BAKED_RECENT);
      setRecentTotal(buildData.songCount);
      setLoadingRecent(false);
      return;
    }
    let cancelled = false;
    setLoadingRecent(true);
    getRecentSongsPage(page)
      .then(({ songs, total }) => {
        if (cancelled) return;
        setRecent(songs || []);
        setRecentTotal(total || 0);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(recentTotal / RECENT_PER_PAGE));

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
        <div className="hero-aurora" aria-hidden="true">
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <span className="blob blob-c" />
        </div>
        <div className="eq-bars" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              style={{
                animationDelay: `${((i * 13) % 17) * -0.11}s`,
                animationDuration: `${0.8 + ((i * 7) % 11) / 12}s`,
              }}
            />
          ))}
        </div>
        <div className="container text-center" style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="stack stack-4" style={{ alignItems: "center" }}>
            <h1 className="h-display" style={{ textAlign: "center" }}>
              Chord gitar yang bersih, mudah, cepat, dan enak dibaca.
            </h1>

            <div style={{ width: "100%" }}>
              <SearchBar size="lg" placeholder="Cari judul lagu atau nama artis…" />
            </div>

            <div className="row" style={{ justifyContent: "center" }}>
              <span className="caption">Populer:</span>
              {["Oasis", "Dewa 19", "Green Day", "Slank"].map((term) => (
                <Link key={term} className="chip" href={`/search?q=${encodeURIComponent(term)}`}>
                  {term}
                </Link>
              ))}
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
          {popular.length === 0 ? (
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
          <div className="grid grid-auto">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>

        <section className="container section" aria-labelledby="recent">
          <div className="section-head">
            <h2 className="h-section" id="recent">
              Baru Ditambahkan
            </h2>
            {recentTotal > 0 && (
              <span className="caption">
                {recentTotal} lagu · halaman {page} dari {totalPages}
              </span>
            )}
          </div>
          {loadingRecent ? (
            <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Memuat lagu baru...</p>
          ) : recent.length === 0 ? (
            <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Belum ada lagu tersedia.</p>
          ) : (
            <>
              <div className="list-rows">
                {recent.map((song) => (
                  <Link key={song.id} className="card song-card" href={`/chord/${song.slug}`}>
                    <span className="thumb" aria-hidden="true">
                      <ListMusic size={18} />
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
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Navigasi halaman Baru Ditambahkan">
                  {page > 1 && (
                    <Link className="btn btn-sm" href={pageHref(page - 1)}>
                      ‹ Sebelumnya
                    </Link>
                  )}
                  {pageNumbers(page, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="pagination-ellipsis">
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        className={`btn btn-sm${p === page ? " btn-on" : ""}`}
                        href={pageHref(p)}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </Link>
                    ),
                  )}
                  {page < totalPages && (
                    <Link className="btn btn-sm" href={pageHref(page + 1)}>
                      Berikutnya ›
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
