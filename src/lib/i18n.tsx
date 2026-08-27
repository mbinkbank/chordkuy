import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "id" | "en";
const STORAGE_KEY = "chordlab:lang";

const DICT = {
  id: {
    navArtists: "Artis", navAbout: "Tentang", navContact: "Kontak",
    searchPlaceholder: "Cari chord, artis, atau lirik lagu…", searchBtn: "CARI",
    changeLang: "English", randomSong: "Lagu Random", trendingTitle: "Chord Gitar Trending",
    popularChords: "Chord Populer", searchLabel: "Cari lagu, artis, atau genre",
    footerCopy: "Chord Gitar Mudah & Lirik Lagu.", footerPrivacy: "Kebijakan Privasi", footerTerms: "Syarat & Ketentuan",
    modeChord: "Mode Chord", modeLyric: "Mode Lirik", autoScroll: "Auto Scroll", pauseScroll: "Pause",
    saveBookmark: "Simpan ke bookmark", savedBookmark: "Tersimpan di bookmark", bookmarkTitle: "Bookmark Saya",
    bookmarkEmpty: "Belum ada chord tersimpan. Buka chord apa pun lalu tekan ikon bookmark.",
    aboutTitle: "Tentang Chordkuy", contactTitle: "Kontak",
    difficultyNovice: "Pemula", difficultyIntermediate: "Menengah", difficultyAdvanced: "Mahir",
  },
  en: {
    navArtists: "Artists", navAbout: "About", navContact: "Contact",
    searchPlaceholder: "Search chords, artists, or lyrics…", searchBtn: "SEARCH",
    changeLang: "Bahasa Indonesia", randomSong: "Random Song", trendingTitle: "Trending Guitar Chords",
    popularChords: "Popular Chords", searchLabel: "Search songs, artists, or genres",
    footerCopy: "Easy Guitar Chords & Song Lyrics.", footerPrivacy: "Privacy Policy", footerTerms: "Terms & Conditions",
    modeChord: "Chord Mode", modeLyric: "Lyrics Mode", autoScroll: "Auto Scroll", pauseScroll: "Pause",
    saveBookmark: "Save to bookmarks", savedBookmark: "Saved in bookmarks", bookmarkTitle: "My Bookmarks",
    bookmarkEmpty: "No saved chords yet. Open any song and tap the bookmark icon.",
    aboutTitle: "About Chordkuy", contactTitle: "Contact Us",
    difficultyNovice: "Beginner", difficultyIntermediate: "Intermediate", difficultyAdvanced: "Advanced",
  },
} as const;

export type DictKey = keyof typeof DICT.id;
interface I18nContextType { lang: Lang; setLang: (lang: Lang) => void; toggleLang: () => void; t: (key: DictKey) => string; }
const I18nContext = createContext<I18nContextType | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "id";
  try { return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "id"; } catch { return "id"; }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); document.documentElement.lang = lang; } catch {}
  }, [lang]);
  const setLang = (next: Lang) => setLangState(next);
  const toggleLang = () => setLangState((prev) => (prev === "id" ? "en" : "id"));
  const t = (key: DictKey) => DICT[lang][key] || DICT.id[key] || key;
  return <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n harus digunakan di dalam I18nProvider");
  return ctx;
}
