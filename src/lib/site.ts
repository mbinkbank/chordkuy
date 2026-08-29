/** Global site constants — no secrets here, safe for the client bundle. */
export const SITE = {
  name: "Chordkuy",
  shortName: "Chordkuy",
  tagline: "Chord gitar bersih, cepat, dan mudah dibaca",
  url: "https://chordkuy.id",
  locale: "id-ID",
  lang: "id",
  description:
    "Kumpulan kunci gitar dan chord lagu Indonesia terlengkap. Temukan kunci gitar mudah untuk berbagai lagu populer, lengkap dengan lirik dan chord gitar.",
  twitter: "@chordkuy",
  publisher: "Chordkuy",
  email: "mariobaladollun@gmail.com",
} as const;

export const NAV_ITEMS = [
  { href: "/artists", label: "Artis" },
  { href: "/about", label: "Tentang" },
  { href: "/contact", label: "Kontak" },
] as const;

export const absoluteUrl = (path: string): string =>
  path.startsWith("http") ? path : SITE.url + (path.startsWith("/") ? path : "/" + path);
