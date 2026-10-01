import { useEffect, useMemo, useRef, useState } from "react";
import ArtistCard from "../components/ArtistCard";
import Breadcrumb from "../components/Breadcrumb";
import type { Artist } from "../data/types";
import buildData from "../data/build-data.json";
import { getAllArtists } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { breadcrumbSchema, itemListSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

const PER_PAGE = 40;

/** jendela nomor halaman: 1 … 4 5 6 … 397 */
function pageWindow(cur: number, total: number): (number | "gap")[] {
  const wanted = [1, 2, cur - 1, cur, cur + 1, total - 1, total].filter((n) => n >= 1 && n <= total);
  const uniq = [...new Set(wanted)].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const n of uniq) {
    if (prev && n - prev > 1) out.push("gap");
    out.push(n);
    prev = n;
  }
  return out;
}

export default function ArtistsPage() {
  const { t } = useI18n();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState("ALL");
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    getAllArtists().then((a) => {
      setArtists(a);
      setLoading(false);
    });
  }, []);

  const letters = useMemo(
    () => ["ALL", ...Array.from(new Set(artists.map((a) => (a.name ? a.name[0].toUpperCase() : "")))).filter(Boolean).sort()],
    [artists],
  );

  const visible = useMemo(
    () => (letter === "ALL" ? artists : artists.filter((a) => a.name && a.name[0].toUpperCase() === letter)),
    [artists, letter],
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = visible.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const description = t("artistListDesc", artists.length, buildData.songCount || 0);

  const goTo = (p: number) => {
    setPage(p);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickLetter = (l: string) => {
    setLetter(l);
    setPage(1);
  };

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
        pageItems.map((a) => `/artist/${a.slug}`),
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
      </header>

      <div className="keylist" role="group" aria-label={t("artistListFilter")}>
        {letters.map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            aria-pressed={letter === item}
            onClick={() => pickLetter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="section" ref={resultsRef} aria-label={t("artistListResults")}>
        {loading ? (
          <p style={{ color: "var(--color-muted)", padding: "20px 0" }}>{t("artistListLoading")}</p>
        ) : pageItems.length === 0 ? (
          <div className="empty">{t("artistListEmpty")}</div>
        ) : (
          <div className="grid grid-auto">
            {pageItems.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <nav
            style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: "var(--s4)" }}
            aria-label={t("paginationLabel")}
          >
            <button type="button" className="chip" disabled={current === 1} onClick={() => goTo(current - 1)}>
              ← {t("prevPage")}
            </button>
            {pageWindow(current, totalPages).map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} style={{ alignSelf: "center", color: "var(--muted)" }} aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className="chip"
                  aria-pressed={p === current}
                  aria-label={t("pageN", p)}
                  onClick={() => goTo(p)}
                >
                  {p}
                </button>
              ),
            )}
            <button type="button" className="chip" disabled={current === totalPages} onClick={() => goTo(current + 1)}>
              {t("nextPage")} →
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
