import { isChordToken, transposeChord } from './src/lib/chords';

console.log("isChordToken('-D/F#'):", isChordToken("-D/F#"));
console.log("transposeChord('-D/F#', 1):", transposeChord("-D/F#", 1));
console.log("transposeChord('-D/F#', 2):", transposeChord("-D/F#", 2));
console.log("transposeChord('D/F#', 1):", transposeChord("D/F#", 1));
