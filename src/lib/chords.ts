/**
 * Chord engine supporting standard chords-above-lyrics sheets, bar symbols (|), and bracketed chords.
 * Implements strict character-based line wrapping (max 35 characters) at word boundaries.
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
  const tokens = line.trim().split(/\s+/).filter((t) => t !== "|" && t !== "%" && t !== "||" && t !== "/");
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChordToken).length;
  return chordCount / tokens.length >= 0.5;
}

/**
 * Wraps a pair of (chord_row, lyric_row) into lines of max `maxLen` characters
 * splitting only at word boundaries (spaces) without breaking words.
 */
function wrapPairToSegments(chordRow: string, lyricRow: string, maxLen = 35): Segment[][] {
  const maxW = Math.max(chordRow.length, lyricRow.length);
  let cLine = chordRow.padEnd(maxW, " ");
  let lLine = lyricRow.padEnd(maxW, " ");

  const linesSegments: Segment[][] = [];

  while (lLine.length > 0) {
    if (lLine.length <= maxLen) {
      linesSegments.push(buildSegmentsFromRaw(cLine.trimEnd(), lLine.trimEnd()));
      break;
    }

    // Find split index at space at or before maxLen
    let splitIdx = -1;
    for (let i = maxLen; i > 0; i--) {
      if (lLine[i] === " ") {
        splitIdx = i;
        break;
      }
    }

    if (splitIdx === -1) {
      // Find first space after maxLen if no space before
      for (let i = maxLen; i < lLine.length; i++) {
        if (lLine[i] === " ") {
          splitIdx = i;
          break;
        }
      }
      if (splitIdx === -1) {
        splitIdx = lLine.length;
      }
    }

    const chunkC = cLine.slice(0, splitIdx);
    const chunkL = lLine.slice(0, splitIdx);
    linesSegments.push(buildSegmentsFromRaw(chunkC.trimEnd(), chunkL.trimEnd()));

    let remC = cLine.slice(splitIdx);
    let remL = lLine.slice(splitIdx);

    // Trim leading spaces from next wrapped line
    const leadSpaces = remL.length - remL.trimStart().length;
    if (leadSpaces > 0) {
      remL = remL.slice(leadSpaces);
      remC = remC.length >= leadSpaces ? remC.slice(leadSpaces) : "";
    }

    cLine = remC;
    lLine = remL;
  }

  return linesSegments;
}

function buildSegmentsFromRaw(chordRow: string, lyricRow: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\([A-G][#b]?[^\s()]*\)|[A-G][#b]?[^\s|%()]*|\||%|\/)/g;
  let match;
  let chordMatches: { token: string; index: number; isChord: boolean }[] = [];

  while ((match = regex.exec(chordRow)) !== null) {
    const tok = match[0];
    chordMatches.push({ token: tok, index: match.index, isChord: isChordToken(tok) });
  }

  if (chordMatches.length === 0) {
    return [{ chord: null, text: lyricRow }];
  }

  let currPos = 0;
  for (let j = 0; j < chordMatches.length; j++) {
    const cm = chordMatches[j];
    const nextCm = j + 1 < chordMatches.length ? chordMatches[j + 1] : null;

    if (cm.index > currPos) {
      const preText = lyricRow.slice(currPos, cm.index);
      segments.push({ chord: null, text: preText });
      currPos = cm.index;
    }

    const endPos = nextCm ? nextCm.index : lyricRow.length;
    const textUnder = lyricRow.slice(currPos, endPos);
    if (cm.isChord) {
      segments.push({ chord: cm.token, text: textUnder });
    } else {
      segments.push({ chord: null, text: cm.token + (textUnder ? " " + textUnder : "") });
    }
    currPos = endPos;
  }

  if (currPos < lyricRow.length) {
    segments.push({ chord: null, text: lyricRow.slice(currPos) });
  }

  return segments;
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

    // Section header (e.g. [Verse 1], Intro:, [Chorus])
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]") && !isChordToken(trimmed.slice(1, -1))) ||
      /^(intro|verse|chorus|bridge|outro|interlude|solo|reff|hook|coda)/i.test(trimmed)
    ) {
      out.push({ type: "section", label: trimmed.replace(/^\[|\]$/g, "") });
      continue;
    }

    if (isChordLine(row)) {
      const nextRow = i + 1 < rows.length ? rows[i + 1] : "";
      const isNextChordOrSection = !nextRow.trim() || isChordLine(nextRow) || /^(intro|verse|chorus|bridge|outro|interlude|solo|reff|hook|coda|\[)/i.test(nextRow.trim());

      if (isNextChordOrSection) {
        // Measure line / chord only progression -> wrap if longer than 35 chars
        const wrapped = wrapPairToSegments(row, "", 35);
        for (const segs of wrapped) {
          out.push({ type: "line", segments: segs });
        }
      } else {
        // Chord above lyrics pairing -> wrap at max 35 chars at word boundary
        i++; // Consume next lyric row
        const wrapped = wrapPairToSegments(row, nextRow, 35);
        for (const segs of wrapped) {
          out.push({ type: "line", segments: segs });
        }
      }
      continue;
    }

    // Plain text / lyric only row -> wrap if longer than 35 chars
    const wrapped = wrapPairToSegments("", row, 35);
    for (const segs of wrapped) {
      out.push({ type: "line", segments: segs });
    }
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
