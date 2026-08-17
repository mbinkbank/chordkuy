/**
 * Guitar chord shapes for the hover/tap tooltip.
 * Open positions are curated; everything else is derived from movable
 * E-shape / A-shape barre patterns so any transposed chord still renders.
 */

import { noteToPitchClass, parseChord } from "./chords";

export interface ChordShape {
  /** Low E -> high E. null = muted, 0 = open, n = absolute fret. */
  frets: (number | null)[];
  /** Fret the diagram window starts on (1 = nut). */
  baseFret: number;
  /** Absolute fret of the barre, if any. */
  barre?: number;
}

const OPEN: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0],
  Cmaj7: [null, 3, 2, 0, 0, 0],
  C7: [null, 3, 2, 3, 1, 0],
  Cadd9: [null, 3, 2, 0, 3, 0],
  Csus4: [null, 3, 3, 0, 1, 1],
  "C/G": [3, 3, 2, 0, 1, 0],
  D: [null, null, 0, 2, 3, 2],
  Dm: [null, null, 0, 2, 3, 1],
  D7: [null, null, 0, 2, 1, 2],
  Dmaj7: [null, null, 0, 2, 2, 2],
  Dm7: [null, null, 0, 2, 1, 1],
  Dsus4: [null, null, 0, 2, 3, 3],
  Dsus2: [null, null, 0, 2, 3, 0],
  "D/F#": [2, 0, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  Em7: [0, 2, 2, 0, 3, 0],
  Emaj7: [0, 2, 1, 1, 0, 0],
  Em9: [0, 2, 0, 0, 0, 2],
  Esus4: [0, 2, 2, 2, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fmaj7: [null, null, 3, 2, 1, 0],
  Fm: [1, 3, 3, 1, 1, 1],
  "F#m": [2, 4, 4, 2, 2, 2],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  Gsus4: [3, 3, 0, 0, 1, 3],
  "G/B": [null, 2, 0, 0, 0, 3],
  A: [null, 0, 2, 2, 2, 0],
  Am: [null, 0, 2, 2, 1, 0],
  A7: [null, 0, 2, 0, 2, 0],
  Am7: [null, 0, 2, 0, 1, 0],
  Amaj7: [null, 0, 2, 1, 2, 0],
  Asus4: [null, 0, 2, 2, 3, 0],
  Asus2: [null, 0, 2, 2, 0, 0],
  B7: [null, 2, 1, 2, 0, 2],
  Bm: [null, 2, 4, 4, 3, 2],
  Bm7: [null, 2, 0, 2, 0, 2],
  Bb: [null, 1, 3, 3, 3, 1],
};

/** Offsets from the barre fret. */
const E_SHAPE: Record<string, number[]> = {
  maj: [0, 2, 2, 1, 0, 0],
  m: [0, 2, 2, 0, 0, 0],
  "7": [0, 2, 0, 1, 0, 0],
  m7: [0, 2, 0, 0, 0, 0],
  maj7: [0, 2, 1, 1, 0, 0],
  sus4: [0, 2, 2, 2, 0, 0],
  sus2: [0, -1, -1, -1, 0, 0],
  "6": [0, 2, 2, 1, 2, 0],
  m6: [0, 2, 2, 0, 2, 0],
  "9": [0, 2, 0, 1, 0, 2],
  add9: [0, 2, 2, 1, 0, 2],
  aug: [0, 3, 2, 1, 1, 0],
  dim: [0, 1, 2, 0, 2, -1],
  "5": [0, 2, 2, -1, -1, -1],
};

const A_SHAPE: Record<string, number[]> = {
  maj: [-1, 0, 2, 2, 2, 0],
  m: [-1, 0, 2, 2, 1, 0],
  "7": [-1, 0, 2, 0, 2, 0],
  m7: [-1, 0, 2, 0, 1, 0],
  maj7: [-1, 0, 2, 1, 2, 0],
  sus4: [-1, 0, 2, 2, 3, 0],
  sus2: [-1, 0, 2, 2, 0, 0],
  "6": [-1, 0, 2, 2, 2, 2],
  m6: [-1, 0, 2, 2, 1, 2],
  "9": [-1, 0, 2, 1, 0, 0],
  add9: [-1, 0, 2, 4, 2, 0],
  aug: [-1, 0, 3, 2, 2, 1],
  dim: [-1, 0, 1, 2, 1, -1],
  "5": [-1, 0, 2, -1, -1, -1],
};

function normaliseQuality(quality: string): string {
  const q = quality.trim();
  if (!q) return "maj";
  const lower = q.toLowerCase();
  if (lower === "m" || lower === "min" || lower === "-") return "m";
  if (lower === "maj7" || q === "M7" || lower === "ma7") return "maj7";
  if (lower === "m7" || lower === "min7") return "m7";
  if (lower === "7") return "7";
  if (lower.startsWith("sus2")) return "sus2";
  if (lower.startsWith("sus")) return "sus4";
  if (lower.startsWith("add9")) return "add9";
  if (lower === "6") return "6";
  if (lower === "m6") return "m6";
  if (lower === "9" || lower === "7/9") return "9";
  if (lower.startsWith("dim")) return "dim";
  if (lower.startsWith("aug") || q === "+") return "aug";
  if (lower === "5") return "5";
  if (lower.startsWith("m")) return "m";
  if (lower.startsWith("maj")) return "maj";
  return lower.includes("7") ? "7" : "maj";
}

function buildBarre(rootPc: number, quality: string): ChordShape | null {
  const q = normaliseQuality(quality);
  const fretE = ((rootPc - 4) % 12 + 12) % 12 || 12; // low E string root
  const fretA = ((rootPc - 9) % 12 + 12) % 12 || 12; // A string root

  const useA = fretA <= fretE && A_SHAPE[q];
  const pattern = useA ? A_SHAPE[q] : E_SHAPE[q];
  if (!pattern) return null;
  const barre = useA ? fretA : fretE;

  const frets = pattern.map((offset) => (offset < 0 ? null : barre + offset));
  const played = frets.filter((f): f is number => f !== null && f > 0);
  const min = played.length ? Math.min(...played) : 1;
  return { frets, baseFret: min > 3 ? min : 1, barre };
}

/** Resolve a chord symbol to a diagram. Falls back to the root triad. */
export function getChordShape(symbol: string): ChordShape | null {
  const clean = symbol.trim();
  if (!clean || clean.toLowerCase() === "n.c.") return null;

  if (OPEN[clean]) return { frets: OPEN[clean], baseFret: 1 };

  const parsed = parseChord(clean);
  if (!parsed) return null;

  // Slash chords: show the base shape (bass note noted in the label).
  const base = parsed.root + parsed.quality;
  if (OPEN[base]) return { frets: OPEN[base], baseFret: 1 };

  const pc = noteToPitchClass(parsed.root);
  if (pc === null) return null;
  return buildBarre(pc, parsed.quality);
}
