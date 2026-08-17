import { getChordShape } from "../lib/chordShapes";

const STRINGS = 6;
const FRETS = 4;

/** Lightweight inline SVG fretboard (no images, no libraries). */
export default function ChordDiagram({ chord, size = 118 }: { chord: string; size?: number }) {
  const shape = getChordShape(chord);
  if (!shape) {
    return (
      <p className="caption" style={{ margin: 0 }}>
        Diagram belum tersedia untuk chord ini.
      </p>
    );
  }

  const width = size;
  const height = size * 1.12;
  const padX = 12;
  const padTop = 18;
  const padBottom = 10;
  const gridW = width - padX * 2;
  const gridH = height - padTop - padBottom;
  const stepX = gridW / (STRINGS - 1);
  const stepY = gridH / FRETS;
  const openNut = shape.baseFret === 1;

  return (
    <svg
      className="diagram"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Diagram chord ${chord}`}
    >
      {/* strings */}
      {Array.from({ length: STRINGS }, (_, i) => (
        <line
          key={`s${i}`}
          className="grid-line"
          x1={padX + i * stepX}
          y1={padTop}
          x2={padX + i * stepX}
          y2={padTop + gridH}
        />
      ))}
      {/* frets */}
      {Array.from({ length: FRETS + 1 }, (_, i) => (
        <line
          key={`f${i}`}
          className={i === 0 && openNut ? "nut" : "grid-line"}
          x1={padX}
          y1={padTop + i * stepY}
          x2={padX + gridW}
          y2={padTop + i * stepY}
        />
      ))}

      {!openNut && (
        <text className="lbl" x={2} y={padTop + stepY * 0.7}>
          {shape.baseFret}
        </text>
      )}

      {shape.frets.map((fret, i) => {
        const x = padX + i * stepX;
        if (fret === null) {
          return (
            <text key={`m${i}`} className="lbl" x={x - 2.5} y={padTop - 6} aria-hidden="true">
              ×
            </text>
          );
        }
        if (fret === 0) {
          return <circle key={`o${i}`} cx={x} cy={padTop - 9} r={3} fill="none" stroke="currentColor" strokeWidth={1} />;
        }
        const rel = fret - shape.baseFret;
        if (rel < 0 || rel >= FRETS) return null;
        return <circle key={`d${i}`} className="dot" cx={x} cy={padTop + rel * stepY + stepY / 2} r={4.2} />;
      })}
    </svg>
  );
}
