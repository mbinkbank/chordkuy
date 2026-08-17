import type { Artist, Genre } from "./types";

/**
 * Demo catalogue. Every artist below is fictional and written for this
 * template so the schema markup stays truthful while no real recording data
 * is invented. Replace with `supabase.from("artists")` in production.
 */
export const artists: Artist[] = [
  {
    id: "art_01",
    name: "Senja Kolektif",
    slug: "senja-kolektif",
    bio: "Trio folk-pop asal Yogyakarta yang menulis lagu tentang perjalanan darat, kopi dingin, dan kota yang tidak pernah selesai dibangun.",
    country: "Indonesia",
    genres: ["Folk", "Pop"],
    thumbnail: null,
    createdAt: "2024-01-08T09:00:00.000Z",
  },
  {
    id: "art_02",
    name: "Rana Astari",
    slug: "rana-astari",
    bio: "Penyanyi-penulis lagu yang bermain dengan fingerstyle sederhana dan progresi mayor-tujuh yang lembut.",
    country: "Indonesia",
    genres: ["Pop", "Akustik"],
    thumbnail: null,
    createdAt: "2024-02-14T09:00:00.000Z",
  },
  {
    id: "art_03",
    name: "Nadi Rekah",
    slug: "nadi-rekah",
    bio: "Band indie rock empat personel dengan riff kotor, lirik pendek, dan tempo yang selalu sedikit terburu-buru.",
    country: "Indonesia",
    genres: ["Indie", "Rock"],
    thumbnail: null,
    createdAt: "2024-03-02T09:00:00.000Z",
  },
  {
    id: "art_04",
    name: "Pijar Nusantara",
    slug: "pijar-nusantara",
    bio: "Proyek musik yang menggabungkan tangga nada pentatonik daerah dengan pola strumming pop modern.",
    country: "Indonesia",
    genres: ["Etnik", "Pop"],
    thumbnail: null,
    createdAt: "2024-03-21T09:00:00.000Z",
  },
  {
    id: "art_05",
    name: "Laut Utara",
    slug: "laut-utara",
    bio: "Duo dream-pop dengan reverb tebal, chord terbuka, dan lagu-lagu yang cocok dimainkan dengan capo di fret dua.",
    country: "Indonesia",
    genres: ["Dream Pop", "Indie"],
    thumbnail: null,
    createdAt: "2024-05-11T09:00:00.000Z",
  },
  {
    id: "art_06",
    name: "Kirana Sekar",
    slug: "kirana-sekar",
    bio: "Vokalis jazz-pop yang memakai chord ekstensi tapi tetap ramah untuk gitaris pemula.",
    country: "Indonesia",
    genres: ["Jazz", "Pop"],
    thumbnail: null,
    createdAt: "2024-06-30T09:00:00.000Z",
  },
  {
    id: "art_07",
    name: "Northern Lanterns",
    slug: "northern-lanterns",
    bio: "Slow-burning indie folk band writing in open tunings and plain, unhurried English.",
    country: "Global",
    genres: ["Folk", "Indie"],
    thumbnail: null,
    createdAt: "2024-08-19T09:00:00.000Z",
  },
  {
    id: "art_08",
    name: "Violet Static",
    slug: "violet-static",
    bio: "Bedroom-pop project built on drum machines, clean guitars, and four-chord loops.",
    country: "Global",
    genres: ["Pop", "Elektronik"],
    thumbnail: null,
    createdAt: "2024-10-04T09:00:00.000Z",
  },
];

export const genres: Genre[] = [
  { slug: "pop", name: "Pop", description: "Progresi empat chord, mudah dinyanyikan bersama." },
  { slug: "folk", name: "Folk", description: "Chord terbuka, petikan lembut, cerita panjang." },
  { slug: "indie", name: "Indie", description: "Gitar bersih, tempo santai, lirik personal." },
  { slug: "rock", name: "Rock", description: "Power chord dan strumming rapat." },
  { slug: "akustik", name: "Akustik", description: "Versi sederhana untuk satu gitar dan satu suara." },
  { slug: "jazz", name: "Jazz", description: "Chord ekstensi: maj7, m7, dan sus." },
  { slug: "dangdut", name: "Dangdut", description: "Minor melodius dengan cengkok khas Indonesia." },
  { slug: "religi", name: "Religi", description: "Lagu tenang dengan dinamika lembut." },
];
