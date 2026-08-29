import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SITE } from "./site";

export type Lang = "id" | "en";
const STORAGE_KEY = "chordlab:lang";

const DICT = {
  id: {
    navArtists: "Artis", navAbout: "Tentang", navContact: "Kontak",
    searchPlaceholder: "Cari chord, artis, atau lirik lagu…", searchBtn: "CARI",
    changeLang: "EN", randomSong: "Random", home: "Home",
    trendingTitle: "Chord Gitar Trending",
    popularChords: "Chord Populer", searchLabel: "Cari lagu, artis, atau genre",
    footerCopy: "Chord Gitar Mudah & Lirik Lagu.", footerPrivacy: "Kebijakan Privasi", footerTerms: "Syarat & Ketentuan",
    modeChord: "Mode Chord", modeLyric: "Mode Lirik", autoScroll: "Auto Scroll", pauseScroll: "Pause",
    saveBookmark: "Simpan ke bookmark", savedBookmark: "Tersimpan di bookmark", bookmarkTitle: "Bookmark Saya",
    bookmarkEmpty: "Belum ada chord tersimpan. Buka chord apa pun lalu tekan ikon bookmark.",
    aboutTitle: "Tentang Kami", contactTitle: "Kontak",
    difficultyNovice: "Pemula", difficultyIntermediate: "Menengah", difficultyAdvanced: "Mahir",
    error404: "Halaman tidak ditemukan", error404Desc: "Chord atau halaman yang kamu tuju mungkin sudah dipindahkan. Coba cari lagi, atau kembali ke",
    sidebarArtist: "Artis", sidebarDetail: "Detail lagu", sidebarOriginalKey: "Kunci Asli", sidebarCurrentKey: "Kunci Kini", sidebarCapo: "Capo", noCapo: "Tanpa capo",
    sidebarTuning: "Tuning", sidebarGenre: "Genre",     relatedChords: "Lagu terkait", noRelated: "Belum ada lagu terkait.", viewArtist: "Lihat artis →",
    aboutHeading: "Membaca chord seharusnya sesederhana ini",
    aboutBody: `${SITE.name} dibangun karena satu alasan sederhana: mencari chord gitar sering kali lebih melelahkan daripada memainkan lagunya. Halaman berat, iklan menutupi lirik, dan tombol transpose yang memuat ulang seluruh halaman. Kami membalik urutannya — chord dulu, sisanya belakangan.`,
    aboutPrinciples: "Prinsip kami",
    aboutFast: "Cepat.", aboutFastDesc: "Halaman dirender sebagai HTML statis, JavaScript hanya dipakai untuk fitur interaktif seperti transpose dan auto scroll.",
    aboutReadable: "Terbaca.", aboutReadableDesc: "Tipografi monospace, kontras tinggi, dan pemisahan visual yang jelas antara chord dan lirik.",
    aboutAccessible: "Aksesibel.", aboutAccessibleDesc: "Navigasi keyboard penuh, elemen semantik, area sentuh besar, serta mode gelap dan terang.",
    aboutRespect: "Menghormati karya.", aboutRespectDesc: "Chord disediakan untuk keperluan belajar dan latihan pribadi.",
    aboutCatalogTitle: "Isi katalog saat ini",
    aboutCatalogBody: "Seluruh lagu dan artis pada versi template ini adalah materi demo orisinal yang ditulis khusus untuk pengujian tata letak — bukan transkripsi karya pihak lain. Katalog produksi akan diisi melalui basis data Supabase dengan proses kurasi dan atribusi yang jelas.",
    aboutTechTitle: "Teknologi",
    aboutTechBody: "Situs ini statis, dilayani dari CDN global (Cloudflare), dengan CSS vanilla tanpa framework UI dan tanpa pelacak pihak ketiga. Struktur data lagu dirancang agar cocok satu banding satu dengan tabel Supabase, sehingga penambahan ribuan halaman chord tidak mengubah antarmuka sama sekali.",
    aboutContributeTitle: "Ingin berkontribusi?",
    aboutContributeBody: "Kirim koreksi chord, permintaan lagu, atau masukan aksesibilitas melalui",
    contactSend: "Kirim pesan", contactDesc: "Koreksi chord, permintaan lagu baru, laporan bug, atau kerja sama. Kami membaca semuanya dan biasanya membalas dalam 2–3 hari kerja.",
    contactTopic: "Topik", contactTopicFix: "Koreksi chord", contactTopicRequest: "Permintaan lagu", contactTopicBug: "Laporan bug / aksesibilitas", contactTopicCollab: "Kerja sama",
    contactName: "Nama", contactEmail: "Email (opsional)", contactMessage: "Pesan", contactSubmit: "Kirim pesan",
    contactSelect: "Pilih", contactMethod: "Metode menghubungi", contactMethodEmail: "Email", contactMethodWhatsapp: "WhatsApp",
    contactSent: "Pesan berhasil dikirim.", contactError: "Topik, nama, metode menghubungi, dan pesan wajib diisi.", contactFailed: "Pesan gagal dikirim. Coba lagi.",
    contactDirectEmail: "Email langsung", contactBeforeSending: "Sebelum mengirim",
    contactTip1: "Sertakan tautan halaman chord terkait.", contactTip2: "Untuk koreksi, tulis bar/baris yang keliru.", contactTip3: "Untuk permintaan, sebutkan judul dan artis.",
    contactDisclaimer: "Formulir ini tidak menyimpan data di peramban dan tidak memuat skrip pihak ketiga.",
    chordGitar: "Chord Gitar", strumming: "Genjrengan", duration: "Durasi",
    transposeDown: "Turunkan nada transpose", transposeDownTitle: "Turunkan 1 semitone",
    transposeUp: "Naikkan nada transpose", transposeUpTitle: "Naikkan 1 semitone",
    songInfo: "Informasi lagu", displaySettings: "Pengaturan tampilan",
    openMenu: "Buka menu navigasi", searchChord: "Cari chord lagu", bookmarkMine: "Bookmark saya",
    closeDiagram: "Tutup diagram",
    artistList: "Daftar artis", artistCount: (n: number) => `${n} artis`, songCount: (n: number) => `${n} lagu`,
    artistListDesc: (a: number, s: number) => `${a} artis · ${s} lagu. Pilih artis untuk melihat seluruh chord yang tersedia.`,
    artistListFilter: "Filter abjad", artistListResults: "Hasil daftar artis",
    artistListLoading: "Memuat daftar artis...", artistListEmpty: "Tidak ada artis pada huruf ini.",
    songs: "lagu",
    allSongs: (name: string) => `Semua lagu ${name}`, sortedByPop: "Diurutkan berdasarkan popularitas",
    artistLoading: "Memuat lagu artis...", artistNoChords: "Belum ada chord untuk artis ini.",
    artistRequestFind: (name: string) => `Tidak menemukan lagu ${name} yang kamu cari?`,
    artistRequestLink: "Kirim permintaan chord", artistRequestEnd: "dan kami tambahkan ke antrean.",
    statsArtists: (n: number) => `${n} artis`, statsChords: (n: number) => `${n} chord`,
  },
  en: {
    navArtists: "Artists", navAbout: "About", navContact: "Contact",
    searchPlaceholder: "Search chords, artists, or lyrics…", searchBtn: "SEARCH",
    changeLang: "ID", randomSong: "Random", home: "Home",
    trendingTitle: "Trending Guitar Chords",
    popularChords: "Popular Chords", searchLabel: "Search songs, artists, or genres",
    footerCopy: "Easy Guitar Chords & Song Lyrics.", footerPrivacy: "Privacy Policy", footerTerms: "Terms & Conditions",
    modeChord: "Chord Mode", modeLyric: "Lyrics Mode", autoScroll: "Auto Scroll", pauseScroll: "Pause",
    saveBookmark: "Save to bookmarks", savedBookmark: "Saved in bookmarks", bookmarkTitle: "My Bookmarks",
    bookmarkEmpty: "No saved chords yet. Open any song and tap the bookmark icon.",
    aboutTitle: "About Us", contactTitle: "Contact",
    difficultyNovice: "Beginner", difficultyIntermediate: "Intermediate", difficultyAdvanced: "Advanced",
    error404: "Page not found", error404Desc: "The chord or page you're looking for may have been moved. Try searching again, or go back to",
    sidebarArtist: "Artist", sidebarDetail: "Song detail", sidebarOriginalKey: "Original Key", sidebarCurrentKey: "Current Key", sidebarCapo: "Capo", noCapo: "No capo",
    sidebarTuning: "Tuning", sidebarGenre: "Genre",     relatedChords: "Related songs", noRelated: "No related songs.", viewArtist: "View artist →",
    aboutHeading: "Reading chords should be this simple",
    aboutBody: `${SITE.name} was built for one simple reason: finding guitar chords is often more tiring than actually playing the song. Heavy pages, ads covering lyrics, and a transpose button that reloads the entire page. We flipped the order — chords first, everything else after.`,
    aboutPrinciples: "Our principles",
    aboutFast: "Fast.", aboutFastDesc: "Pages are rendered as static HTML, JavaScript is only used for interactive features like transpose and auto scroll.",
    aboutReadable: "Readable.", aboutReadableDesc: "Monospace typography, high contrast, and clear visual separation between chords and lyrics.",
    aboutAccessible: "Accessible.", aboutAccessibleDesc: "Full keyboard navigation, semantic elements, large touch targets, and dark/light mode.",
    aboutRespect: "Respectful.", aboutRespectDesc: "Chords are provided for learning and personal practice purposes.",
    aboutCatalogTitle: "Current catalog",
    aboutCatalogBody: "All songs and artists in this template version are original demo material written specifically for layout testing — not transcriptions of other people's work. The production catalog will be filled through a Supabase database with a clear curation and attribution process.",
    aboutTechTitle: "Technology",
    aboutTechBody: "This site is static, served from a global CDN (Cloudflare), with vanilla CSS, no UI framework, and no third-party trackers. Song data structure is designed to map one-to-one with Supabase tables, so adding thousands of chord pages doesn't change the interface at all.",
    aboutContributeTitle: "Want to contribute?",
    aboutContributeBody: "Send chord corrections, song requests, or accessibility feedback via",
    contactSend: "Send message", contactDesc: "Chord corrections, new song requests, bug reports, or collaboration. We read everything and usually reply within 2–3 business days.",
    contactTopic: "Topic", contactTopicFix: "Chord correction", contactTopicRequest: "Song request", contactTopicBug: "Bug / accessibility report", contactTopicCollab: "Collaboration",
    contactName: "Name", contactEmail: "Email (optional)", contactMessage: "Message", contactSubmit: "Send message",
    contactSelect: "Select", contactMethod: "Contact method", contactMethodEmail: "Email", contactMethodWhatsapp: "WhatsApp",
    contactSent: "Message sent successfully.", contactError: "Topic, name, contact method, and message are required.", contactFailed: "Failed to send. Please try again.",
    contactDirectEmail: "Direct email", contactBeforeSending: "Before sending",
    contactTip1: "Include a link to the related chord page.", contactTip2: "For corrections, write the wrong bar/line.", contactTip3: "For requests, mention the title and artist.",
    contactDisclaimer: "This form does not store data in the browser and does not load third-party scripts.",
    chordGitar: "Guitar Chord", strumming: "Strumming", duration: "Duration",
    transposeDown: "Transpose down", transposeDownTitle: "Transpose down 1 semitone",
    transposeUp: "Transpose up", transposeUpTitle: "Transpose up 1 semitone",
    songInfo: "Song information", displaySettings: "Display settings",
    openMenu: "Open navigation menu", searchChord: "Search song chords", bookmarkMine: "My bookmarks",
    closeDiagram: "Close diagram",
    artistList: "Artist List", artistCount: (n: number) => `${n} artists`, songCount: (n: number) => `${n} songs`,
    artistListDesc: (a: number, s: number) => `${a} artists · ${s} songs. Pick an artist to see all available chords.`,
    artistListFilter: "Filter by letter", artistListResults: "Artist list results",
    artistListLoading: "Loading artist list...", artistListEmpty: "No artists for this letter.",
    songs: "songs",
    allSongs: (name: string) => `All songs by ${name}`, sortedByPop: "Sorted by popularity",
    artistLoading: "Loading artist songs...", artistNoChords: "No chords yet for this artist.",
    artistRequestFind: (name: string) => `Can't find ${name} songs you're looking for?`,
    artistRequestLink: "Send a chord request", artistRequestEnd: "and we'll add it to the queue.",
    statsArtists: (n: number) => `${n} artists`, statsChords: (n: number) => `${n} chords`,
  },
} as const;

export type DictKey = keyof typeof DICT.id;
type DictVal = typeof DICT.id[DictKey];
type TFn = DictVal extends (...args: infer A) => string ? (...args: A) => string : () => string;
interface I18nContextType { lang: Lang; setLang: (lang: Lang) => void; toggleLang: () => void; t: (key: DictKey, ...args: any[]) => string; }
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
  const t = (key: DictKey, ...args: any[]) => {
    const val = DICT[lang][key] ?? DICT.id[key] ?? key;
    return typeof val === "function" ? val(...args) : val;
  };
  return <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n harus digunakan di dalam I18nProvider");
  return ctx;
}
