import type { Song } from "./types";

/**
 * Demo catalogue (original lyrics written for this template).
 * Swap with `supabase.from("songs")` — the shape is identical.
 */
export const songs: Song[] = [
  {
    id: "sng_01",
    title: "Lampu Kota Tak Pernah Tidur",
    slug: "lampu-kota-tak-pernah-tidur",
    artist: "Senja Kolektif",
    artistSlug: "senja-kolektif",
    originalKey: "G",
    capo: 2,
    genre: "Folk",
    year: 2024,
    tempo: 96,
    difficulty: "Pemula",
    strumming: "D DU UDU",
    tuning: "Standard E A D G B E",
    duration: "3:52",
    views: 128400,
    thumbnail: null,
    chords: ["G", "D/F#", "Em7", "C", "D", "Am7"],
    lyrics: `# Intro
[G]  [D/F#]  [Em7]  [C]

# Verse 1
[G]Jalan pulang masih [D/F#]sama seperti dulu
[Em7]Lampu kota tak per[C]nah tidur
[G]Aku hitung tiang [D/F#]listrik satu per satu
[Em7]Sampai rindu jadi [C]nomor

# Pre-Chorus
[Am7]Kalau nanti kita [D]bertemu lagi
[Am7]Jangan tanya aku [D]baik-baik saja

# Chorus
[G]Simpan saja ceri[D]tanya
[Em7]Biar malam yang men[C]jaga
[G]Kalau kota ini [D]terlalu terang
[Am7]Kita cari gelap ber[C]dua

# Verse 2
[G]Kopi dingin di [D/F#]meja belakang
[Em7]Radio memutar [C]lagu lama
[G]Aku belajar pu[D/F#]lang tanpa alasan
[Em7]Dan itu cukup se[C]derhana

# Outro
[G]  [D/F#]  [Em7]  [C]  [G]`,
    createdAt: "2025-11-02T10:00:00.000Z",
    updatedAt: "2026-01-06T08:30:00.000Z",
  },
  {
    id: "sng_02",
    title: "Sebelum Hujan Reda",
    slug: "sebelum-hujan-reda",
    artist: "Senja Kolektif",
    artistSlug: "senja-kolektif",
    originalKey: "C",
    capo: 0,
    genre: "Folk",
    year: 2023,
    tempo: 84,
    difficulty: "Pemula",
    strumming: "D DU DU",
    tuning: "Standard E A D G B E",
    duration: "4:10",
    views: 96250,
    thumbnail: null,
    chords: ["C", "G/B", "Am", "F", "G", "Dm7"],
    lyrics: `# Verse 1
[C]Duduk di teras [G/B]rumah nomor tiga
[Am]Menunggu langit [F]berhenti bicara
[C]Kamu bilang se[G/B]bentar lagi teduh
[Dm7]Aku percaya sa[G]ja

# Chorus
[F]Sebelum hujan re[C]da
[F]Ceritakan yang be[C]lum sempat
[Dm7]Nanti kalau matahari [Am]datang
[F]Kita sibuk la[G]gi

# Verse 2
[C]Atap seng menghi[G/B]tung ketukan
[Am]Lagu yang tak per[F]nah kita tulis
[C]Sepatu basah di [G/B]depan pintu
[Dm7]Tanda kita per[G]nah pergi

# Bridge
[Am]Tidak semua yang [F]tinggal itu berat
[C]Tidak semua yang [G]pergi itu jahat
[Am]Hujan hanya cara [F]langit membersihkan
[Dm7]Apa yang kita sim[G]pan`,
    createdAt: "2025-10-18T10:00:00.000Z",
    updatedAt: "2025-12-20T09:15:00.000Z",
  },
  {
    id: "sng_03",
    title: "Rumah di Ujung Jalan",
    slug: "rumah-di-ujung-jalan",
    artist: "Rana Astari",
    artistSlug: "rana-astari",
    originalKey: "D",
    capo: 0,
    genre: "Pop",
    year: 2025,
    tempo: 78,
    difficulty: "Menengah",
    strumming: "Fingerstyle 6/8",
    tuning: "Standard E A D G B E",
    duration: "3:34",
    views: 187900,
    thumbnail: null,
    chords: ["D", "Bm7", "Gmaj7", "A", "F#m", "Esus4"],
    lyrics: `# Intro
[D]  [Bm7]  [Gmaj7]  [A]

# Verse 1
[D]Kunci lama masih [Bm7]muat di pintunya
[Gmaj7]Cat biru mengelu[A]pas pelan
[D]Ibu menanam ke[Bm7]mangi di ember bekas
[Gmaj7]Dan waktu berhenti se[A]bentar

# Chorus
[Gmaj7]Rumah di ujung ja[D]lan
[F#m]Tidak pernah menu[Bm7]tup jendela
[Gmaj7]Sejauh apa pun [A]kaki melangkah
[Esus4]Selalu ada arah pu[A]lang

# Verse 2
[D]Foto keluarga mi[Bm7]ring sedikit
[Gmaj7]Tidak ada yang mem[A]betulkan
[D]Karena begitulah [Bm7]cara rindu
[Gmaj7]Menandai yang di[A]tinggalkan

# Bridge
[F#m]Kalau nanti aku [Bm7]lupa jalan
[Gmaj7]Panggil saja na[A]maku
[F#m]Seperti dulu waktu [Bm7]senja
[Gmaj7]Dan aku masih ke[Esus4]cil`,
    createdAt: "2025-12-01T10:00:00.000Z",
    updatedAt: "2026-01-11T11:00:00.000Z",
  },
  {
    id: "sng_04",
    title: "Kalau Kita Pulang",
    slug: "kalau-kita-pulang",
    artist: "Rana Astari",
    artistSlug: "rana-astari",
    originalKey: "A",
    capo: 2,
    genre: "Akustik",
    year: 2024,
    tempo: 92,
    difficulty: "Pemula",
    strumming: "D DU UDU",
    tuning: "Standard E A D G B E",
    duration: "3:12",
    views: 74300,
    thumbnail: null,
    chords: ["A", "E", "F#m", "D", "Bm", "E7"],
    lyrics: `# Verse 1
[A]Bus terakhir be[E]rangkat pukul se[F#m]puluh
Kita masih ber[D]diri di sini
[A]Menghitung alasan [E]untuk tidak per[F#m]gi
Tapi tak satu pun ber[D]arti

# Chorus
[D]Kalau kita pu[A]lang
[E]Biar pulang ber[F#m]sama
[D]Jangan ada yang me[A]nunggu
[Bm]Di halte yang sa[E7]ma

# Verse 2
[A]Tiket disimpan di [E]saku belakang
[F#m]Kusut tapi masih ter[D]baca
[A]Kota ini baik, [E]hanya terlalu ce[F#m]pat
Untuk orang seperti [D]kita

# Outro
[A]  [E]  [F#m]  [D]  [A]`,
    createdAt: "2025-09-25T10:00:00.000Z",
    updatedAt: "2025-11-30T14:20:00.000Z",
  },
  {
    id: "sng_05",
    title: "Detak Yang Sama",
    slug: "detak-yang-sama",
    artist: "Nadi Rekah",
    artistSlug: "nadi-rekah",
    originalKey: "Em",
    capo: 0,
    genre: "Rock",
    year: 2025,
    tempo: 148,
    difficulty: "Menengah",
    strumming: "Down-picking 8th",
    tuning: "Standard E A D G B E",
    duration: "3:05",
    views: 152600,
    thumbnail: null,
    chords: ["Em", "C", "G", "D", "Am", "B7"],
    lyrics: `# Intro
[Em]  [C]  [G]  [D]

# Verse 1
[Em]Kita lari di lo[C]rong yang sama
[G]Menabrak dinding yang [D]sama
[Em]Berteriak pada la[C]ngit yang bosan
[G]Mendengar keluhan [D]kita

# Chorus
[Am]Detak yang sa[Em]ma
[C]Di dada yang ber[G]beda
[Am]Kalau kita ja[Em]tuh
[B7]Setidaknya bersa[Em]ma

# Verse 2
[Em]Amplifier tua di [C]garasi belakang
[G]Masih percaya pada [D]kita
[Em]Tetangga mengetuk [C]tembok tiga kali
[G]Kita main lebih [D]keras

# Bridge
[C]Tidak ada yang men[G]janjikan besok
[Am]Jadi mainkan sekarang [B7]saja`,
    createdAt: "2025-12-14T10:00:00.000Z",
    updatedAt: "2026-01-09T07:45:00.000Z",
  },
  {
    id: "sng_06",
    title: "Bising",
    slug: "bising",
    artist: "Nadi Rekah",
    artistSlug: "nadi-rekah",
    originalKey: "Am",
    capo: 0,
    genre: "Indie",
    year: 2023,
    tempo: 124,
    difficulty: "Pemula",
    strumming: "DU DU DU",
    tuning: "Standard E A D G B E",
    duration: "2:48",
    views: 61200,
    thumbnail: null,
    chords: ["Am", "F", "C", "G", "Dm"],
    lyrics: `# Verse 1
[Am]Kepalaku penuh su[F]ara
[C]Yang bukan milikku sen[G]diri
[Am]Aku matikan semua [F]layar
[C]Dan ternyata masih ber[G]bunyi

# Chorus
[F]Bising, bi[C]sing
[G]Tapi aku terbi[Am]asa
[F]Bising, bi[C]sing
[Dm]Sampai lupa suara[G]ku

# Verse 2
[Am]Kalau sepi datang se[F]bentar
[C]Aku tidak tahu harus a[G]pa
[Am]Mungkin duduk saja di [F]lantai
[C]Menunggu kepala re[G]da`,
    createdAt: "2025-08-09T10:00:00.000Z",
    updatedAt: "2025-10-12T16:00:00.000Z",
  },
  {
    id: "sng_07",
    title: "Tanah Rantau",
    slug: "tanah-rantau",
    artist: "Pijar Nusantara",
    artistSlug: "pijar-nusantara",
    originalKey: "F",
    capo: 1,
    genre: "Etnik",
    year: 2024,
    tempo: 88,
    difficulty: "Menengah",
    strumming: "D DU UDU",
    tuning: "Standard E A D G B E",
    duration: "4:26",
    views: 88700,
    thumbnail: null,
    chords: ["F", "Dm", "Bb", "C", "Gm7", "Am"],
    lyrics: `# Verse 1
[F]Aku bawa nama [Dm]desa di dompet
[Bb]Supaya tidak hi[C]lang
[F]Bahasa ibu ku[Dm]simpan di doa
[Gm7]Biar tetap ber[C]suara

# Chorus
[Bb]Tanah rantau me[F]ngajarkan
[Gm7]Bagaimana caranya [Am]pulang
[Bb]Lewat lagu, lewat [F]masakan
[Gm7]Lewat orang yang [C]sabar

# Verse 2
[F]Di sini hujan tu[Dm]run beda
[Bb]Tidak berbau ta[C]nah
[F]Aku belajar men[Dm]cintai kota
[Gm7]Yang tidak menge[C]nal namaku

# Bridge
[Dm]Kalau nanti aku [Bb]kembali
[F]Tolong jangan ka[C]get
[Dm]Aku hanya sedikit [Bb]lebih pelan
[Gm7]Dan jauh lebih ku[C]at`,
    createdAt: "2025-07-20T10:00:00.000Z",
    updatedAt: "2025-12-02T10:10:00.000Z",
  },
  {
    id: "sng_08",
    title: "Ombak Tak Bersuara",
    slug: "ombak-tak-bersuara",
    artist: "Laut Utara",
    artistSlug: "laut-utara",
    originalKey: "Bm",
    capo: 2,
    genre: "Dream Pop",
    year: 2025,
    tempo: 72,
    difficulty: "Menengah",
    strumming: "Arpeggio 4/4",
    tuning: "Standard E A D G B E",
    duration: "5:02",
    views: 43100,
    thumbnail: null,
    chords: ["Bm", "G", "D", "A", "Em9", "F#m"],
    lyrics: `# Intro
[Bm]  [G]  [D]  [A]

# Verse 1
[Bm]Pantai jam empat [G]pagi
[D]Warnanya belum di[A]putuskan
[Bm]Kita duduk mengha[G]dap gelap
[Em9]Menunggu sesuatu di[A]mulai

# Chorus
[G]Ombak tak bersua[D]ra
[A]Ketika sudah sam[F#m]pai
[G]Yang ribut hanya per[D]jalanan
[Em9]Bukan tuju[A]annya

# Verse 2
[Bm]Kamu tulis nama di [G]pasir
[D]Aku tidak menghalan[A]gi air
[Bm]Sebagian hal memang [G]perlu hilang
[Em9]Supaya kita be[A]lajar

# Outro
[G]  [D]  [Em9]  [A]  [Bm]`,
    createdAt: "2026-01-04T10:00:00.000Z",
    updatedAt: "2026-01-14T09:00:00.000Z",
  },
  {
    id: "sng_09",
    title: "Kopi Jam Tiga Pagi",
    slug: "kopi-jam-tiga-pagi",
    artist: "Kirana Sekar",
    artistSlug: "kirana-sekar",
    originalKey: "C",
    capo: 0,
    genre: "Jazz",
    year: 2024,
    tempo: 68,
    difficulty: "Mahir",
    strumming: "Comping swing",
    tuning: "Standard E A D G B E",
    duration: "4:44",
    views: 39800,
    thumbnail: null,
    chords: ["Cmaj7", "Am7", "Dm7", "G7", "Em7", "A7", "Fmaj7"],
    lyrics: `# Verse 1
[Cmaj7]Kota tidur, [Am7]aku tidak
[Dm7]Cangkir keempat [G7]malam ini
[Em7]Lampu dapur [A7]kuning sekali
[Dm7]Seperti lagu la[G7]ma

# Chorus
[Fmaj7]Kopi jam tiga pa[Em7]gi
[Dm7]Tidak pernah menghakimi [G7]siapa pun
[Fmaj7]Ia hanya duduk [Em7]diam
[Dm7]Menemani yang be[G7]lum selesai

# Verse 2
[Cmaj7]Piring bersih, [Am7]pikiran tidak
[Dm7]Aku susun kembali [G7]hari ini
[Em7]Menghapus satu [A7]nama
[Dm7]Menulis dua a[G7]lasan

# Outro
[Cmaj7]  [Am7]  [Dm7]  [G7]  [Cmaj7]`,
    createdAt: "2025-06-11T10:00:00.000Z",
    updatedAt: "2025-11-05T12:30:00.000Z",
  },
  {
    id: "sng_10",
    title: "Slow Light",
    slug: "slow-light",
    artist: "Northern Lanterns",
    artistSlug: "northern-lanterns",
    originalKey: "G",
    capo: 0,
    genre: "Folk",
    year: 2025,
    tempo: 80,
    difficulty: "Pemula",
    strumming: "D DU UDU",
    tuning: "Standard E A D G B E",
    duration: "3:58",
    views: 52400,
    thumbnail: null,
    chords: ["G", "Cadd9", "Em7", "D", "Am7"],
    lyrics: `# Verse 1
[G]Morning comes in [Cadd9]slow light
[Em7]Nothing here is [D]urgent
[G]Coffee on the [Cadd9]window sill
[Em7]Steam against the [D]cold

# Chorus
[Cadd9]Take it slow, [G]take it slow
[Am7]There is time e[D]nough
[Cadd9]Every road we [G]meant to walk
[Am7]Is waiting where we [D]left it

# Verse 2
[G]Letters that we [Cadd9]never sent
[Em7]Still say what we [D]meant
[G]Keep them in the [Cadd9]bottom drawer
[Em7]Under quiet [D]years

# Bridge
[Am7]If the day is [Em7]heavy
[Cadd9]Put it down a [D]while
[Am7]Nothing breaks that [Em7]resting
[Cadd9]Nothing waits for[D]ever`,
    createdAt: "2025-10-01T10:00:00.000Z",
    updatedAt: "2026-01-02T08:00:00.000Z",
  },
  {
    id: "sng_11",
    title: "Paper Radio",
    slug: "paper-radio",
    artist: "Violet Static",
    artistSlug: "violet-static",
    originalKey: "Am",
    capo: 0,
    genre: "Pop",
    year: 2026,
    tempo: 104,
    difficulty: "Pemula",
    strumming: "Muted 8th",
    tuning: "Standard E A D G B E",
    duration: "3:20",
    views: 27600,
    thumbnail: null,
    chords: ["Am", "F", "C", "G", "Em"],
    lyrics: `# Verse 1
[Am]Static on a [F]paper radio
[C]Songs we only [G]half remember
[Am]Dancing in the [F]kitchen light
[C]Tiles are cold, we [G]don't care

# Chorus
[F]Turn it up a [C]little
[G]Let the neighbours [Am]know
[F]We are still a[C]live in here
[Em]Still learning how to [G]go

# Verse 2
[Am]Cassette tape and [F]broken pen
[C]Writing down the [G]chorus twice
[Am]Everything we [F]made tonight
[C]Was made from almost [G]nothing`,
    createdAt: "2026-01-12T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "sng_12",
    title: "Doa Sebelum Berangkat",
    slug: "doa-sebelum-berangkat",
    artist: "Pijar Nusantara",
    artistSlug: "pijar-nusantara",
    originalKey: "D",
    capo: 0,
    genre: "Religi",
    year: 2025,
    tempo: 74,
    difficulty: "Pemula",
    strumming: "D DU DU",
    tuning: "Standard E A D G B E",
    duration: "4:02",
    views: 71500,
    thumbnail: null,
    chords: ["D", "A", "Bm", "G", "Em", "Asus4"],
    lyrics: `# Verse 1
[D]Sebelum berang[A]kat
[Bm]Aku titipkan pa[G]gi
[D]Pada tangan yang [A]lebih tahu
[Em]Ke mana jalan pu[Asus4]lang [A]

# Chorus
[G]Bimbing langkah yang [D]ragu
[Em]Ringankan yang be[A]rat
[G]Kalau aku ter[D]sesat
[Em]Kembalikan de[A]ngan lembut

# Verse 2
[D]Sepatu di depan [A]pintu
[Bm]Menunggu keputus[G]an
[D]Aku tidak pernah [A]siap
[Em]Tapi tetap ber[Asus4]jalan [A]

# Outro
[G]  [D]  [Em]  [A]  [D]`,
    createdAt: "2025-05-30T10:00:00.000Z",
    updatedAt: "2025-12-28T13:00:00.000Z",
  },
];
