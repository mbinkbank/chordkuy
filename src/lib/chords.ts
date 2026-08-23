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
  const clean = symbol.replace(/^[()-]+|[()-]+$/g, "").trim();
  const m = CHORD_TOKEN_RE.exec(clean);
  if (!m) return null;
  return { root: m[1], quality: m[2] ?? "", bass: m[3] };
}

export function isChordToken(token: string): boolean {
  if (!token) return false;
  const clean = token.replace(/^[()-]+|[()-]+$/g, "").trim();
  return CHORD_TOKEN_RE.test(clean);
}

export function transposeChord(symbol: string, semitones: number, preferFlat = false): string {
  const raw = symbol.trim();
  if (!raw) return symbol;

  const mPrefix = raw.match(/^[()-]+/);
  const prefix = mPrefix ? mPrefix[0] : "";
  const mSuffix = raw.match(/[()-]+$/);
  const suffix = mSuffix ? mSuffix[0] : "";

  const clean = raw.slice(prefix.length, raw.length - suffix.length).trim();

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

  return `${prefix}${out}${suffix}`;
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
  // Replace U+FFFD replacement chars with space (encoding artifacts from scraping)
  lineStr = lineStr.replace(/\uFFFD/g, " ");
  const segments: Segment[] = [];
  // Regex presisi untuk menangkap chord lengkap termasuk slash chord (seperti -D/F# atau D/F#)
  const regex = /(?:^|\s|-)\K([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d|M)*(?:\/[A-G][#b]?)?)/g;
  let lastIdx = 0;

  // Manual token match yang aman dari konsumer regex tanpa \K di JS
  const regexJs = /(-?\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d|M)*(?:\/[A-G][#b]?)?|-[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d|M)*(?:\/[A-G][#b]?)?|\([A-G][#b]?[^\s()]*\))/g;
  let match;

  while ((match = regexJs.exec(lineStr)) !== null) {
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

export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter((t) => t !== "|" && t !== "%" && t !== "||" && t !== "/");
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChordToken).length;
  return chordCount / tokens.length >= 0.5;
}

const INTRO_LIKE_RE = /^(intro\s*:?|musik\s*:?|music\s*:?|outro\s*:?|int\.\s*|interlude\s*:?|solo\s*:?)/i;

export function parseSheet(raw: string): SheetLine[] {
  if (!raw) return [];
  const rows = raw.replace(/\r\n/g, "\n").split("\n");
  const out: SheetLine[] = [];

  let inSection = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const trimmed = row.trim();

    if (!trimmed) {
      inSection = false;
      out.push({ type: "blank" });
      continue;
    }

    // Decorative separator lines (---- / ====) — skip entirely
    if (/^[-_=]+$/.test(trimmed)) continue;

    // ===ORIGINAL CHORD=== or ORIGINAL CHORD → clean section label
    const originalChord = trimmed.replace(/[=_-]+/g, " ").replace(/\s+/g, " ").trim();
    if (/^original\s+chord$/i.test(originalChord)) {
      out.push({ type: "section", label: "ORIGINAL CHORD" });
      inSection = true;
      continue;
    }

    // Format khusus Intro / Musik / Outro / Int. sebaris: (misal "Intro : G Am C G (3x)")
    const prefixMatch = /^(intro\s*:?|musik\s*:?|music\s*:?|outro\s*:?|int\.\s*|interlude\s*:?|solo\s*:?)/i.exec(trimmed);
    if (prefixMatch && trimmed.length > prefixMatch[0].length) {
      const labelText = prefixMatch[0];
      const restText = row.slice(row.indexOf(labelText) + labelText.length).trimStart();

      // Baris 1: Judul Bagian
      out.push({ type: "section", label: labelText });
      inSection = true;

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
      inSection = true;
      continue;
    }

    // Jika sedang di dalam section pembuka (seperti Intro/Musik/Int.), ratakan awal baris chord ke kiri
    let lineToParse = row;
    if (inSection && isChordLine(trimmed)) {
      lineToParse = row.trimStart();
    }

    // Preserve exact line and extract inline transposable chords in-place
    out.push({ type: "line", segments: parseLineInplace(lineToParse) });
  }

  // Aturan blank line:
  // 1. chord-only -> blank -> lirik huruf: HAPUS blank
  // 2. lirik huruf -> blank -> chord-only: HAPUS blank
  // 3. apa pun -> blank -> marker seperti (*), (**): SIMPAN blank
  const isChordOnlyLine = (l?: SheetLine) =>
    !!l &&
    l.type === "line" &&
    l.segments.every((s) => {
      const t = s.text?.trim();
      return !t || /^\(\d+x?\)$/i.test(t) || /^\.+$/.test(t);
    });
  const isMarkerLine = (l?: SheetLine) => {
    if (!l || l.type !== "line") return false;
    const t = l.segments.map((s) => s.chord ?? s.text ?? "").join("").trim();
    return /^\(\*+\)$/.test(t);
  };
  const isLyricsLine = (l?: SheetLine) =>
    !!l &&
    l.type === "line" &&
    l.segments.some((s) => {
      const t = s.text?.trim();
      return !!t && !/^\(\d+x?\)$/i.test(t) && !/^\.+$/.test(t);
    });

  const cleaned: SheetLine[] = [];
  for (let i = 0; i < out.length; i++) {
    const line = out[i];
    if (line.type === "blank") {
      let prev: SheetLine | undefined;
      for (let j = cleaned.length - 1; j >= 0; j--) {
        if (cleaned[j].type !== "blank") { prev = cleaned[j]; break; }
      }
      let next: SheetLine | undefined;
      for (let j = i + 1; j < out.length; j++) {
        if (out[j].type !== "blank") { next = out[j]; break; }
      }
      const remove =
        !isMarkerLine(next) &&
        ((isChordOnlyLine(prev) && isLyricsLine(next)) ||
          (isLyricsLine(prev) && isChordOnlyLine(next)) ||
          (isChordOnlyLine(prev) && isChordOnlyLine(next)));
      if (remove) continue;
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].type === "blank") continue;
      cleaned.push(line);
      continue;
    }
    cleaned.push(line);
  }

  // Tambahkan blank di akhir section instrumental (Intro/Musik/Outro/Solo/Interlude):
  // setelah run baris chord-only berikut label, sebelum pasangan chord+lirik pertama.
  const result: SheetLine[] = [];
  for (let i = 0; i < cleaned.length; ) {
    const cur = cleaned[i];
    result.push(cur);
    if (cur.type === "section" && INTRO_LIKE_RE.test(cur.label.trim())) {
      let j = i + 1;
      while (j < cleaned.length && cleaned[j].type === "blank") j++;
      while (
        j < cleaned.length &&
        isChordOnlyLine(cleaned[j]) &&
        !(j + 1 < cleaned.length && isLyricsLine(cleaned[j + 1]) && !isMarkerLine(cleaned[j + 1]))
      )
        j++;
      const stop = cleaned[j];
      if (stop && stop.type === "line" && !isMarkerLine(stop)) {
        for (let k = i + 1; k < j; k++) {
          const l = cleaned[k];
          if (l.type !== "blank") {
            // hilangkan spasi awal pada baris chord run (indentasi dari data mentah)
            const first = l.segments[0];
            if (first && !first.chord && first.text?.startsWith(" ")) {
              result.push({
                ...l,
                segments: [{ ...first, text: first.text.replace(/^\s+/, "") }, ...l.segments.slice(1)],
              });
            } else {
              result.push(l);
            }
          }
        }
        if (result[result.length - 1]?.type !== "blank") result.push({ type: "blank" });
        i = j;
        continue;
      }
    }
    i++;
  }

  // Hapus indentasi berlebih per blok: kurangi prefix spasi yang SAMA di semua baris
  // blok, sehingga posisi chord relatif terhadap lirik tidak berubah.
  const indentOf = (l: SheetLine) => {
    if (l.type !== "line") return 0;
    const first = l.segments[0];
    if (!first || first.chord || !first.text) return 0;
    const m = /^ +/.exec(first.text);
    return m ? m[0].length : 0;
  };
  let blockStart = -1;
  for (let i = 0; i <= result.length; i++) {
    const line = result[i];
    const inBlock = line && line.type === "line";
    if (inBlock && blockStart < 0) blockStart = i;
    if (!inBlock && blockStart >= 0) {
      const minIndent = Math.min(
        ...result.slice(blockStart, i).map(indentOf),
      );
      if (minIndent > 0) {
        for (let k = blockStart; k < i; k++) {
          const l = result[k];
          const first = l.segments[0];
          if (first && !first.chord && first.text) {
            result[k] = { ...l, segments: [{ ...first, text: first.text.slice(minIndent) }, ...l.segments.slice(1)] };
          }
        }
      }
      blockStart = -1;
    }
  }

  return result;
}

export function transposeLines(lines: SheetLine[], semitones: number, preferFlat = false): SheetLine[] {
  if (!lines || semitones === 0) return lines || [];
  let inOriginalChord = false;
  return lines.map((line) => {
    if (line.type === "section" && /^original\s+chord$/i.test(line.label.trim())) {
      inOriginalChord = true;
      return line;
    }
    if (line.type === "section") {
      inOriginalChord = false;
      return line;
    }
    if (inOriginalChord || line.type !== "line") return line;
    return {
      type: "line",
      segments: line.segments.map((s) => ({
        ...s,
        chord: s.chord ? transposeChord(s.chord, semitones, preferFlat) : null,
      })),
    };
  });
}

export function uniqueChords(lines: SheetLine[]): string[] {
  if (!lines) return [];
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
