import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import ChordDiagram from "../components/ChordDiagram";
import ChordViewer from "../components/ChordViewer";
import ShareButton from "../components/ShareButton";
import SongCard from "../components/SongCard";
import type { Song } from "../data/types";
import { formatDate, formatViews, getPopularSongs, getRelatedSongs } from "../lib/api";
import { keyPrefersFlat, parseSheet, transposeKey, transposeLines, uniqueChords } from "../lib/chords";
import { useAutoScroll, useShortcuts, useStoredState } from "../lib/hooks";
import { Link } from "../lib/router";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE, absoluteUrl } from "../lib/site";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";

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
  const [popular, setPopular] = useState<Song[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { playing, toggle, stop } = useAutoScroll(speed);

  useEffect(() => {
    async function loadRelated() {
      const data = await getRelatedSongs(song, 5);
      setRelated(data);
    }
    loadRelated();
    getPopularSongs(10).then(setPopular);
  }, [song]);

  const preferFlat = keyPrefersFlat(song.originalKey);
  const baseLines = useMemo(() => parseSheet(song.lyrics || ""), [song.lyrics]);
  const lines = useMemo(
    () => transposeLines(baseLines, transpose, preferFlat) || [],
    [baseLines, transpose, preferFlat],
  );
  const currentKey = transposeKey(song.originalKey, transpose, preferFlat);
  const chordList = useMemo(() => uniqueChords(lines), [lines]);
  const path = `/chord/${song.slug}`;

  useEffect(() => stop, [stop]);

  useShortcuts({
    "+": () => setTranspose((v) => v >= 11 ? -11 : v + 1),
    "=": () => setTranspose((v) => v >= 11 ? -11 : v + 1),
    "-": () => setTranspose((v) => v <= -11 ? 11 : v - 1),
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
                {lyricsOnly ? "Mode Chord" : "Mode Lirik"}
              </button>
              <button
                type="button"
                className={playing ? "btn btn-sm btn-on" : "btn btn-sm"}
                onClick={() => setSettingsOpen(true)}
              >
                {playing ? "Pause" : "Auto Scroll"}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setTranspose((v) => v <= -11 ? 11 : v - 1)}
              >
                <ChevronDown size={14} />
              </button>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>
                {currentKey}
              </span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setTranspose((v) => v >= 11 ? -11 : v + 1)}
              >
                <ChevronUp size={14} />
              </button>
            </div>
          </header>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: "var(--s2)" }}>
            {chordList.map((chord) => (
              <div key={chord} style={{ flex: "0 0 auto", textAlign: "center" }}>
                <ChordDiagram chord={chord} size={60} />
                <span className="caption" style={{ fontSize: 9, fontWeight: 600 }}>{chord}</span>
              </div>
            ))}
          </div>

          <section aria-label={`Chord dan lirik ${song.title}`} style={{ paddingTop: "var(--s3)" }}>
            <ChordViewer
              lines={lines}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              lyricsOnly={lyricsOnly}
              playing={playing}
              speed={speed}
              onToggle={toggle}
              onSpeedChange={setSpeed}
              transpose={transpose}
              onTransposeChange={setTranspose}
              currentKey={currentKey}
            />
          </section>

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
              Chord Populer
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {popular.filter((s) => s.id !== song.id).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/chord/${s.slug}`}
                    style={{ fontSize: 12, color: "var(--foreground)", textDecoration: "none" }}
                  >
                    {s.title} — {s.artist}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 50 }}>
        {settingsOpen && (
          <div
            className="settings-panel"
            style={{
              position: "absolute",
              bottom: 48,
              right: 0,
              padding: "8px",
              width: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          >
            <span className="caption" style={{ fontSize: 9, fontWeight: 600 }}>speed</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              {[5, 4, 3, 2, 1].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`btn btn-sm${speed === lvl ? " btn-on" : ""}`}
                  onClick={() => { setSpeed(lvl); if (!playing) toggle(); }}
                  style={{ width: "100%", minHeight: 24, padding: "2px 0", fontSize: 10 }}
                >
                  {lvl}
                </button>
              ))}
            </div>
            {playing && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={toggle}
                style={{ width: "100%", minHeight: 24, padding: "2px 0", fontSize: 9, color: "#ff6b6b" }}
              >
                stop
              </button>
            )}
            <div style={{ width: "100%", borderTop: "1px solid var(--border)", margin: "2px 0" }} />
            <span className="caption" style={{ fontSize: 9, fontWeight: 600 }}>font</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setFontSize((v) => Math.min(26, v + 1))}
              disabled={fontSize >= 26}
              style={{ width: "100%", minHeight: 24, padding: "2px 0", fontSize: 13, fontWeight: 700 }}
            >
              +
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setFontSize((v) => Math.max(12, v - 1))}
              disabled={fontSize <= 12}
              style={{ width: "100%", minHeight: 24, padding: "2px 0", fontSize: 13, fontWeight: 700 }}
            >
              −
            </button>
            <span className="caption" style={{ fontSize: 9 }}>{fontSize}px</span>
          </div>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Pengaturan tampilan"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            padding: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,.3)",
          }}
        >
          <Settings size={18} />
        </button>
      </div>

    </main>
  );
}
