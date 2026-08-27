import { useEffect, useMemo, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import Breadcrumb from "../components/Breadcrumb";
import type { Artist } from "../data/types";
import { getAllArtists, getAllSongs } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { breadcrumbSchema, itemListSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function ArtistsPage() {
  const { t } = useI18n();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songCount, setSongCount] = useState<number>(0);
  const [letter, setLetter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtists() {
      const [artData, songData] = await Promise.all([
        getAllArtists(),
        getAllSongs(),
      ]);
      setArtists(artData);
      setSongCount(songData.length);
      setLoading(false);
    }
    loadArtists();
  }, []);

  const letters = useMemo(
    () => ["ALL", ...Array.from(new Set(artists.map((a) => (a.name ? a.name[0].toUpperCase() : "")))).filter(Boolean).sort()],
    [artists],
  );

  const visible = letter === "ALL" ? artists : artists.filter((a) => a.name && a.name[0].toUpperCase() === letter);
  const description = t("artistListDesc", artists.length, songCount);

  useSeo({
    title: `${t("artistList")} (${artists.length}) | ${SITE.name}`,
    description,
    path: "/artists",
    jsonLd: [
      webPageSchema(t("artistList"), description, "/artists"),
      breadcrumbSchema([
        { name: t("home"), href: "/" },
        { name: t("navArtists"), href: "/artists" },
      ]),
      itemListSchema(
        t("artistList"),
        artists.map((a) => `/artist/${a.slug}`),
      ),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: t("home"), href: "/" },
          { name: t("navArtists"), href: "/artists" },
        ]}
      />

      <header className="stack stack-2" style={{ paddingBottom: "var(--s4)" }}>
        <h1 className="h-page">{t("artistList")}</h1>
        <p className="small muted" style={{ maxWidth: "60ch" }}>
          {t("artistListDesc", artists.length, songCount)}
        </p>
      </header>

      <div className="keylist" role="group" aria-label={t("artistListFilter")}>
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

      <section className="section" aria-label={t("artistListResults")}>
        {loading ? (
          <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>{t("artistListLoading")}</p>
        ) : visible.length === 0 ? (
          <div className="empty">{t("artistListEmpty")}</div>
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
