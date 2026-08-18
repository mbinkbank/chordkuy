import { useEffect, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import Breadcrumb from "../components/Breadcrumb";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import type { Song, Artist } from "../data/types";
import { searchCatalogue } from "../lib/api";
import { navigate, useQueryParam } from "../lib/router";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function SearchPage() {
  const initialQuery = useQueryParam("q");
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{ songs: Song[]; artists: Artist[] }>({ songs: [], artists: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search";
      if (next !== window.location.pathname + window.location.search) {
        navigate(next, { replace: true, scroll: false });
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults({ songs: [], artists: [] });
        return;
      }
      setLoading(true);
      const res = await searchCatalogue(query);
      setResults(res);
      setLoading(false);
    }
    performSearch();
  }, [query]);

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

      <section className="section stack stack-4" style={{ paddingTop: "var(--s3)" }}>
        <header className="stack stack-2">
          <h1 className="h-display" style={{ fontSize: "clamp(24px, 4vw, 36px)" }}>
            {hasQuery ? `Hasil untuk "${query.trim()}"` : "Cari Chord & Artis"}
          </h1>
          <p className="lead" style={{ fontSize: "15px" }}>
            Ketik nama artis atau judul lagu yang ingin kamu cari.
          </p>
        </header>

        <SearchBar
          size="lg"
          defaultValue={query}
          onInput={setQuery}
          placeholder="Cari lagu, artis, atau chord..."
        />

        {loading ? (
          <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Mencari di database...</p>
        ) : !hasQuery ? (
          <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>Ketik kata kunci untuk memulai pencarian.</p>
        ) : total === 0 ? (
          <div className="card text-center stack stack-2" style={{ padding: "var(--s6) var(--s4)" }}>
            <p className="lead">Tidak ditemukan hasil untuk "{query.trim()}"</p>
            <p className="caption">Coba kata kunci lain atau periksa ejaanmu.</p>
          </div>
        ) : (
          <div className="stack stack-6">
            {results.artists.length > 0 && (
              <section className="stack stack-3">
                <h2 className="h-section">Artis ({results.artists.length})</h2>
                <div className="grid grid-auto">
                  {results.artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {results.songs.length > 0 && (
              <section className="stack stack-3">
                <h2 className="h-section">Lagu ({results.songs.length})</h2>
                <div className="grid grid-auto">
                  {results.songs.map((song, index) => (
                    <SongCard key={song.id} song={song} index={index} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
