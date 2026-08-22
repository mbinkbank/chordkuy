import { useEffect, useRef, useState, useCallback } from "react";
import type { SheetLine } from "../lib/chords";
import ChordDiagram from "./ChordDiagram";
import { ChevronRight } from "lucide-react";

interface ChordViewerProps {
  lines: SheetLine[];
  fontSize: number;
  onFontSizeChange: (v: number) => void;
  lyricsOnly?: boolean;
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
  const [collapsed, setCollapsed] = useState<Set<number> | null>(null);
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

  const hasLyricText = (line: SheetLine) =>
    line.type === "line" && line.segments.some((s) => s.text.trim() !== "");

  const isChordOnly = (line: SheetLine) =>
    line.type === "line" && !hasLyricText(line);

  const isOriginalChord = (label: string) => /^original\s+chord$/i.test(label.trim());

  const filteredLines = (lines || []).filter((line) => {
    if (!lyricsOnly) return true;
    if (line.type === "blank") return false;
    if (line.type !== "line") return true;
    return hasLyricText(line);
  });

  // Section content: chord-only lines right after a section-label, until lyrics/blank/next section.
  const sectionContent = new Map<number, number[]>();
  const lastSectionContent = new Set<number>();
  let activeSection = -1;
  let skipSectionEnd = false;
  let lastChordIdx = -1;
  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];

    if (line.type === "section") {
      if (lastChordIdx >= 0 && !skipSectionEnd) lastSectionContent.add(lastChordIdx);
      activeSection = i;
      skipSectionEnd = /^reff\b/i.test(line.label.trim());
      sectionContent.set(i, []);
      lastChordIdx = -1;
    } else if (line.type === "blank" || hasLyricText(line)) {
      if (lastChordIdx >= 0 && !skipSectionEnd) lastSectionContent.add(lastChordIdx);
      activeSection = -1;
      skipSectionEnd = false;
      lastChordIdx = -1;
    } else if (activeSection >= 0 && isChordOnly(line)) {
      sectionContent.get(activeSection)!.push(i);
      lastChordIdx = i;
    } else {
      if (lastChordIdx >= 0 && !skipSectionEnd) lastSectionContent.add(lastChordIdx);
      activeSection = -1;
      skipSectionEnd = false;
      lastChordIdx = -1;
    }
  }
  if (lastChordIdx >= 0 && !skipSectionEnd) lastSectionContent.add(lastChordIdx);

  // Default: ORIGINAL CHORD sections start collapsed
  const effectiveCollapsed = (() => {
    if (collapsed) return collapsed;
    const init = new Set<number>();
    for (let i = 0; i < filteredLines.length; i++) {
      const line = filteredLines[i];
      if (line.type === "section" && isOriginalChord(line.label)) init.add(i);
    }
    return init;
  })();

  const hiddenBySection = new Set<number>();
  for (const [sectionIdx, contentIdxs] of sectionContent) {
    if (!effectiveCollapsed.has(sectionIdx)) continue;
    for (const idx of contentIdxs) hiddenBySection.add(idx);
  }

  const toggleSection = (sectionIndex: number) => {
    setCollapsed(() => {
      const next = new Set(effectiveCollapsed);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  };

  return (
    <>
      <div
        className={`sheet${lyricsOnly ? " sheet-plain" : ""}`}
        style={{ ["--sheet-size" as string]: `${fontSize}px` }}
        data-chord-sheet=""
      >
        {filteredLines.map((line, i) => {
          if (hiddenBySection.has(i)) return null;
          if (line.type === "blank") return null;
          if (line.type === "section") {
            if (isOriginalChord(line.label)) {
              const isCollapsed = effectiveCollapsed.has(i);
              return (
                <h3
                  key={i}
                  className="section-label"
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleSection(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSection(i);
                    }
                  }}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <ChevronRight
                    size={12}
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginRight: 4,
                      transition: "transform 0.15s",
                      transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                    }}
                  />
                  {line.label}
                </h3>
              );
            }
            return (
              <h3 key={i} className="section-label">
                {line.label}
              </h3>
            );
          }

          return (
            <div key={i} className={`line${lastSectionContent.has(i) ? " section-end" : ""}`}>
              {line.segments.map((seg, j) => {
                if (lyricsOnly && seg.chord) return null;
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

        {/* Toolbar removed - now in ChordPage header */}
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
