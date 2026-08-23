/**
 * Pre-render (SSG) — snapshot semua halaman statis jadi HTML jadi.
 * Dijalankan setelah vite build: dist/ di-serve lokal, Puppeteer render,
 * hasilnya disimpan sebagai <route>/index.html.
 */
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, extname, normalize } from "node:path";
import puppeteer from "puppeteer";

const DIST = "dist";
const PORT = 4173;
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

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let filePath = join(DIST, normalize(urlPath).replace(/^([.][.][/\\])+/, ""));
      if (!existsSync(filePath) || extname(filePath) === "") {
        filePath = join(DIST, urlPath, "index.html");
        if (!existsSync(filePath)) filePath = join(DIST, "index.html"); // SPA fallback
      }
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end("error");
    }
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

async function getRoutes() {
  const routes = ["/", "/artists", "/about", "/contact", "/privacy", "/terms"];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/chords?select=id,title,artist`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (res.ok) {
    const songs = await res.json();
    for (const s of songs) {
      routes.push(`/chord/${slugify(s.artist)}-${slugify(s.title)}`);
    }
    for (const a of [...new Set(songs.map((s) => slugify(s.artist)))]) {
      if (a) routes.push(`/artist/${a}`);
    }
  } else {
    console.error("Supabase error:", res.status, "- hanya halaman statis yang di-render");
  }
  return routes;
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ tidak ada — jalankan vite build dulu");
    process.exit(1);
  }
  const routes = await getRoutes();
  console.log(`Pre-render ${routes.length} halaman...`);

  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  let ok = 0;
  for (const route of routes) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}${encodeURI(route)}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await page.waitForFunction(
        () => document.querySelector("#main")?.children.length > 0,
        { timeout: 10000 },
      );
      await new Promise((r) => setTimeout(r, 120)); // beri waktu paint terakhir
      const html = await page.content();
      const outPath = route === "/" ? join(DIST, "index.html") : join(DIST, route, "index.html");
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, html, "utf-8");
      ok++;
      console.log(`OK ${route}`);
    } catch (e) {
      console.error(`GAGAL ${route}: ${e.message}`);
    }
  }

  await browser.close();
  server.close();
  console.log(`Selesai: ${ok}/${routes.length} halaman ter-pre-render`);
  if (ok === 0) process.exit(1);
}

main().catch((err) => {
  console.error("Prerender gagal:", err);
  process.exit(1);
});
