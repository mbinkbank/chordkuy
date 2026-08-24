/**
 * Pre-render inkremental — hanya render halaman baru/berubah.
 * Cache disimpan di .prerender-cache/ oleh preserve-prerender.mjs.
 */
import puppeteer from "puppeteer";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";

const DIST = "dist";
const CACHE = ".prerender-cache";
const MANIFEST = join(CACHE, "manifest.json");
const PORT = 4173;
const CONCURRENCY = 4;
const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Ambil semua lagu dari Supabase (kolom ringan saja) */
async function getAllSongs() {
  const songs = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,updated_at&order=id.asc&limit=1000&offset=${from}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (!rows.length) break;
    songs.push(...rows);
  }
  return songs;
}

/** Pulihkan file pre-render lama dari cache ke dist */
async function restoreCache() {
  for (const dir of ["chord", "artist"]) {
    const src = join(CACHE, dir);
    const dest = join(DIST, dir);
    if (existsSync(src)) {
      await cpSync(src, dest, { recursive: true });
    }
  }
}

/** Ganti referensi asset lama → baru di semua file HTML yang dipulihkan */
async function rewriteAssetRefs() {
  const oldIndex = join(CACHE, "index.html");
  const newIndex = join(DIST, "index.html");
  if (!existsSync(oldIndex) || !existsSync(newIndex)) return;

  const oldHtml = await readFile(oldIndex, "utf-8");
  const newHtml = await readFile(newIndex, "utf-8");

  const assetRe = /\/assets\/[a-zA-Z0-9_-]+\.(js|css)/g;
  const oldAssets = [...new Set(oldHtml.match(assetRe) || [])];
  const newAssets = [...new Set(newHtml.match(assetRe) || [])];

  // Map: old asset path → new asset path (by extension order)
  const oldByExt = {};
  const newByExt = {};
  for (const a of oldAssets) {
    const ext = a.split(".").pop();
    if (!oldByExt[ext]) oldByExt[ext] = a;
  }
  for (const a of newAssets) {
    const ext = a.split(".").pop();
    if (!newByExt[ext]) newByExt[ext] = a;
  }

  const replacements = [];
  for (const ext of Object.keys(oldByExt)) {
    if (newByExt[ext] && oldByExt[ext] !== newByExt[ext]) {
      replacements.push([oldByExt[ext], newByExt[ext]]);
    }
  }
  if (replacements.length === 0) return;

  // Ganti di semua file HTML di dist/chord dan dist/artist
  const { readdir, readFile: rf, writeFile: wf } = await import("node:fs/promises");
  async function walk(dir) {
    if (!existsSync(dir)) return;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name.endsWith(".html")) {
        let html = await rf(full, "utf-8");
        for (const [old, rep] of replacements) {
          html = html.replaceAll(old, rep);
        }
        await wf(full, html, "utf-8");
      }
    }
  }
  await walk(join(DIST, "chord"));
  await walk(join(DIST, "artist"));
  console.log(`Asset refs: ${replacements.length} pasangan di-rewrite`);
}

/** Mulai server statis untuk Puppeteer */
async function startServer() {
  const { createServer } = await import("node:http");
  const { readFile: rf } = await import("node:fs/promises");
  const { extname } = await import("node:path");

  const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json",
  };

  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let filePath = join(DIST, urlPath);
      if (!existsSync(filePath) || extname(filePath) === "") {
        filePath = join(DIST, urlPath, "index.html");
        if (!existsSync(filePath)) filePath = join(DIST, "index.html");
      }
      const body = await rf(filePath);
      res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end("error");
    }
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ tidak ada — jalankan vite build dulu");
    process.exit(1);
  }

  // 1. Pulihkan cache
  await restoreCache();
  await rewriteAssetRefs();

  // 2. Ambil data lagu
  const songs = await getAllSongs();
  console.log(`Lagu di DB: ${songs.length}`);

  // 3. Load manifest
  let manifest = { chords: {}, lastBuild: null };
  if (existsSync(MANIFEST)) {
    try { manifest = JSON.parse(await readFile(MANIFEST, "utf-8")); } catch {}
  }

  // 4. Tentukan rute yang perlu di-render
  const staticRoutes = ["/", "/artists"];
  const artistSlugs = [...new Set(songs.map((s) => slugify(s.artist)).filter(Boolean))];
  const artistRoutes = artistSlugs.map((s) => `/artist/${s}`);
  const chordRoutes = songs.map((s) => ({
    route: `/chord/${slugify(s.artist)}-${slugify(s.title)}`,
    id: s.id,
    updated: s.updated_at,
  }));

  const lastBuild = manifest.lastBuild ? new Date(manifest.lastBuild) : null;
  const todo = new Set();

  // Selalu render: static + artist
  for (const r of [...staticRoutes, ...artistRoutes]) todo.add(r);

  // Chord: render kalau baru atau berubah
  for (const c of chordRoutes) {
    const prev = manifest.chords?.[c.id];
    if (!prev || !lastBuild || new Date(c.updated) > lastBuild) {
      todo.add(c.route);
    }
  }

  // Hapus file rute yang sudah tidak ada
  const currentRoutes = new Set(chordRoutes.map((c) => c.route));
  for (const [id, route] of Object.entries(manifest.chords || {})) {
    if (!currentRoutes.has(route)) {
      const file = join(DIST, route, "index.html");
      if (existsSync(file)) await rm(file, { force: true });
      delete manifest.chords[id];
    }
  }

  const routes = [...todo];
  console.log(`Pre-render ${routes.length}/${songs.length + artistRoutes.length + staticRoutes.length} halaman (${songs.length - chordRoutes.filter((c) => todo.has(c.route)).length + artistRoutes.length + staticRoutes.length} di-skip)...`);

  // 5. Render
  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let ok = 0;
  let done = 0;
  let index = 0;

  async function worker(id) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    while (index < routes.length) {
      const route = routes[index++];
      try {
        await page.goto(`http://127.0.0.1:${PORT}${encodeURI(route)}`, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        await page.waitForFunction(
          () => document.querySelector("#main")?.children.length > 0,
          { timeout: 10000 },
        );
        await new Promise((r) => setTimeout(r, 120));
        const html = await page.content();
        const outPath = route === "/" ? join(DIST, "index.html") : join(DIST, route, "index.html");
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, html, "utf-8");
        ok++;
        done++;
        console.log(`OK ${route} (${done}/${routes.length})`);
      } catch (e) {
        done++;
        console.error(`GAGAL ${route}: ${e.message}`);
      }
    }
    await page.close();
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
  await browser.close();
  server.close();

  // 6. Simpan manifest
  for (const c of chordRoutes) {
    if (todo.has(c.route)) {
      manifest.chords[c.id] = c.route;
    }
  }
  manifest.lastBuild = new Date().toISOString();
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));

  // 7. Update cache untuk build berikutnya
  const { readdir } = await import("node:fs/promises");
  for (const dir of ["chord", "artist"]) {
    const src = join(DIST, dir);
    const dest = join(CACHE, dir);
    if (existsSync(src)) {
      await cpSync(src, dest, { recursive: true });
    }
  }
  await writeFile(join(CACHE, "index.html"), await readFile(join(DIST, "index.html"), "utf-8"));

  console.log(`Selesai: ${ok}/${routes.length} halaman ter-pre-render`);
  if (ok === 0) process.exit(1);
}

main().catch((err) => {
  console.error("Prerender gagal:", err);
  process.exit(1);
});
