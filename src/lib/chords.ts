/**
 * Chord engine — zero dependencies.
 * Parses inline-bracket chord sheets and transposes complex symbols
 * (Am7, Cmaj7, D/F#, Gsus4, Em9, Bb, C#dim…) without losing quality info.
 */

export const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const BASE_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Keys that are conventionally written with flats. */
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"]);

export function keyPrefersFlat(key: string): boolean {
  return FLAT_KEYS.has(key.trim());
}

/** "C#" -> 1, "Bb" -> 10, invalid -> null */
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

const CHORD_RE = /^([A-G][#b]?)([^/\s]*)(?:\/([A-G][#b]?))?$/;

export interface ParsedChord {
  root: string;
  quality: string;
  bass?: string;
}

export function parseChord(symbol: string): ParsedChord | null {
  const m = CHORD_RE.exec(symbol.trim());
  if (!m) return null;
  return { root: m[1], quality: m[2] ?? "", bass: m[3] };
}

/** Transpose a single chord symbol by `semitones`. Unknown tokens pass through. */
export function transposeChord(symbol: string, semitones: number, preferFlat = false): string {
  const raw = symbol.trim();
  if (!raw) return symbol;
  const parsed = parseChord(raw);
  if (!parsed) return symbol;
  const rootPc = noteToPitchClass(parsed.root);
  if (rootPc === null) return symbol;

  const root = pitchClassToNote(rootPc + semitones, preferFlat);
  let out = root + parsed.quality;
  if (parsed.bass) {
    const bassPc = noteToPitchClass(parsed.bass);
    if (bassPc !== null) out += "/" + pitchClassToNote(bassPc + semitones, preferFlat);
  }
  return out;
}

/** Human label for the current key after N semitones. */
export function transposeKey(key: string, semitones: number, preferFlat = false): string {
  return transposeChord(key, semitones, preferFlat);
}

/* -------------------------------------------------------------------------- */
/* Sheet parsing                                                              */
/* -------------------------------------------------------------------------- */

export interface Segment {
  /** Chord printed above this text chunk (null = plain lyric). */
  chord: string | null;
  text: string;
}

export type SheetLine =
  | { type: "section"; label: string }
  | { type: "blank" }
  | { type: "line"; segments: Segment[] };

const BRACKET_RE = /\[([^\]]+)\]/g;

/**
 * Turn raw sheet text into renderable lines.
 * `# Verse 1` -> section label. `[Am]lyric` -> chord + lyric segments.
 */
export function parseSheet(lyrics: string): SheetLine[] {
  const rows = lyrics.replace(/\r\n/g, "\n").split("\n");
  const out: SheetLine[] = [];

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed) {
      out.push({ type: "blank" });
      continue;
    }
    if (trimmed.startsWith("#")) {
      out.push({ type: "section", label: trimmed.replace(/^#+\s*/, "") });
      continue;
    }

    const segments: Segment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    BRACKET_RE.lastIndex = 0;

    while ((match = BRACKET_RE.exec(row)) !== null) {
      const before = row.slice(lastIndex, match.index);
      if (before) {
        if (segments.length === 0) segments.push({ chord: null, text: before });
        else segments[segments.length - 1].text += before;
      }
      segments.push({ chord: match[1].trim(), text: "" });
      lastIndex = match.index + match[0].length;
    }

    const tail = row.slice(lastIndex);
    if (tail) {
      if (segments.length === 0) segments.push({ chord: null, text: tail });
      else segments[segments.length - 1].text += tail;
    }

    out.push({ type: "line", segments: segments.length ? segments : [{ chord: null, text: row }] });
  }

  return out;
}

/** Apply transposition to already parsed lines (cheap, pure). */
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

/** Distinct chords in order of appearance. */
export function uniqueChords(lines: SheetLine[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    if (line.type !== "line") continue;
    for (const seg of line.segments) {
      if (seg.chord && !seen.has(seg.chord)) {
        seen.add(seg.chord);
        out.push(seg.chord);
      }
    }
  }
  return out;
}

/** Plain-text export (chord above lyric, monospace aligned). */
export function sheetToPlainText(lines: SheetLine[]): string {
  const rows: string[] = [];
  for (const line of lines) {
    if (line.type === "blank") {
      rows.push("");
      continue;
    }
    if (line.type === "section") {
      rows.push(`[${line.label}]`);
      continue;
    }
    let chordRow = "";
    let lyricRow = "";
    for (const seg of line.segments) {
      const chord = seg.chord ?? "";
      const width = Math.max(chord.length + (seg.chord ? 1 : 0), seg.text.length);
      chordRow += chord.padEnd(width, " ");
      lyricRow += seg.text.padEnd(width, " ");
    }
    if (chordRow.trim()) rows.push(chordRow.trimEnd());
    if (lyricRow.trim()) rows.push(lyricRow.trimEnd());
  }
  return rows.join("\n");
}
