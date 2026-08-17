import { useMemo, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import Breadcrumb from "../components/Breadcrumb";
import { getAllArtists, getSongsByArtist } from "../lib/api";
import { breadcrumbSchema, itemListSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function ArtistsPage() {
  const artists = getAllArtists();
  const [letter, setLetter] = useState<string>("ALL");

  const letters = useMemo(
    () => ["ALL", ...Array.from(new Set(artists.map((a) => a.name[0].toUpperCase()))).sort()],
    [artists],
  );

  const visible = letter === "ALL" ? artists : artists.filter((a) => a.name[0].toUpperCase() === letter);
  const totalSongs = artists.reduce((sum, a) => sum + getSongsByArtist(a.slug).length, 0);
  const description = `Daftar ${artists.length} artis dengan ${totalSongs} chord gitar lengkap di ${SITE.name}. Telusuri berdasarkan abjad.`;

  useSeo({
    title: `Daftar Artis Chord Gitar (${artists.length}) | ${SITE.name}`,
    description,
    path: "/artists",
    jsonLd: [
      webPageSchema("Daftar Artis", description, "/artists"),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Artis", href: "/artists" },
      ]),
      itemListSchema(
        "Daftar artis",
        artists.map((a) => `/artist/${a.slug}`),
      ),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Artis", href: "/artists" },
        ]}
      />

      <header className="stack stack-2" style={{ paddingBottom: "var(--s4)" }}>
        <h1 className="h-page">Daftar artis</h1>
        <p className="small muted" style={{ maxWidth: "60ch" }}>
          {artists.length} artis · {totalSongs} lagu. Pilih artis untuk melihat seluruh chord yang tersedia.
        </p>
      </header>

      <div className="keylist" role="group" aria-label="Filter abjad">
        {letters.map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            aria-pressed={letter === item}
            onClick={() => setLetter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="section" aria-label="Hasil daftar artis">
        {visible.length === 0 ? (
          <div className="empty">Tidak ada artis pada huruf ini.</div>
        ) : (
          <div className="grid grid-auto">
            {visible.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
