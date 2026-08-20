import { Plus, Minus, RotateCcw } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  currentKey: string;
  originalKey: string;
}

/** Real-time transpose (no reload, no re-fetch) with a live key readout. */
export default function TransposeControl({ value, onChange, currentKey, originalKey }: Props) {
  const clamp = (n: number) => Math.max(-11, Math.min(11, n));

  return (
    <div className="toolgroup" role="group" aria-label="Transpose chord">
      <span className="lbl" aria-hidden="true">
        Key
      </span>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= -11}
        aria-label="Turunkan nada satu semitone"
        style={{ display: "grid", placeItems: "center" }}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="tool-value" aria-live="polite">
        {currentKey}
        {value !== 0 && <span className="caption"> {value > 0 ? `+${value}` : value}</span>}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= 11}
        aria-label="Naikkan nada satu semitone"
        style={{ display: "grid", placeItems: "center" }}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => onChange(0)}
        disabled={value === 0}
        aria-label={`Reset transpose ke nada asli ${originalKey}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <RotateCcw size={12} strokeWidth={2.2} /> Reset
      </button>
    </div>
  );
}
