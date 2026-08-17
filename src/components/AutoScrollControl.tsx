interface Props {
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onStop: () => void;
  onSpeedChange: (value: number) => void;
}

/** rAF-based auto scroll: play/pause, speed slider, stop & reset to top. */
export default function AutoScrollControl({ playing, speed, onToggle, onStop, onSpeedChange }: Props) {
  return (
    <div className="toolgroup" role="group" aria-label="Auto scroll">
      <button
        type="button"
        className={playing ? "btn btn-sm btn-on" : "btn btn-sm"}
        onClick={onToggle}
        aria-pressed={playing}
        aria-label={playing ? "Jeda auto scroll" : "Mulai auto scroll"}
      >
        <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span> Scroll
      </button>
      <label className="sr-only" htmlFor="scroll-speed">
        Kecepatan auto scroll
      </label>
      <input
        id="scroll-speed"
        className="speed-slider"
        type="range"
        min={1}
        max={10}
        step={1}
        value={speed}
        onChange={(event) => onSpeedChange(Number(event.target.value))}
        aria-valuetext={`Kecepatan ${speed} dari 10`}
      />
      <span className="tool-value" aria-hidden="true">
        x{speed}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={onStop}
        aria-label="Hentikan auto scroll dan kembali ke atas"
      >
        ■
      </button>
    </div>
  );
}
