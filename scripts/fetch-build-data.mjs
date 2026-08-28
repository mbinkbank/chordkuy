/**
 * Ambil data ringan untuk homepage SEKALI saat build,
 * ditulis ke src/data/build-data.json supaya halaman utama
 * tidak perlu fetch ke Supabase saat dikunjungi.
 */
import { writeFileSync } from "node:fs";

const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

const COLS = "id,title,artist,slug,artist_slug,key_name,capo,tuning,difficulty,rating,views,views_7d";
const PER_PAGE = 10;

async function main() {
  console.log("Fetching build data...");
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/chords?select=${COLS}&order=views_7d.desc,views.desc,id.desc&limit=2000`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) {
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,slug,artist_slug,key_name,capo,tuning,difficulty,rating&order=id.desc&limit=2000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
  }
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = await res.json();

  const seen = new Set();
  const artists = [];
  for (const r of rows) {
    const name = r.artist || "";
    if (!seen.has(name)) {
      seen.add(name);
      artists.push(name);
    }
  }
  artists.sort((a, b) => a.localeCompare(b));

  const out = {
    popularRows: rows.slice(0, 8),
    artistNames: artists.slice(0, 6),
    recentRows: rows.slice(0, PER_PAGE),
    songCount: rows.length,
    artistCount: artists.length,
  };
  writeFileSync("src/data/build-data.json", JSON.stringify(out));
  console.log(
    `build-data.json: ${out.songCount} lagu, ${out.artistCount} artis (popular 8, recent 50)`,
  );
}

main().catch((e) => {
  console.error("fetch-build-data gagal:", e.message);
  process.exit(1);
});
