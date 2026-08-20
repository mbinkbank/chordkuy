import { Plus, Minus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Only the sheet scales — page chrome stays put (preference persisted). */
export default function FontSizeControl({ value, onChange, min = 12, max = 26 }: Props) {
  return (
    <div className="toolgroup" role="group" aria-label="Ukuran teks chord">
      <span className="lbl" aria-hidden="true">
        Teks
      </span>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Perkecil ukuran teks chord"
        style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "0 6px" }}
      >
        <span>A</span><Minus size={11} strokeWidth={2.5} />
      </button>
      <span className="tool-value" aria-live="polite">
        {value}px
      </span>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Perbesar ukuran teks chord"
        style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "0 6px" }}
      >
        <span>A</span><Plus size={11} strokeWidth={2.5} />
      </button>
    </div>
  );
}
