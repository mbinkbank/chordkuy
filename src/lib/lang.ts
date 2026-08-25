// ponytail: deteksi dari script tulisan; judul yang di-romanize penuh tetap fallback ID
export type ScriptLang = "KR" | "JP" | "CN" | "RU";

export function detectScriptLang(...texts: string[]): ScriptLang | null {
  const t = texts.join(" ");
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(t)) return "KR";
  if (/[\u3040-\u30FF]/.test(t)) return "JP";
  if (/[\u4E00-\u9FFF]/.test(t)) return "CN";
  if (/[\u0400-\u04FF]/.test(t)) return "RU";
  return null;
}

export function langLabel(code: ScriptLang | "EN" | null): string {
  if (code === "KR") return "Korea";
  if (code === "JP") return "Jepang";
  if (code === "CN") return "Mandarin";
  if (code === "RU") return "Rusia";
  if (code === "EN") return "English";
  return "Indonesia";
}

export function songLang(song: { title?: string; content?: string; language?: string }): ScriptLang | "EN" | null {
  return detectScriptLang(song.title || "", (song.content || "").slice(0, 3000)) || (song.language === "EN" ? "EN" : null);
}
