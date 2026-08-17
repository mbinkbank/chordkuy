import { useCallback, useEffect, useRef, useState } from "react";
import type { SheetLine } from "../lib/chords";
import ChordDiagram from "./ChordDiagram";

interface PopState {
  chord: string;
  x: number;
  y: number;
  pinned: boolean;
}

interface Props {
  lines: SheetLine[];
  fontSize: number;
  /** Hide chords for lyric-only reading. */
  lyricsOnly?: boolean;
}

const POP_W = 148;

/**
 * Semantic chord sheet.
 * Chords sit above the syllable they belong to using inline-block segments,
 * so the sheet never breaks alignment and reflows cleanly on mobile.
 * Every chord is a real <button>: hover on desktop, tap on touch, focusable
 * with the keyboard, dismissable with Escape.
 */
export default function ChordViewer({ lines, fontSize, lyricsOnly = false }: Props) {
  const [pop, setPop] = useState<PopState | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clearTimer = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const place = useCallback((el: HTMLElement, chord: string, pinned: boolean) => {
    const rect = el.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2 - POP_W / 2, 8), window.innerWidth - POP_W - 8);
    const below = rect.bottom + 8;
    const useAbove = below + 190 > window.innerHeight;
    setPop({ chord, x: left, y: useAbove ? Math.max(rect.top - 196, 8) : below, pinned });
  }, []);

  useEffect(() => {
    if (!pop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPop(null);
    };
    const onScroll = () => setPop(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pop]);

  useEffect(() => () => clearTimer(), []);

  return (
    <>
      <div
        className={`sheet${lyricsOnly ? " sheet-plain" : ""}`}
        style={{ ["--sheet-size" as string]: `${fontSize}px` }}
        data-chord-sheet=""
      >
        {lines.map((line, index) => {
          if (line.type === "blank") return <div key={index} className="line-blank" aria-hidden="true" />;
          if (line.type === "section")
            return (
              <h3 key={index} className="section-label">
                {line.label}
              </h3>
            );

          return (
            <p key={index} className="line">
              {line.segments.map((seg, i) => (
                <span className="seg" key={i}>
                  {seg.chord ? (
                    <button
                      type="button"
                      className="ch"
                      aria-label={`Chord ${seg.chord}. Tampilkan diagram`}
                      aria-expanded={pop?.chord === seg.chord && pop.pinned}
                      onMouseEnter={(event) => {
                        clearTimer();
                        if (!pop?.pinned) place(event.currentTarget, seg.chord!, false);
                      }}
                      onMouseLeave={() => {
                        clearTimer();
                        hideTimer.current = window.setTimeout(() => {
                          setPop((current) => (current?.pinned ? current : null));
                        }, 120);
                      }}
                      onFocus={(event) => place(event.currentTarget, seg.chord!, false)}
                      onBlur={() => setPop((current) => (current?.pinned ? current : null))}
                      onClick={(event) => {
                        const same = pop?.chord === seg.chord && pop.pinned;
                        if (same) setPop(null);
                        else place(event.currentTarget, seg.chord!, true);
                      }}
                    >
                      {seg.chord}
                    </button>
                  ) : (
                    <span className="ch ch-empty" aria-hidden="true">
                      {"\u00a0"}
                    </span>
                  )}
                  <span className="lyr">{seg.text || "\u00a0"}</span>
                </span>
              ))}
            </p>
          );
        })}
      </div>

      {pop && (
        <div
          className="chord-pop"
          role="dialog"
          aria-label={`Diagram chord ${pop.chord}`}
          style={{ left: pop.x, top: pop.y }}
          onMouseEnter={clearTimer}
          onMouseLeave={() => setPop((current) => (current?.pinned ? current : null))}
        >
          <p className="pop-name">
            <span>{pop.chord}</span>
            {pop.pinned && (
              <button type="button" className="pop-close" onClick={() => setPop(null)} aria-label="Tutup diagram">
                ✕
              </button>
            )}
          </p>
          <ChordDiagram chord={pop.chord} />
        </div>
      )}
    </>
  );
}
