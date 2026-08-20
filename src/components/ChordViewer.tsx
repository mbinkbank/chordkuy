import { useEffect, useRef, useState, useCallback } from "react";
import type { SheetLine } from "../lib/chords";
import ChordDiagram from "./ChordDiagram";
import { Minus, Plus, Play, Pause } from "lucide-react";

interface ChordViewerProps {
  lines: SheetLine[];
  fontSize: number;
  onFontSizeChange: (v: number) => void;
  lyricsOnly?: boolean;
  // Toolbar props
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onSpeedChange: (v: number) => void;
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
  onFontSizeChange,
  lyricsOnly = false,
  playing,
  speed,
  onToggle,
  onSpeedChange,
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

        {/* Toolbar - sticky inside sheet */}
        <div className="sheet-toolbar">
          {/* Font size group */}
          <div className="tb-group-split">
            <button type="button" className="tb-btn-split" onClick={() => onFontSizeChange(Math.max(12, fontSize - 1))} aria-label="Perkecil teks">
              <Minus size={16} strokeWidth={2} />
            </button>
            <div className="tb-divider" />
            <button type="button" className="tb-btn-split" onClick={() => onFontSizeChange(Math.min(26, fontSize + 1))} aria-label="Perbesar teks">
              <Plus size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Autoscroll */}
          <button
            type="button"
            className={`tb-btn-autoscroll ${playing ? "active" : ""}`}
            onClick={onToggle}
            aria-pressed={playing}
          >
            <Play size={16} strokeWidth={2.5} />
            <span>AUTOSCROLL</span>
          </button>

          {/* Autoscroll speed panel (shown when playing) */}
          {playing && (
            <div className="tb-speed-panel">
              <div className="tb-speed-bar">
                <div
                  className="tb-speed-fill"
                  style={{ width: `${((speed - 1) / 9) * 100}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={speed}
                  onChange={(e) => onSpeedChange(Number(e.target.value))}
                  className="tb-speed-input"
                />
              </div>
              <span className="tb-speed-value">x{speed}</span>
              <button type="button" className="tb-btn-split" onClick={onToggle} aria-label="Tutup pengaturan scroll">
                <Minus size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          {/* Transpose group */}
          <div className="tb-group-split">
            <button
              type="button"
              className="tb-btn-split"
              onClick={() => onTransposeChange(Math.max(-11, transpose - 1))}
              disabled={transpose <= -11}
              aria-label="Turunkan nada"
            >
              <Minus size={16} strokeWidth={2} />
            </button>
            <div className="tb-divider" />
            <button type="button" className="tb-btn-split tb-key-dropdown">
              <span className="tb-key-text">{currentKey}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="tb-divider" />
            <button
              type="button"
              className="tb-btn-split"
              onClick={() => onTransposeChange(Math.min(11, transpose + 1))}
              disabled={transpose >= 11}
              aria-label="Naikkan nada"
            >
              <Plus size={16} strokeWidth={2} />
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
