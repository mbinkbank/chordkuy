/**
 * Chord engine supporting standard chords-above-lyrics sheets, bar symbols (|), and bracketed chords.
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
  const clean = symbol.replace(/[()]/g, "").trim();
  const m = CHORD_TOKEN_RE.exec(clean);
  if (!m) return null;
  return { root: m[1], quality: m[2] ?? "", bass: m[3] };
}

export function isChordToken(token: string): boolean {
  if (!token) return false;
  const clean = token.replace(/[()]/g, "").trim();
  return CHORD_TOKEN_RE.test(clean);
}

export function transposeChord(symbol: string, semitones: number, preferFlat = false): string {
  const raw = symbol.trim();
  if (!raw) return symbol;

  const hasParen = raw.startsWith("(") && raw.endsWith(")");
  const clean = raw.replace(/[()]/g, "").trim();

  const m = CHORD_TOKEN_RE.exec(clean);
  if (!m) return symbol;

  const rootPc = noteToPitchClass(m[1]);
  if (rootPc === null) return symbol;

  const root = pitchClassToNote(rootPc + semitones, preferFlat);
  let out = root + (m[2] || "");
  if (m[3]) {
    const bassPc = noteToPitchClass(m[3]);
    if (bassPc !== null) out += "/" + pitchClassToNote(bassPc + semitones, preferFlat);
  }

  return hasParen ? `(${out})` : out;
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
  // Ignore measure separators (|), repeat symbols (%), and whitespace
  const tokens = line.trim().split(/\s+/).filter((t) => t !== "|" && t !== "%" && t !== "||" && t !== "/");
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChordToken).length;
  return chordCount / tokens.length >= 0.5;
}

/**
 * Universal sheet parser:
 * Handles chords-above-lyrics, measure lines with | and %, section labels, etc.
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

    // Section header (e.g. [Verse 1], Intro:, [Chorus], OUTRO, INTERLUDE)
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]") && !isChordToken(trimmed.slice(1, -1))) ||
      /^(intro|verse|chorus|bridge|outro|interlude|solo|reff|hook|coda)/i.test(trimmed)
    ) {
      out.push({ type: "section", label: trimmed.replace(/^\[|\]$/g, "") });
      continue;
    }

    // Check if this row is a Chord/Progression line (e.g. "| (G) | G | Em | % |" or "C   G   Am   F")
    if (isChordLine(row)) {
      const nextRow = i + 1 < rows.length ? rows[i + 1] : "";
      const isNextChordOrSection = !nextRow.trim() || isChordLine(nextRow) || /^(intro|verse|chorus|bridge|outro|interlude|solo|reff|hook|coda|\[)/i.test(nextRow.trim());

      if (isNextChordOrSection) {
        // Measure line / chord only progression
        const segments: Segment[] = [];
        const regex = /(\([A-G][#b]?[^\s()]*\)|[A-G][#b]?[^\s|%()]*|\||%|\/)/g;
        let match;
        let lastIdx = 0;

        while ((match = regex.exec(row)) !== null) {
          const spaceBefore = row.slice(lastIdx, match.index);
          if (spaceBefore) segments.push({ chord: null, text: spaceBefore });

          const token = match[0];
          if (isChordToken(token)) {
            segments.push({ chord: token, text: "" });
          } else {
            segments.push({ chord: null, text: token });
          }
          lastIdx = match.index + token.length;
        }
        const spaceAfter = row.slice(lastIdx);
        if (spaceAfter) segments.push({ chord: null, text: spaceAfter });

        out.push({ type: "line", segments });
      } else {
        // Chord above lyrics pairing
        i++; // Consume next lyric row
        const lyric = nextRow;
        const segments: Segment[] = [];
        const regex = /(\([A-G][#b]?[^\s()]*\)|[A-G][#b]?[^\s|%()]*|\||%|\/)/g;
        let match;
        let chordMatches: { token: string; index: number; isChord: boolean }[] = [];

        while ((match = regex.exec(row)) !== null) {
          const tok = match[0];
          chordMatches.push({ token: tok, index: match.index, isChord: isChordToken(tok) });
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
          if (cm.isChord) {
            segments.push({ chord: cm.token, text: textUnder });
          } else {
            segments.push({ chord: null, text: cm.token + (textUnder ? " " + textUnder : "") });
          }
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
      if (seg.chord && isChordToken(seg.chord)) {
        const clean = seg.chord.replace(/[()]/g, "");
        if (!seen.has(clean)) {
          seen.add(clean);
          out.push(clean);
        }
      }
    }
  }
  return out;
}
