import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "chordlab:theme";
type Theme = "dark" | "light";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage disabled — ignore */
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="btn btn-sm btn-icon"
      aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{ display: "grid", placeItems: "center" }}
    >
      {theme === "dark" ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
    </button>
  );
}
