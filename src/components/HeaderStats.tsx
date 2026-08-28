import { useEffect, useState } from "react";
import { Guitar, UserStar } from "lucide-react";
import buildData from "../data/build-data.json";
import { getStats } from "../lib/api";
import { useI18n } from "../lib/i18n";

export default function HeaderStats() {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    songCount: buildData.songCount || 0,
    artistCount: buildData.artistCount || 0,
  });
  const { songCount, artistCount } = stats;
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    getStats()
      .then((s) => {
        if (s.songCount && s.artistCount) {
          setStats({ songCount: s.songCount, artistCount: s.artistCount });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const items = [
      t("statsArtists", artistCount.toLocaleString()),
      t("statsChords", songCount.toLocaleString()),
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
      <span className="code-prompt" aria-hidden="true">
        {index % 2 === 0 ? <UserStar size={13} strokeWidth={2} /> : <Guitar size={13} strokeWidth={2} />}
      </span>
      <span className="code-text">{text}</span>
      <span className="code-cursor">_</span>
    </div>
  );
}
