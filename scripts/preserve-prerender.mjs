/**
 * Simpan hasil pre-render lama SEBELUM vite build menghapus dist/.
 * Dipulihkan kembali oleh prerender.mjs (inkremental).
 */
import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const CACHE = ".prerender-cache";

mkdirSync(CACHE, { recursive: true });

for (const dir of ["chord", "artist"]) {
  const src = join(DIST, dir);
  const dest = join(CACHE, dir);
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`Cache: ${dir}/`);
  }
}

// simpan index.html lama untuk memetakan nama asset lama → baru
if (existsSync(join(DIST, "index.html"))) {
  writeFileSync(join(CACHE, "index.html"), readFileSync(join(DIST, "index.html")));
}
