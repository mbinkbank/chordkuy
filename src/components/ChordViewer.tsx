import { useEffect, useRef, useState, useCallback } from "react";
import type { SheetLine } from "../lib/chords";
import ChordDiagram from "./ChordDiagram";
import { Minus, Plus, Play, Pause } from "lucide-react";

interface ChordViewerProps {
  lines: SheetLine[];
  fontSize: number;
  lyricsOnly?: boolean;
  // Toolbar props
  playing: boolean;
  onToggle: () => void;
  transpose: number;
  onTransposeChange: (v: number) => void;
  currentKey: string;
}

interface PopoverState {
  chord: string;
  x: number;
  y: number;
  pinned: boolean;
}

const POPOVER_WIDTH = 148;

export default function ChordViewer({
  lines,
  fontSize,
  lyricsOnly = false,
  playing,
  onToggle,
  transpose,
  onTransposeChange,
  currentKey,
}: ChordViewerProps) {
  const [pop, setPop] = useState<PopoverState | null>(null);
  const hoverTimer = useRef<number | null>(null);

  const clearTimer = () => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const openFor = useCallback((target: HTMLElement, chord: string, pinned: boolean) => {
    const rect = target.getBoundingClientRect();
    const x = Math.min(
      Math.max(rect.left + rect.width / 2 - POPOVER_WIDTH / 2, 8),
      window.innerWidth - POPOVER_WIDTH - 8,
    );
    const below = rect.bottom + 8;
    const flip = below + 190 > window.innerHeight;
    const y = flip ? Math.max(rect.top - 196, 8) : below;
    setPop({ chord, x, y, pinned });
  }, []);

  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
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
        {lines.map((line, i) => {
          if (line.type === "blank") {
            return <div key={i} className="line-blank" aria-hidden="true" />;
          }

          if (line.type === "section") {
            return (
              <h3 key={i} className="section-label">
                {line.label}
              </h3>
            );
          }

          return (
            <div key={i} className="line">
              {line.segments.map((seg, j) => {
                if (seg.chord) {
                  return (
                    <button
                      key={j}
                      type="button"
                      className="ch-inline"
                      aria-label={`Chord ${seg.chord}. Tampilkan diagram`}
                      aria-expanded={pop?.chord === seg.chord && pop.pinned}
                      onMouseEnter={(e) => {
                        clearTimer();
                        if (!pop?.pinned) openFor(e.currentTarget, seg.chord!, false);
                      }}
                      onMouseLeave={() => {
                        clearTimer();
                        hoverTimer.current = window.setTimeout(() => {
                          setPop((p) => (p?.pinned ? p : null));
                        }, 120);
                      }}
                      onFocus={(e) => openFor(e.currentTarget, seg.chord!, false)}
                      onBlur={() => setPop((p) => (p?.pinned ? p : null))}
                      onClick={(e) => {
                        if (pop?.chord === seg.chord && pop.pinned) {
                          setPop(null);
                        } else {
                          openFor(e.currentTarget, seg.chord!, true);
                        }
                      }}
                    >
                      {seg.chord}
                    </button>
                  );
                }

                return (
                  <span key={j} className="text-inline">
                    {seg.text}
                  </span>
                );
              })}
            </div>
          );
        })}

        {/* Toolbar - rendered OUTSIDE sheet for sticky to work */}
        <div className="sheet-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
            <span className="sheet-toolbar-lbl">FONT</span>
            <button type="button" className="btn btn-sm btn-icon" style={{ display: "grid", placeItems: "center" }}>
              <Minus size={12} strokeWidth={2.5} />
            </button>
            <button type="button" className="btn btn-sm btn-icon" style={{ display: "grid", placeItems: "center" }}>
              <Plus size={12} strokeWidth={2.5} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
            <span className="sheet-toolbar-lbl sheet-toolbar-chords">CHORDS</span>
          </div>

          <div className="sheet-toolbar-autoscroll">
            <button type="button" onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}>
              {playing ? <Pause size={13} strokeWidth={2.5} /> : <Play size={13} strokeWidth={2.5} />}
              <span>AUTOSCROLL</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
            <span className="sheet-toolbar-lbl">TRANSPOSE</span>
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={() => onTransposeChange(Math.max(-11, transpose - 1))}
              disabled={transpose <= -11}
              style={{ display: "grid", placeItems: "center" }}
            >
              <Minus size={12} strokeWidth={2.5} />
            </button>
            <span className="sheet-toolbar-key">
              {currentKey}
              {transpose !== 0 && <span className="sheet-toolbar-offset"> {transpose > 0 ? `+${transpose}` : transpose}</span>}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={() => onTransposeChange(Math.min(11, transpose + 1))}
              disabled={transpose >= 11}
              style={{ display: "grid", placeItems: "center" }}
            >
              <Plus size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {pop && (
        <div
          className="chord-pop"
          role="dialog"
          aria-label={`Diagram chord ${pop.chord}`}
          style={{ left: pop.x, top: pop.y }}
          onMouseEnter={clearTimer}
          onMouseLeave={() => setPop((p) => (p?.pinned ? p : null))}
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
