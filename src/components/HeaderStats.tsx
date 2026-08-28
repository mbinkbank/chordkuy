import { useEffect, useState } from "react";
import buildData from "../data/build-data.json";

export default function HeaderStats() {
  const songCount = buildData.songCount || 3200;
  const artistCount = buildData.artistCount || 1600;
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const items = [
      `${artistCount.toLocaleString()} artists`,
      `${songCount.toLocaleString()} chords`,
    ];
    const current = items[index % items.length];
    let charIdx = 0;
    let deleting = false;
    let timer: any;

    const step = () => {
      if (!deleting) {
        charIdx++;
        setText(current.slice(0, charIdx));
        if (charIdx === current.length) {
          deleting = true;
          timer = setTimeout(step, 2000);
          return;
        }
      } else {
        charIdx--;
        setText(current.slice(0, charIdx));
        if (charIdx === 0) {
          setIndex((prev) => prev + 1);
          return;
        }
      }
      timer = setTimeout(step, deleting ? 40 : 80);
    };

    timer = setTimeout(step, 100);
    return () => clearTimeout(timer);
  }, [index, artistCount, songCount]);

  return (
    <div className="header-stats-code" aria-label="Statistik katalog">
      <span className="code-prompt">$</span>
      <span className="code-text">{text}</span>
      <span className="code-cursor">_</span>
    </div>
  );
}
