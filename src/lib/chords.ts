/**
 * Chord engine supporting exact 1:1 Monospaced preserves for Chordtela.
 * Preserves exact lines, inline text like (3x), Intro labels, and chord transposition.
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
  const clean = token.replace(/[().-]/g, "").trim();
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

/**
 * Extract transposable chords and text from a single line in-place,
 * preserving exact spaces, labels like (3x), and punctuation.
 */
function parseLineInplace(lineStr: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d|M)*(?:\/[A-G][#b]?)?\b|\([A-G][#b]?[^\s()]*\)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(lineStr)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const token = match[0];

    if (start > lastIdx) {
      segments.push({ chord: null, text: lineStr.slice(lastIdx, start) });
    }

    if (isChordToken(token)) {
      segments.push({ chord: token, text: "" });
    } else {
      segments.push({ chord: null, text: token });
    }
    lastIdx = end;
  }

  if (lastIdx < lineStr.length) {
    segments.push({ chord: null, text: lineStr.slice(lastIdx) });
  }

  return segments.length ? segments : [{ chord: null, text: lineStr }];
}

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

    // Format khusus Intro / Musik / Outro / Int. sebaris: (misal "Intro : G Am C G (3x)")
    const prefixMatch = /^(intro\s*:?|musik\s*:?|music\s*:?|outro\s*:?|int\.\s*|interlude\s*:?|solo\s*:?)/i.exec(trimmed);
    if (prefixMatch && trimmed.length > prefixMatch[0].length) {
      const labelText = prefixMatch[0];
      const restText = row.slice(row.indexOf(labelText) + labelText.length).trimStart();

      // Baris 1: Judul Bagian
      out.push({ type: "section", label: labelText });

      // Baris 2: Chord langsung di awal baris (tanpa indentasi)
      out.push({ type: "line", segments: parseLineInplace(restText) });
      continue;
    }

    // Explicit section header lines biasa (e.g. [Verse 1], Chorus:)
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]") && !isChordToken(trimmed.slice(1, -1))) ||
      /^(intro\s*:?|musik\s*:?|music\s*:?|verse\s*\d*:?|chorus\s*:?|bridge\s*:?|outro\s*:?|interlude\s*:?|solo\s*:?|reff\s*:?|hook\s*:?|coda\s*:?)$/i.test(trimmed)
    ) {
      out.push({ type: "section", label: trimmed.replace(/^\[|\]$/g, "") });
      continue;
    }

    // Preserve exact line and extract inline transposable chords in-place
    out.push({ type: "line", segments: parseLineInplace(row) });
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
