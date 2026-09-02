import { useEffect, useRef, useState, useCallback } from "react";
import type { SheetLine } from "../lib/chords";
import { useI18n } from "../lib/i18n";
import ChordDiagram from "./ChordDiagram";
import { Copy, Check } from "lucide-react";

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
  title: string;
  artist: string;
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
  title,
  artist,
}: ChordViewerProps) {
  const { t } = useI18n();
  const [pop, setPop] = useState<PopoverState | null>(null);
  const [copied, setCopied] = useState(false);

  const copyChordContent = async () => {
    const sheet = document.querySelector("[data-chord-sheet]");
    const family = document.querySelector("[data-chord-family]");
    const used = document.querySelector("[data-used-chords]");
    const mono = `font-family: monospace, 'Courier New', monospace; white-space: pre;`;
    const style = `font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4;`;
    const familyText = family?.textContent?.replace(/\n/g, "  ");
    const usedText = used?.textContent?.replace(/\n/g, "  ");
    const sheetText = sheet?.textContent;
    const text = [
      `${title} - ${artist}`,
      `Key: ${currentKey}`,
      familyText && `Chord Family: ${familyText}`,
      usedText && `Chords Used: ${usedText}`,
      sheetText,
    ].filter(Boolean).join("\n\n");
    const familyHtml = family?.outerHTML
      ? `<div style="${mono}margin: 6px 0;">${family.innerHTML.replace(/<div/g, "<span").replace(/<\/div>/g, "</span>")}</div>`
      : "";
    const usedHtml = used?.outerHTML
      ? `<div style="${mono}margin: 6px 0;">${used.innerHTML.replace(/<div/g, "<span").replace(/<\/div>/g, "</span>")}</div>`
      : "";
    const sheetHtml = sheet?.outerHTML ? `<div style="${mono}">${sheet.innerHTML}</div>` : "";
    const html = `<div style="${style}"><strong style="font-size: 14px;">${title} - ${artist}</strong><div style="${mono}">Key: ${currentKey}</div>${familyHtml}${usedHtml}${sheetHtml}</div>`;
    if (sheet) {
      try {
        const CI = (window as any).ClipboardItem;
        if (typeof CI !== "undefined") {
          const item = new CI({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) });
          await navigator.clipboard.write([item] as any);
        } else {
          await navigator.clipboard.writeText(text);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        setCopied(false);
      }
    }
  };
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
    line.type === "line" && line.segments.some((s) => {
      if (!s.text) return false;
      const t = s.text.trim();
      if (!t) return false;
      if (/^\(\d+x?\)$/i.test(t)) return false;
      return true;
    });

  const isOriginalChord = (label: string) => /^original\s+chord$/i.test(label.trim());

  const filteredLines = (lines || []).filter((line) => {
    if (!lyricsOnly) return true;
    if (line.type === "blank") return false;
    if (line.type !== "line") return true;
    return hasLyricText(line);
  });



  return (
    <>
      <div data-chord-copy-wrap style={{ position: "relative" }}>
        <button
          type="button"
          className="btn btn-sm btn-icon"
          onClick={copyChordContent}
          title="Salin chord beserta kunci, family chord, dan chord yang digunakan"
          aria-label="Salin chord"
          style={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>

        <div
          className={`sheet${lyricsOnly ? " sheet-plain" : ""}`}
          style={{ ["--sheet-size" as string]: `${fontSize}px` }}
          data-chord-sheet=""
        >
        {filteredLines.map((line, i) => {
          if (line.type === "blank") return <div key={i} className="blank-line" />;
          if (line.type === "section") {
            const displayLabel = isOriginalChord(line.label) ? "--- ORIGINAL CHORD ---" : line.label;
            return (
              <h3
                key={i}
                className="section-label"
                style={isOriginalChord(line.label) ? { textAlign: "center" } : undefined}
              >
                {displayLabel}
              </h3>
            );
          }

          return (
            <div key={i} className="line">
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
              <button type="button" className="pop-close" onClick={() => setPop(null)} aria-label={t("closeDiagram")}>
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
