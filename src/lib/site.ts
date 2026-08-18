/** Global site constants — no secrets here, safe for the client bundle. */
export const SITE = {
  name: "Chordkuy",
  shortName: "Chordkuy",
  tagline: "Chord gitar bersih, cepat, dan mudah dibaca",
  url: "https://chordkuy.id",
  locale: "id-ID",
  lang: "id",
  description:
    "Kumpulan chord gitar dengan transpose real-time, auto scroll, dan diagram chord. Ringan, tanpa iklan mengganggu, dan nyaman dibaca di ponsel maupun desktop.",
  twitter: "@chordkuy",
  publisher: "Chordkuy",
  email: "halo@chordkuy.id",
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/search", label: "Cari" },
  { href: "/artists", label: "Artis" },
  { href: "/about", label: "Tentang" },
  { href: "/contact", label: "Kontak" },
] as const;

export const absoluteUrl = (path: string): string =>
  path.startsWith("http") ? path : SITE.url + (path.startsWith("/") ? path : "/" + path);
