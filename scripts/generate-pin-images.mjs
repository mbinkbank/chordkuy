/**
 * Generate gambar pin Pinterest (1000x1500) untuk lagu terpopuler.
 * Output: dist/pin/<slug>.png + dist/pin/index.json (daftar slug yang punya gambar)
 * Worker memakainya sebagai og:image per lagu; fallback = og-default.png.
 *
 * Pemakaian: node scripts/generate-pin-images.mjs [limit=500]
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";
const SITE = "https://chordkuy.id";
const LIMIT = parseInt(process.argv[2] || "500", 10);

const W = 1000;
const H = 1500;

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// bungkus teks maks n karakter per baris
function wrap(text, max) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
    if (lines.length >= 3) break; // maks 3 baris, sisanya dipotong
  }
  if (cur && lines.length < 3) lines.push(cur.trim());
  return lines;
}

const PALETTES = [
  ["#101014", "#4ade80"], // gelap + hijau (brand)
  ["#0f1b2d", "#7dd3fc"],
  ["#1b1023", "#f0abfc"],
  ["#231a10", "#fbbf24"],
  ["#101b17", "#34d399"],
  ["#1d0f1f", "#fb7185"],
];

function pinSvg({ title, artist, key, capo, chords, seed }) {
  const [bg, accent] = PALETTES[seed % PALETTES.length];
  const titleLines = wrap(title, 18);
  const artistLines = wrap(artist, 26);
  const chordCells = chords.slice(0, 8);
  const cols = 4;
  const cell = 190;
  const rowsCount = Math.ceil(chordCells.length / cols) || 1;
  const gridW = cols * cell;
  const gridX = (W - gridW) / 2;
  const gridY = 800;

  let chordSvg = "";
  chordCells.forEach((c, i) => {
    const cx = gridX + (i % cols) * cell + cell / 2;
    const cy = gridY + Math.floor(i / cols) * cell;
    chordSvg += `
      <rect x="${cx - 80}" y="${cy - 70}" width="160" height="140" rx="16" fill="#ffffff" opacity="0.06"/>
      <text x="${cx}" y="${cy + 12}" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="${accent}" text-anchor="middle">${esc(c)}</text>`;
  });

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${bg}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="${W - 90}" cy="120" r="260" fill="${accent}" opacity="0.08"/>
  <circle cx="60" cy="${H - 160}" r="200" fill="${accent}" opacity="0.06"/>

  <text x="${W / 2}" y="150" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="6">CHORDKUY.ID</text>
  <line x1="${W / 2 - 120}" y1="185" x2="${W / 2 + 120}" y2="185" stroke="${accent}" stroke-width="3"/>

  ${titleLines
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${300 + i * 96}" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="800" fill="#ffffff" text-anchor="middle">${esc(l)}</text>`,
    )
    .join("\n  ")}

  ${artistLines
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${330 + titleLines.length * 96 + i * 56}" font-family="Arial, Helvetica, sans-serif" font-size="44" fill="#b9b9c3" text-anchor="middle">${esc(l)}</text>`,
    )
    .join("\n  ")}

  <rect x="${W / 2 - 210}" y="590" width="420" height="86" rx="43" fill="${accent}"/>
  <text x="${W / 2}" y="646" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="${bg}" text-anchor="middle">Kunci ${esc(key || "C")}${capo ? ` • Capo ${esc(capo)}` : ""}</text>

  ${chordSvg}

  <text x="${W / 2}" y="${gridY + rowsCount * cell + 90}" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="#e8e8ee" text-anchor="middle">Chord gitar + lirik + transpose + auto scroll</text>
  <text x="${W / 2}" y="${gridY + rowsCount * cell + 150}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" fill="${accent}" text-anchor="middle">chordkuy.id</text>
</svg>`;
}

async function main() {
  // limit lagu = views terbanyak
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,slug,key_name,capo,content&order=views_7d.desc,views.desc,id.desc&limit=${LIMIT}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const songs = await res.json();
  console.log(`pin: ${songs.length} lagu (limit ${LIMIT})`);

  const CHORD_RE = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d+)?(?:\/[A-G][#b]?)?)\b/g;

  mkdirSync("dist/pin", { recursive: true });
  const made = [];
  for (const s of songs) {
    if (!s.slug) continue;
    const chords = [...new Set((s.content || "").match(CHORD_RE) || [])].slice(0, 8);
    const capo = (s.capo || "").replace(/^fret\s*/i, "").trim();
    const svg = pinSvg({
      title: s.title,
      artist: s.artist,
      key: s.key_name,
      capo: capo && !/^(no|none|tanpa)/i.test(capo) ? capo : "",
      chords,
      seed: s.id,
    });
    await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(`dist/pin/${s.slug}.png`);
    made.push(s.slug);
  }
  writeFileSync("dist/pin/index.json", JSON.stringify(made), "utf-8");
  console.log(`pin: ${made.length} gambar -> dist/pin/`);
}

main().catch((e) => {
  console.error("generate-pin-images gagal:", e.message);
  process.exit(1);
});
