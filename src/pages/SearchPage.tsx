import { useEffect, useMemo, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import Breadcrumb from "../components/Breadcrumb";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import { getGenres, getPopularSongs, searchCatalogue } from "../lib/api";
import { Link, navigate, useQueryParam } from "../lib/router";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function SearchPage() {
  const initialQuery = useQueryParam("q");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  /* Keep the URL shareable without spamming history entries. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search";
      if (next !== window.location.pathname + window.location.search) {
        navigate(next, { replace: true, scroll: false });
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [query]);

  const results = useMemo(() => searchCatalogue(query), [query]);
  const hasQuery = query.trim().length > 0;
  const total = results.songs.length + results.artists.length;

  const title = hasQuery
    ? `Hasil pencarian "${query.trim()}" | ${SITE.name}`
    : `Cari Chord Gitar & Artis | ${SITE.name}`;
  const description = hasQuery
    ? `${total} hasil untuk "${query.trim()}" — chord gitar lengkap dengan transpose dan auto scroll di ${SITE.name}.`
    : "Cari chord gitar berdasarkan judul lagu, nama artis, genre, atau chord yang digunakan.";

  useSeo({
    title,
    description,
    path: hasQuery ? `/search?q=${encodeURIComponent(query.trim())}` : "/search",
    noindex: hasQuery,
    jsonLd: [
      webPageSchema("Pencarian chord", description, "/search"),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Cari", href: "/search" },
      ]),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Cari", href: "/search" },
        ]}
      />

      <header className="stack stack-3" style={{ paddingBottom: "var(--s4)" }}>
        <h1 className="h-page">Cari chord</h1>
        <p className="small muted" style={{ maxWidth: "60ch" }}>
          Ketik judul lagu, nama artis, genre, atau chord (misal <span className="kbd">Am7</span>). Hasil
          diperbarui langsung saat mengetik.
        </p>
        <SearchBar initialValue={initialQuery} onQueryChange={setQuery} autoFocus size="lg" />
      </header>

      {!hasQuery && (
        <>
          <section className="section" aria-labelledby="browse-genre">
            <div className="section-head">
              <h2 className="h-section" id="browse-genre">
                Telusuri genre
              </h2>
            </div>
            <div className="keylist">
              {getGenres().map((genre) => (
                <button key={genre.slug} type="button" className="chip" onClick={() => setQuery(genre.name)}>
                  {genre.name}
                </button>
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="search-popular">
            <div className="section-head">
              <h2 className="h-section" id="search-popular">
                Paling sering dicari
              </h2>
            </div>
            <div className="grid grid-auto">
              {getPopularSongs(6).map((song, index) => (
                <SongCard key={song.id} song={song} index={index} />
              ))}
            </div>
          </section>
        </>
      )}

      {hasQuery && (
        <section className="section" aria-live="polite" aria-labelledby="results-heading">
          <div className="section-head">
            <h2 className="h-section" id="results-heading">
              {total} hasil untuk “{query.trim()}”
            </h2>
            {total > 0 && <span className="caption">Lagu {results.songs.length} · Artis {results.artists.length}</span>}
          </div>

          {total === 0 ? (
            <div className="empty">
              <p style={{ marginBottom: "var(--s2)" }}>Tidak ada hasil yang cocok.</p>
              <p className="caption">
                Coba kata kunci lain, atau <Link href="/artists">lihat daftar artis</Link>.
              </p>
            </div>
          ) : (
            <div className="stack stack-5">
              {results.songs.length > 0 && (
                <div>
                  <h3 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
                    Lagu
                  </h3>
                  <div className="grid grid-auto">
                    {results.songs.map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </div>
                </div>
              )}

              {results.artists.length > 0 && (
                <div>
                  <h3 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
                    Artis
                  </h3>
                  <div className="grid grid-auto">
                    {results.artists.map((artist) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
