# ChordLab — template website chord gitar

Dark, terminal-inspired chord platform: cepat, minimal JavaScript, mobile-first,
dan siap dikembangkan ke ribuan halaman chord.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output statis di dist/
```

## Struktur

```
src/
  index.css              Design system (CSS vanilla + CSS variables, dark & light)
  data/
    types.ts             Song / Artist / Genre — 1:1 dengan tabel Supabase
    songs.ts             Katalog demo (lirik orisinal, notasi chord inline)
    artists.ts           Artis + genre demo
  lib/
    api.ts               Data-access layer (ganti isinya dengan query Supabase)
    chords.ts            Parser sheet + transpose (Am7, Cmaj7, D/F#, Gsus4…)
    chordShapes.ts       Diagram: open chord + barre generator E/A shape
    seo.ts               <title>, meta, canonical, OG, Twitter, JSON-LD
    router.tsx           Router mungil (dihapus saat pindah ke Astro)
    hooks.ts             localStorage, auto scroll rAF, keyboard shortcut
    site.ts              Konstanta situs (tanpa secret)
  components/            Header, Footer, SearchBar, SongCard, ArtistCard,
                         Breadcrumb, ChordViewer, ChordDiagram, TransposeControl,
                         FontSizeControl, AutoScrollControl, ShareButton, ThemeToggle
  pages/                 Home, Search, Artists, Artist, Chord, About, Contact,
                         Privacy, Terms, 404
public/                  robots.txt, sitemap.xml, manifest.webmanifest,
                         favicon.svg, og-default.png, _headers, _redirects
```

## Format data chord

```
# Verse 1
[G]Jalan pulang masih [D/F#]sama seperti dulu
[Em7]Lampu kota tak per[C]nah tidur
```

- Baris diawali `#` → label bagian (Intro, Verse, Chorus…).
- `[Chord]` ditempel tepat sebelum suku kata tempat chord berbunyi.
- Parser menghasilkan segmen `inline-block` sehingga chord selalu lurus di atas
  liriknya dan tetap rapi di layar sempit.

## Fitur pembaca chord

| Fitur           | Detail                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Transpose       | ±11 semitone real-time, indikator key, tombol reset, tanpa reload       |
| Ukuran teks     | A− / A+ 12–26px, hanya sheet yang berubah, tersimpan di localStorage    |
| Auto scroll     | requestAnimationFrame, play/pause, slider kecepatan 1–10, stop + ke atas |
| Diagram chord   | Hover (desktop) / tap (mobile) / focus (keyboard), SVG inline           |
| Mode lirik      | Sembunyikan chord tanpa mengubah tata letak                             |
| Pintasan        | `+` `−` transpose · `0` reset · `Space` scroll · `[` `]` teks · `L` lirik |

## SEO & performa

- Setiap halaman: title unik, meta description, canonical, OG, Twitter Card.
- JSON-LD: WebSite, Organization, WebPage, BreadcrumbList, ItemList,
  ProfilePage + MusicGroup, MusicRecording (hanya field yang benar-benar ada).
- Heading hierarkis, HTML semantik, breadcrumb, internal linking, clean URL.
- Tanpa gambar hero, tanpa library UI, tanpa animasi berat → CLS ≈ 0.
- Font dimuat non-blocking dengan fallback monospace sistem.

## Langkah berikutnya

Lihat [`MIGRATION-ASTRO.md`](./MIGRATION-ASTRO.md) untuk skema SQL Supabase,
`getStaticPaths`, konfigurasi Astro, dan pengaturan Cloudflare Pages.
