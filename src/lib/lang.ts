// ponytail: deteksi dari script tulisan; judul yang di-romanize penuh tetap fallback ID
export type ScriptLang = "KR" | "JP" | "CN" | "RU";

export function detectScriptLang(...texts: string[]): ScriptLang | null {
  // buang homoglyph Cyrillic yang mengaku huruf Latin (е а о р с у х і ѕ ј) sebelum hitung
  const t = texts.join(" ").replace(/[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0455\u0458\u0410\u0415\u041E\u0420\u0421\u0423\u0425]/g, "");
  const count = (re: RegExp) => (t.match(re) || []).length;
  if (count(/[\uAC00-\uD7AF\u1100-\u11FF]/g) >= 3) return "KR";
  if (count(/[\u3040-\u30FF]/g) >= 3) return "JP";
  if (count(/[\u4E00-\u9FFF]/g) >= 3) return "CN";
  if (count(/[\u0400-\u04FF]/g) >= 3) return "RU";
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

// ponytail: EN vs ID (sama-sama Latin) dideteksi dari frekuensi kata khas
const EN_WORDS = /\b(the|you|and|is|are|was|were|i'm|im|i've|don't|dont|can't|cant|it's|its|that|this|with|for|my|me|just|when|what|how|why|not|but|all|of|to|in|on|we|they|she|he|will|would|could|should|there|here|your|from|at|be|been|am|so|if|then|than|about|like|one|never|always|know|get|got|go|going)\b/gi;
const ID_WORDS = /\b(yang|dan|di|ke|dari|aku|saya|kamu|kita|mereka|untuk|tidak|bukan|adalah|dengan|pada|sudah|belum|juga|hanya|akan|bisa|boleh|ini|itu|apa|siapa|kenapa|bagaimana|lagi|saja|kah|pun|lah|nantinya|ingin|harus|pernah|masih|semua|setiap|seorang|hati|kasih|sayang|cinta|rindu|hidup|dunia|waktu|masa)\b/gi;

function detectLatinLang(text: string): "EN" | null {
  const en = (text.match(EN_WORDS) || []).length;
  const id = (text.match(ID_WORDS) || []).length;
  if (en >= 3 && en > id * 2) return "EN";
  return null;
}

export function songLang(song: { title?: string; content?: string; lyrics?: string; language?: string }): ScriptLang | "EN" | null {
  const text = (song.content || song.lyrics || "").slice(0, 3000);
  const byScript = detectScriptLang(song.title || "", text);
  if (byScript) return byScript;
  return detectLatinLang(`${song.title || ""} ${text}`);
}

// Tag manual admin menang; deteksi script jadi fallback.
export function songLangLabel(song: { title?: string; content?: string; lyrics?: string; language?: string }): string {
  const l = (song.language || "").trim();
  if (l && l !== "ID" && l !== "EN") return l;
  return langLabel(songLang(song));
}
