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

  // Hitung asli via RPC; fallback = count=exact dari header content-range
  // (rows.length terjebak max_rows 1000 â€” jangan pernah dipakai sbg total)
  let songCount = 0;
  {
    const cr = await fetch(
      `${SUPABASE_URL}/rest/v1/chords?select=id&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "count=exact", Range: "0-0" } },
    );
    const range = cr.headers.get("content-range") || "";
    songCount = range.includes("/") ? parseInt(range.split("/")[1], 10) || 0 : 0;
  }
  let artistCount = 0;
  for (let attempt = 0; attempt < 3 && !artistCount; attempt++) {
    try {
      const sr = await fetch(`${SUPABASE_URL}/rest/v1/rpc/catalog_stats`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      });
      if (sr.ok) {
        const s = (await sr.json())[0];
        if (s) {
          songCount = Number(s.song_count) || songCount;
          artistCount = Number(s.artist_count) || 0;
        }
      }
    } catch {
      // retry
    }
    if (!artistCount && attempt < 2) await new Promise((r) => setTimeout(r, 2000));
  }

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
  if (!artistCount) {
    // RPC timeout -> hitung distinct artist_slug via paging (39 request, aman di build)
    try {
      const set = new Set();
      for (let off = 0; ; off += 1000) {
        const pr = await fetch(
          `${SUPABASE_URL}/rest/v1/chords?select=artist_slug&order=id.asc&limit=1000&offset=${off}`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
        );
        if (!pr.ok) break;
        const batch = await pr.json();
        if (!Array.isArray(batch) || !batch.length) break;
        for (const b of batch) if (b.artist_slug) set.add(b.artist_slug);
        if (batch.length < 1000) break;
      }
      artistCount = set.size;
    } catch {
      artistCount = 0;
    }
  }

  const out = {
    popularRows: rows.slice(0, 8),
    artistNames: artists.slice(0, 6),
    recentRows: rows.slice(0, PER_PAGE),
    songCount,
    artistCount,
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

