import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import ChordDiagram from "../components/ChordDiagram";
import ChordViewer from "../components/ChordViewer";
import ShareButton from "../components/ShareButton";
import SongCard from "../components/SongCard";
import type { Song } from "../data/types";
import { formatDate, formatViews, getRelatedSongs } from "../lib/api";
import { keyPrefersFlat, parseSheet, transposeKey, transposeLines, uniqueChords } from "../lib/chords";
import { useAutoScroll, useShortcuts, useStoredState } from "../lib/hooks";
import { Link } from "../lib/router";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE, absoluteUrl } from "../lib/site";
import { Minus, Plus, Play, Pause } from "lucide-react";

function isoDuration(value?: string): string | undefined {
  if (!value) return undefined;
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  const [m, s] = parts.length === 2 ? parts : [0, parts[0]];
  return `PT${m}M${s}S`;
}

export default function ChordPage({ song }: { song: Song }) {
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useStoredState<number>("chordlab:font-size", 14);
  const [speed, setSpeed] = useStoredState<number>("chordlab:scroll-speed", 3);
  const [lyricsOnly, setLyricsOnly] = useState(false);
  const [related, setRelated] = useState<Song[]>([]);
  const { playing, toggle, stop } = useAutoScroll(speed);

  useEffect(() => {
    async function loadRelated() {
      const data = await getRelatedSongs(song, 5);
      setRelated(data);
    }
    loadRelated();
  }, [song]);

  const preferFlat = keyPrefersFlat(song.originalKey);
  const baseLines = useMemo(() => parseSheet(song.lyrics), [song.lyrics]);
  const lines = useMemo(
    () => transposeLines(baseLines, transpose, preferFlat),
    [baseLines, transpose, preferFlat],
  );
  const currentKey = transposeKey(song.originalKey, transpose, preferFlat);
  const chordList = useMemo(() => uniqueChords(lines), [lines]);
  const path = `/chord/${song.slug}`;

  useEffect(() => stop, [stop]);

  useShortcuts({
    "+": () => setTranspose((v) => Math.min(11, v + 1)),
    "=": () => setTranspose((v) => Math.min(11, v + 1)),
    "-": () => setTranspose((v) => Math.max(-11, v - 1)),
    "0": () => setTranspose(0),
    " ": toggle,
    "]": () => setFontSize((v) => Math.min(26, v + 1)),
    "[": () => setFontSize((v) => Math.max(12, v + 1)),
    l: () => setLyricsOnly((v) => !v),
  });

  const pageTitle = `Chord Gitar ${song.title} - ${song.artist} | ${SITE.name}`;
  const pageDescription = `Chord gitar ${song.title} — ${song.artist}. Kunci dasar ${song.originalKey}${
    song.capo ? `, capo fret ${song.capo}` : ", tanpa capo"
  }. Lengkap dengan lirik, transpose real-time, diagram chord, dan auto scroll.`;

  useSeo({
    title: pageTitle,
    description: pageDescription,
    path,
    type: "article",
    jsonLd: [
      webPageSchema(`Chord ${song.title} - ${song.artist}`, pageDescription, path),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: "Artis", href: "/artists" },
        { name: song.artist, href: `/artist/${song.artistSlug}` },
        { name: song.title, href: path },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        name: song.title,
        url: absoluteUrl(path),
        inLanguage: SITE.lang,
        genre: song.genre,
        ...(isoDuration(song.duration) ? { duration: isoDuration(song.duration) } : {}),
        byArtist: {
          "@type": "MusicGroup",
          name: song.artist,
          url: absoluteUrl(`/artist/${song.artistSlug}`),
        },
      },
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: "Artis", href: "/artists" },
          { name: song.artist, href: `/artist/${song.artistSlug}` },
          { name: song.title, href: path },
        ]}
      />

      <div className="chord-layout">
        <article>
          <header className="stack stack-3" style={{ paddingBottom: "var(--s4)" }}>
            <p className="eyebrow">Chord gitar · {song.genre}</p>
            <h1 className="h-page">
              Chord Gitar {song.title}
              <span className="muted" style={{ fontWeight: 400 }}>
                {" "}
                — {song.artist}
              </span>
            </h1>

            <div className="row">
              <span className="badge">Key {currentKey}</span>
              <span className="badge badge-muted">
                {song.capo ? `Capo fret ${song.capo}` : "Tanpa capo"}
              </span>
              {song.difficulty && <span className="badge badge-muted">{song.difficulty}</span>}
              {song.tempo && <span className="badge badge-muted">{song.tempo} BPM</span>}
              <Link className="badge badge-muted" href={`/artist/${song.artistSlug}`}>
                Semua lagu {song.artist} →
              </Link>
            </div>

            <div className="row">
              <ShareButton title={`Chord ${song.title} - ${song.artist}`} />
              <button
                type="button"
                className={lyricsOnly ? "btn btn-sm btn-on" : "btn btn-sm"}
                aria-pressed={lyricsOnly}
                onClick={() => setLyricsOnly((v) => !v)}
              >
                {lyricsOnly ? "Tampilkan chord" : "Lirik saja"}
              </button>
            </div>
          </header>

          <section aria-label={`Chord dan lirik ${song.title}`} style={{ paddingTop: "var(--s3)" }}>
            <ChordViewer lines={lines} fontSize={fontSize} lyricsOnly={lyricsOnly} />
          </section>

          <div className="toolbar" role="toolbar" aria-label="Kontrol pembaca chord">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--muted)" }}>FONT</span>
              <button
                type="button"
                className="btn btn-sm btn-icon"
                onClick={() => setFontSize((v) => Math.max(12, v - 1))}
                disabled={fontSize <= 12}
                style={{ display: "grid", placeItems: "center" }}
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-icon"
                onClick={() => setFontSize((v) => Math.min(26, v + 1))}
                disabled={fontSize >= 26}
                style={{ display: "grid", placeItems: "center" }}
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--chord-color)" }}>CHORDS</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", padding: "4px 8px" }}>
              {playing ? (
                <button
                  type="button"
                  onClick={toggle}
                  style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}
                >
                  <Pause size={13} strokeWidth={2.5} /> <span style={{ fontSize: "12px", fontWeight: 600 }}>AUTOSCROLL</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggle}
                  style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}
                >
                  <Play size={13} strokeWidth={2.5} /> <span style={{ fontSize: "12px", fontWeight: 600 }}>AUTOSCROLL</span>
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--muted)" }}>TRANSPOSE</span>
              <button
                type="button"
                className="btn btn-sm btn-icon"
                onClick={() => setTranspose((v) => Math.max(-11, v - 1))}
                disabled={transpose <= -11}
                style={{ display: "grid", placeItems: "center" }}
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", minWidth: "20px", textAlign: "center" }}>
                {currentKey}
                {transpose !== 0 && <span className="caption"> {transpose > 0 ? `+${transpose}` : transpose}</span>}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-icon"
                onClick={() => setTranspose((v) => Math.min(11, v + 1))}
                disabled={transpose >= 11}
                style={{ display: "grid", placeItems: "center" }}
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <p className="caption" style={{ marginTop: "var(--s4)" }}>
            Pintasan: <span className="kbd">+</span> / <span className="kbd">-</span> transpose ·{" "}
            <span className="kbd">0</span> reset · <span className="kbd">Space</span> auto scroll ·{" "}
            <span className="kbd">[</span> <span className="kbd">]</span> ukuran teks ·{" "}
            <span className="kbd">L</span> mode lirik.
          </p>

          <section className="section" aria-labelledby="related">
            <div className="section-head">
              <h2 className="h-section" id="related">
                Lagu terkait
              </h2>
              <Link className="small" href={`/artist/${song.artistSlug}`}>
                Lihat artis →
              </Link>
            </div>
            {related.length === 0 ? (
              <div className="empty">Belum ada lagu terkait.</div>
            ) : (
              <div className="grid grid-auto">
                {related.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            )}
          </section>
        </article>

        <aside className="sidebar" aria-label="Informasi lagu">
          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              Detail lagu
            </h2>
            <dl className="meta-list">
              <dt>Artis</dt>
              <dd>
                <Link href={`/artist/${song.artistSlug}`}>{song.artist}</Link>
              </dd>
              <dt>Kunci asli</dt>
              <dd>{song.originalKey}</dd>
              <dt>Kunci kini</dt>
              <dd className="accent">{currentKey}</dd>
              <dt>Capo</dt>
              <dd>{song.capo ? `Fret ${song.capo}` : "—"}</dd>
              {song.tuning && (
                <>
                  <dt>Tuning</dt>
                  <dd>{song.tuning}</dd>
                </>
              )}
              {song.strumming && (
                <>
                  <dt>Genjrengan</dt>
                  <dd>{song.strumming}</dd>
                </>
              )}
              {song.duration && (
                <>
                  <dt>Durasi</dt>
                  <dd>{song.duration}</dd>
                </>
              )}
              <dt>Genre</dt>
              <dd>
                <Link href={`/search?q=${encodeURIComponent(song.genre)}`}>{song.genre}</Link>
              </dd>
            </dl>
          </div>

          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              Chord yang dipakai ({chordList.length})
            </h2>
            <div className="keylist" style={{ marginBottom: "var(--s3)" }}>
              {chordList.map((chord) => (
                <span key={chord} className="badge">
                  {chord}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--s3)",
                overflowX: "auto",
                paddingBottom: "var(--s2)",
                scrollbarWidth: "thin",
              }}
            >
              {chordList.map((chord) => (
                <figure
                  key={chord}
                  style={{
                    margin: 0,
                    textAlign: "center",
                    flex: "0 0 110px",
                    background: "var(--surface-2)",
                    padding: "8px 4px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <ChordDiagram chord={chord} size={100} />
                  <figcaption className="caption" style={{ fontWeight: 600, marginTop: 4 }}>
                    {chord}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              Tips memainkan
            </h2>
            <ul className="stack stack-1 small" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>› Pakai transpose jika nada terlalu tinggi untuk suaramu.</li>
              <li>› Capo memudahkan chord barre menjadi bentuk terbuka.</li>
              <li>› Arahkan kursor atau ketuk chord untuk melihat diagramnya.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
