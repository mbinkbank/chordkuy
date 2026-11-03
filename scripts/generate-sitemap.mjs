import { writeFileSync } from "node:fs";

const DOMAIN = "https://chordkuy.id";
const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  console.log("Generating sitemap from Supabase...");

  const songs = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,slug,artist_slug,updated_at&order=id.asc&limit=1000&offset=${offset}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`Supabase error: ${res.status}, using pages collected so far`);
      break;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    songs.push(...batch);
    if (batch.length < 1000) break;
  }
  console.log(`Found ${songs.length} songs`);

  const today = new Date().toISOString().split("T")[0];

  // Struktur seperti chordtela.web.id:
  //   sitemap.xml (index) -> sitemap-main.xml + sitemap-artists-1..N + sitemap-songs-1..N
  // 1000 URL per file, URL bersih (tanpa query string)
  const PER_FILE = 1000;
  const HEAD = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const TAIL = `\n</urlset>\n`;

  const writeChunks = (prefix, entries) => {
    const pages = Math.max(1, Math.ceil(entries.length / PER_FILE));
    for (let p = 1; p <= pages; p++) {
      const chunk = entries.slice((p - 1) * PER_FILE, p * PER_FILE);
      writeFileSync(`dist/${prefix}-${p}.xml`, HEAD + chunk.join("\n") + TAIL, "utf-8");
    }
    return pages;
  };

  // --- main: halaman statis ---
  const mainEntries = [
    `<url><loc>${DOMAIN}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${DOMAIN}/artists</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    // /search sengaja tidak dimasukkan — halamannya noindex
    `<url><loc>${DOMAIN}/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    `<url><loc>${DOMAIN}/contact</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    `<url><loc>${DOMAIN}/privacy</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>`,
    `<url><loc>${DOMAIN}/terms</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>`,
  ];
  writeFileSync("dist/sitemap-main.xml", HEAD + mainEntries.join("\n") + TAIL, "utf-8");

  // --- artists ---
  const artistEntries = [];
  const seenArtists = new Set();
  for (const s of songs) {
    const aSlug = s.artist_slug || slugify(s.artist);
    if (aSlug && !seenArtists.has(aSlug)) {
      seenArtists.add(aSlug);
      artistEntries.push(
        `<url><loc>${DOMAIN}/artist/${aSlug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      );
    }
  }
  const artistPages = writeChunks("sitemap-artists", artistEntries);

  // --- songs ---
  const songEntries = songs.map((s) => {
    const songSlug = s.slug || `${slugify(s.artist)}-${slugify(s.title)}`;
    // lastmod = updated_at asli dari DB (bukan tanggal build — freshness palsu diabaikan Google)
    const lastmod = s.updated_at ? String(s.updated_at).slice(0, 10) : today;
    return `<url><loc>${DOMAIN}/chord/${songSlug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
  });
  const songPages = writeChunks("sitemap-songs", songEntries);

  // --- index ---
  const indexItems = [
    `  <sitemap><loc>${DOMAIN}/sitemap-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    ...Array.from({ length: artistPages }, (_, i) => `  <sitemap><loc>${DOMAIN}/sitemap-artists-${i + 1}.xml</loc><lastmod>${today}</lastmod></sitemap>`),
    ...Array.from({ length: songPages }, (_, i) => `  <sitemap><loc>${DOMAIN}/sitemap-songs-${i + 1}.xml</loc><lastmod>${today}</lastmod></sitemap>`),
  ].join("\n");
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexItems}\n</sitemapindex>\n`;
  writeFileSync("dist/sitemap.xml", indexXml, "utf-8");

  const llmsLines = [
    "# Chordkuy.id — Katalog Chord Gitar",
    "",
    "> Katalog chord gitar dan lirik lagu dengan kunci dasar, capo, transpose, diagram chord, dan auto scroll.",
    "",
    "## Panduan Penggunaan",
    "",
    "Gunakan halaman chord sebagai referensi belajar gitar. Setiap halaman memiliki judul lagu, artis, kunci dasar, capo, serta chord dan lirik.",
    "",
    "## Halaman Katalog",
    "",
    `- [Daftar artis](${DOMAIN}/artists): katalog artis yang tersedia`,
    `- [Chord trending](${DOMAIN}/): lagu yang paling banyak dilihat dalam periode terbaru`,
    `- [Pencarian](${DOMAIN}/search): pencarian lagu dan artis`,
    "",
    "## Contoh Halaman Chord",
    "",
  ];
  for (const s of songs) {
    const songSlug = s.slug || `${slugify(s.artist)}-${slugify(s.title)}`;
    llmsLines.push(`- [${s.title} — ${s.artist}](${DOMAIN}/chord/${songSlug})`);
  }
  llmsLines.push("", "## Catatan", "", "Katalog ini diperbarui berkala. Gunakan URL canonical pada setiap halaman sebagai referensi utama.", "");

  writeFileSync("dist/llms-full.txt", llmsLines.join("\n"), "utf-8");
  console.log(
    `Sitemap index written to dist/sitemap.xml (main + ${artistPages} artists + ${songPages} songs = ${artistEntries.length + songEntries.length + mainEntries.length} URLs)`,
  );
  console.log(`llms-full.txt written to dist/llms-full.txt (${songs.length} song links)`);

  // artists.json untuk halaman daftar artis (paging 40/halaman, sekali fetch)
  const artistMap = new Map(); // slug -> [name, count]
  for (const s of songs) {
    const aSlug = s.artist_slug || slugify(s.artist);
    const name = (s.artist || "").trim();
    if (!aSlug || !name) continue;
    const e = artistMap.get(aSlug);
    if (e) e[1] += 1;
    else artistMap.set(aSlug, [name, 1]);
  }
  const artistsOut = [...artistMap.entries()]
    .map(([slug, [name, n]]) => [name, slug, n])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "id"));
  writeFileSync("dist/artists.json", JSON.stringify(artistsOut), "utf-8");
  console.log(`artists.json written (${artistsOut.length} artists)`);
}

main().catch((err) => {
  console.error("Failed to generate sitemap:", err.message);
  process.exit(1);
});
