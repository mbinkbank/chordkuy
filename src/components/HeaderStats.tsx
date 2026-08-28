import { useEffect, useState } from "react";
import { getStats } from "../lib/api";

export default function HeaderStats() {
  const [stats, setStats] = useState({ songCount: 0, artistCount: 0 });
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    getStats().then((s) => {
      if (s.songCount && s.artistCount) {
        setStats({ songCount: s.songCount, artistCount: s.artistCount });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const items = [
      `${stats.artistCount.toLocaleString()} artists`,
      `${stats.songCount.toLocaleString()} chords`,
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
  }, [index, stats.artistCount, stats.songCount]);

  return (
    <div className="header-stats-code" aria-label="Statistik katalog">
      <span className="code-prompt">$</span>
      <span className="code-text">{text}</span>
      <span className="code-cursor">_</span>
    </div>
  );
}
