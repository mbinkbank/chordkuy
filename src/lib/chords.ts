/**
 * Chord engine supporting standard chords-above-lyrics sheets and bracketed chords.
 */

export const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const BASE_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"]);

export function keyPrefersFlat(key: string): boolean {
  return FLAT_KEYS.has(key.trim());
}

export function noteToPitchClass(note: string): number | null {
  const m = /^([A-G])([#b]?)/.exec(note);
  if (!m) return null;
  let pc = BASE_PC[m[1]];
  if (m[2] === "#") pc += 1;
  if (m[2] === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

export function pitchClassToNote(pc: number, preferFlat = false): string {
  const i = ((pc % 12) + 12) % 12;
  return preferFlat ? FLAT_NOTES[i] : SHARP_NOTES[i];
}

const CHORD_TOKEN_RE = /^([A-G][#b]?)(m|min|maj|dim|aug|sus|add|\d|M)*(?:\/([A-G][#b]?))?$/;

export interface ParsedChord {
  root: string;
  quality: string;
  bass?: string;
}

export function parseChord(symbol: string): ParsedChord | null {
  const m = CHORD_TOKEN_RE.exec(symbol.trim());
  if (!m) return null;
  return { root: m[1], quality: m[2] ?? "", bass: m[3] };
}

export function isChordToken(token: string): boolean {
  if (!token) return false;
  return CHORD_TOKEN_RE.test(token.trim());
}

export function transposeChord(symbol: string, semitones: number, preferFlat = false): string {
  const raw = symbol.trim();
  if (!raw) return symbol;
  const m = CHORD_TOKEN_RE.exec(raw);
  if (!m) return symbol;

  const rootPc = noteToPitchClass(m[1]);
  if (rootPc === null) return symbol;

  const root = pitchClassToNote(rootPc + semitones, preferFlat);
  let out = root + (m[2] || "");
  if (m[3]) {
    const bassPc = noteToPitchClass(m[3]);
    if (bassPc !== null) out += "/" + pitchClassToNote(bassPc + semitones, preferFlat);
  }
  return out;
}

export function transposeKey(key: string, semitones: number, preferFlat = false): string {
  return transposeChord(key, semitones, preferFlat);
}

export interface Segment {
  chord: string | null;
  text: string;
}

export type SheetLine =
  | { type: "section"; label: string }
  | { type: "blank" }
  | { type: "line"; segments: Segment[] };

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChordToken).length;
  return chordCount / tokens.length >= 0.7;
}

/**
 * Universal sheet parser:
 * Handles Ultimate-Guitar text format (chords on top of lyrics), section headers, and inline [Chord] formats.
 */
export function parseSheet(raw: string): SheetLine[] {
  const rows = raw.replace(/\r\n/g, "\n").split("\n");
  const out: SheetLine[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const trimmed = row.trim();

    if (!trimmed) {
      out.push({ type: "blank" });
      continue;
    }

    // Section header (e.g. [Verse 1], Intro:, [Chorus])
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]") && !isChordToken(trimmed.slice(1, -1))) ||
      /^(intro|verse|chorus|bridge|outro|interlude|solo|reff|hook)/i.test(trimmed)
    ) {
      out.push({ type: "section", label: trimmed.replace(/^\[|\]$/g, "") });
      continue;
    }

    // Check if this row is a Chord line (e.g. "C   G   Am   F")
    if (isChordLine(row)) {
      const nextRow = i + 1 < rows.length ? rows[i + 1] : "";
      const isNextChordOrSection = !nextRow.trim() || isChordLine(nextRow) || /^(intro|verse|chorus|bridge|outro|\[)/i.test(nextRow.trim());

      // If next line is not lyric line, display chord line directly
      if (isNextChordOrSection) {
        const segments: Segment[] = [];
        const regex = /\S+/g;
        let match;
        let lastIdx = 0;

        while ((match = regex.exec(row)) !== null) {
          const spaceBefore = row.slice(lastIdx, match.index);
          if (spaceBefore) segments.push({ chord: null, text: spaceBefore });
          segments.push({ chord: match[0], text: "" });
          lastIdx = match.index + match[0].length;
        }
        const spaceAfter = row.slice(lastIdx);
        if (spaceAfter) segments.push({ chord: null, text: spaceAfter });

        out.push({ type: "line", segments });
      } else {
        // Chord above lyrics pairing
        i++; // Consume next lyric row
        const lyric = nextRow;
        const segments: Segment[] = [];
        const regex = /\S+/g;
        let match;
        let chordMatches: { chord: string; index: number; length: number }[] = [];

        while ((match = regex.exec(row)) !== null) {
          chordMatches.push({ chord: match[0], index: match.index, length: match[0].length });
        }

        let currLyricPos = 0;
        for (let j = 0; j < chordMatches.length; j++) {
          const cm = chordMatches[j];
          const nextCm = j + 1 < chordMatches.length ? chordMatches[j + 1] : null;

          if (cm.index > currLyricPos) {
            const preText = lyric.slice(currLyricPos, cm.index);
            segments.push({ chord: null, text: preText });
            currLyricPos = cm.index;
          }

          const endPos = nextCm ? nextCm.index : lyric.length;
          const textUnder = lyric.slice(currLyricPos, endPos);
          segments.push({ chord: cm.chord, text: textUnder });
          currLyricPos = endPos;
        }

        if (currLyricPos < lyric.length) {
          segments.push({ chord: null, text: lyric.slice(currLyricPos) });
        }

        out.push({ type: "line", segments });
      }
      continue;
    }

    // Plain text / lyric only row
    out.push({ type: "line", segments: [{ chord: null, text: row }] });
  }

  return out;
}

export function transposeLines(lines: SheetLine[], semitones: number, preferFlat = false): SheetLine[] {
  if (semitones === 0) return lines;
  return lines.map((line) =>
    line.type === "line"
      ? {
          type: "line",
          segments: line.segments.map((s) => ({
            ...s,
            chord: s.chord ? transposeChord(s.chord, semitones, preferFlat) : null,
          })),
        }
      : line,
  );
}

export function uniqueChords(lines: SheetLine[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    if (line.type !== "line") continue;
    for (const seg of line.segments) {
      if (seg.chord && isChordToken(seg.chord) && !seen.has(seg.chord)) {
        seen.add(seg.chord);
        out.push(seg.chord);
      }
    }
  }
  return out;
}
