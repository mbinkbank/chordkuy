// ponytail: deteksi dari script tulisan; judul yang di-romanize penuh tetap fallback ID
export type ScriptLang =
  | "KR" | "JP" | "CN" | "RU" | "TH" | "KH" | "LA" | "MM" | "IN" | "BD"
  | "LK" | "MV" | "IL" | "AM" | "GE" | "GR" | "MN" | "SA";

const SCRIPT_TESTS: Array<[ScriptLang, RegExp]> = [
  ["KR", /[\uAC00-\uD7AF\u1100-\u11FF]/g],
  ["JP", /[\u3040-\u30FF]/g],
  ["CN", /[\u4E00-\u9FFF]/g],
  ["RU", /[\u0400-\u04FF]/g],
  ["TH", /[\u0E00-\u0E7F]/g],
  ["LA", /[\u0E80-\u0EFF]/g],
  ["KH", /[\u1780-\u17FF]/g],
  ["MM", /[\u1000-\u109F]/g],
  ["IN", /[\u0900-\u097F]/g],
  ["BD", /[\u0980-\u09FF]/g],
  ["LK", /[\u0D80-\u0DFF]/g],
  ["MV", /[\u0780-\u07BF]/g],
  ["IL", /[\u0590-\u05FF]/g],
  ["AM", /[\u0530-\u058F]/g],
  ["GE", /[\u10A0-\u10FF]/g],
  ["GR", /[\u0370-\u03FF]/g],
  ["MN", /[\u1800-\u18AF]/g],
  ["SA", /[\u0600-\u06FF]/g],
];

export function detectScriptLang(...texts: string[]): ScriptLang | null {
  // buang homoglyph Cyrillic yang mengaku huruf Latin (е а о р с у х і ѕ ј) sebelum hitung
  const t = texts.join(" ").replace(/[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0455\u0458\u0410\u0415\u041E\u0420\u0421\u0423\u0425]/g, "");
  for (const [code, rx] of SCRIPT_TESTS) {
    if ((t.match(rx) || []).length >= 3) return code;
  }
  return null;
}

export function langLabel(code: ScriptLang | "EN" | "VN" | "PH" | "TR" | null): string {
  const map: Record<string, string> = {
    KR: "Korea", JP: "Jepang", CN: "Mandarin", RU: "Rusia",
    TH: "Thailand", KH: "Kamboja", LA: "Laos", MM: "Myanmar",
    IN: "India", BD: "Bangladesh", LK: "Sri Lanka", MV: "Maladewa",
    IL: "Ibrani", AM: "Armenia", GE: "Georgia", GR: "Siprus",
    MN: "Mongolia", SA: "Arab",
    EN: "English", VN: "Vietnam", PH: "Filipina", TR: "Turki",
  };
  return (code && map[code]) || "Indonesia";
}

// ponytail: EN/VN/PH/TR vs ID (sama-sama Latin) dideteksi dari frekuensi kata khas
const WORD_TESTS: Array<[ScriptLang | "EN" | "VN" | "PH" | "TR", RegExp]> = [
  ["EN", /\b(the|you|and|is|are|was|were|i'm|im|i've|don't|dont|can't|cant|it's|its|that|this|with|for|my|me|just|when|what|how|why|not|but|all|of|to|in|on|we|they|she|he|will|would|could|should|there|here|your|from|at|be|been|am|so|if|then|than|about|like|one|never|always|know|get|got|go|going)\b/gi],
  ["VN", /\b(của|và|là|không|anh|em|tôi|bạn|những|được|đã|sẽ|vậy|này|kia|gì|đi|về|yêu|đời|tình|trong|một|cuộc|hạnh|phúc)\b/g],
  ["PH", /\b(ang|ng|sa|ako|ikaw|hindi|ko|mo|kami|tayo|siya|namin|atin|mahal|puso|sana|lang|na|pa)\b/gi],
  ["TR", /\b(bir|ve|bu|için|ben|sen|biz|siz|ama|çok|daha|gibi|kadar|değil|var|yok|seni|beni|sevdim|kalbim|hayat|aşk|gönül)\b/g],
];
const ID_WORDS = /\b(yang|dan|di|ke|dari|aku|saya|kamu|kita|mereka|untuk|tidak|bukan|adalah|dengan|pada|sudah|belum|juga|hanya|akan|bisa|boleh|ini|itu|apa|siapa|kenapa|bagaimana|lagi|saja|kah|pun|lah|nantinya|ingin|harus|pernah|masih|semua|setiap|seorang|hati|kasih|sayang|cinta|rindu|hidup|dunia|waktu|masa)\b/gi;

function detectWordLang(text: string): ScriptLang | "EN" | "VN" | "PH" | "TR" | null {
  const idCount = (text.match(ID_WORDS) || []).length;
  for (const [code, rx] of WORD_TESTS) {
    const n = (text.match(rx) || []).length;
    if (n >= 3 && n > idCount * 2) return code;
  }
  return null;
}

export function songLang(song: { title?: string; content?: string; lyrics?: string; language?: string }): ScriptLang | "EN" | "VN" | "PH" | "TR" | null {
  const text = (song.content || song.lyrics || "").slice(0, 3000);
  const byScript = detectScriptLang(song.title || "", text);
  if (byScript) return byScript;
  return detectWordLang(`${song.title || ""} ${text}`);
}

// Tag manual admin menang; deteksi script jadi fallback.
export function songLangLabel(song: { title?: string; content?: string; lyrics?: string; language?: string }): string {
  const l = (song.language || "").trim();
  if (l && l !== "ID" && l !== "EN") return l;
  return langLabel(songLang(song));
}
