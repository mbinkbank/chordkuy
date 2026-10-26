import type { Artist, Genre, Song } from "../data/types";
import { detectScriptLang, langLabel } from "./lang";

// PostgREST via fetch — tanpa SDK supabase-js (hemat ~40KB bundle)
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

async function rest(path: string, withCount = false): Promise<{ rows: any[]; total: number | null }> {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        ...(withCount ? { Prefer: "count=exact" } : {}),
      },
    });
    if (!res.ok) return { rows: [], total: null };
    const rows = await res.json();
    // gateway kadang balas 200 dengan objek error — jangan biarkan jadi array palsu
    if (!Array.isArray(rows)) return { rows: [], total: null };
    let total: number | null = null;
    if (withCount) {
      const cr = res.headers.get("content-range");
      total = cr && cr.includes("/") ? parseInt(cr.split("/")[1], 10) || rows.length : rows.length;
    }
    return { rows, total };
  } catch {
    return { rows: [], total: null };
  }
}

// Supabase free tier membatasi max_rows=1000 per permintaan — ambil semua via paging
async function restAll(path: string): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  for (;;) {
    const sep = path.includes("?") ? "&" : "?";
    const { rows } = await rest(`${path}${sep}limit=1000&offset=${offset}`);
    if (!rows.length) break;
    all.push(...rows);
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  return all;
}

const slugify = (text: string) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const LIGHT_COLS = "id,title,artist,slug,artist_slug,key_name,capo,tuning,difficulty,rating,views,views_7d";

function extractChords(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|\d)*\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export function mapDbRowToSong(row: any): Song {
  const title = row.title || "Untitled";
  const artist = row.artist || "Unknown Artist";
  const slug = row.slug || `${slugify(artist)}-${slugify(title)}`;
  const artistSlug = row.artist_slug || slugify(artist);
  const capoNum = row.capo && row.capo.includes("fret")
    ? parseInt(row.capo.replace(/\D/g, ""), 10) || 0
    : 0;

  const rawDiff = (row.difficulty || "").toLowerCase();
  let difficulty: "Pemula" | "Menengah" | "Mahir" = "Menengah";
  if (rawDiff === "novice" || rawDiff === "pemula") difficulty = "Pemula";
  else if (rawDiff === "advanced" || rawDiff === "mahir") difficulty = "Mahir";

  const contentChords = extractChords(row.content || "");
  const originalKey = row.key_name || "C";
  const actualViews = typeof row.views_7d === "number" && row.views_7d > 0
    ? row.views_7d
    : (typeof row.views === "number" ? row.views : 0);

  return {
    id: String(row.id),
    title,
    slug,
    artist,
    artistSlug,
    originalKey,
    capo: capoNum,
    lyrics: row.content || "",
    chords: contentChords,
    genre: "Pop",
    thumbnail: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty,
    tuning: row.tuning || "E A D G B E",
    views: actualViews,
    rating: typeof row.rating === "number" ? row.rating : undefined,
    language: row.language || "ID",
    seoNote: row.seo_note || undefined,
  };
}

export async function getAllSongs(): Promise<Song[]> {
  const rows = await restAll(`chords?select=${LIGHT_COLS}&order=id.desc`);
  return rows.map(mapDbRowToSong);
}

export async function getSongBySlug(slug: string): Promise<Song | null> {
  const { rows } = await rest(`chords?select=*&slug=eq.${encodeURIComponent(slug)}`);
  return rows[0] ? mapDbRowToSong(rows[0]) : null;
}

export async function getSongsByArtist(artistSlug: string): Promise<Song[]> {
  const { rows } = await rest(
    `chords?select=*&artist_slug=eq.${encodeURIComponent(artistSlug)}&order=id.desc`,
  );
  return rows.map(mapDbRowToSong);
}

export async function getTrendingSongs(limit = 8): Promise<Song[]> {
  const { rows } = await rest(`chords?select=${LIGHT_COLS}&order=views_7d.desc,views.desc,id.desc&limit=${limit}`);
  if (rows.length > 0) return rows.map(mapDbRowToSong);
  const fb = await rest(`chords?select=id,title,artist,slug,artist_slug,key_name,capo,tuning,difficulty,rating&order=id.desc&limit=${limit}`);
  return fb.rows.map(mapDbRowToSong);
}

export async function getPopularSongs(limit = 8): Promise<Song[]> {
  const { rows } = await rest(`chords?select=${LIGHT_COLS}&order=views.desc,id.desc&limit=${limit}`);
  if (rows.length > 0) return rows.map(mapDbRowToSong);
  const fb = await rest(`chords?select=id,title,artist,slug,artist_slug,key_name,capo,tuning,difficulty,rating&order=id.desc&limit=${limit}`);
  return fb.rows.map(mapDbRowToSong);
}

export async function getRecentSongs(limit = 6): Promise<Song[]> {
  const { rows } = await rest(`chords?select=${LIGHT_COLS}&order=id.desc&limit=${limit}`);
  return rows.map(mapDbRowToSong);
}

export async function recordSongView(slug: string): Promise<void> {
  if (!slug || typeof window === "undefined") return;
  const key = `chordlab:viewed:${slug}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  try {
    await fetch(`${SB_URL}/rest/v1/rpc/increment_view`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ song_slug: slug }),
    });
  } catch {
    // ponytail: silent fail if view increment network request fails
  }
}

export const RECENT_PER_PAGE = 6;

export async function getRecentSongsPage(
  page: number,
  perPage = RECENT_PER_PAGE,
): Promise<{ songs: Song[]; total: number }> {
  const from = (page - 1) * perPage;
  const { rows, total } = await rest(
    `chords?select=${LIGHT_COLS}&order=id.desc&limit=${perPage}&offset=${from}`,
    true,
  );
  return { songs: rows.map(mapDbRowToSong), total: total ?? rows.length };
}

export async function getSongsByGenre(genreSlug: string): Promise<Song[]> {
  return await getAllSongs();
}

export async function getRelatedSongs(song: Song, limit = 5): Promise<Song[]> {
  const { rows } = await rest(`chords?select=${LIGHT_COLS}&id=neq.${Number(song.id)}&order=id.desc&limit=${limit}`);
  return rows.map(mapDbRowToSong);
}

let artistsCache: Artist[] | null = null;

/** Daftar artis dari artists.json (di-generate saat build, 1 fetch kecil). */
export async function getAllArtists(): Promise<Artist[]> {
  if (artistsCache) return artistsCache;
  try {
    const res = await fetch("/artists.json");
    if (!res.ok) throw new Error(String(res.status));
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error("bad shape");
    artistsCache = rows.map(([name, slug, n]: [string, string, number]) => ({
      id: slug,
      name,
      slug,
      songCount: n,
      bio: `Kumpulan chord gitar dari ${name}.`,
      country: "",
      genres: ["Pop"],
      thumbnail: null,
      createdAt: "",
    }));
  } catch {
    artistsCache = [];
  }
  return artistsCache;
}

/**
 * Detail artis dari artist_slug asli DB (bukan ilike atas nama).
 * Jalur ilike lama: scan penuh 38K baris -> statement timeout (~9% artis 404)
 * dan slug hasil rekonstruksi sering beda dari artist_slug DB.
 */
export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  try {
    const { rows } = await rest(
      `chords?select=artist,artist_slug&artist_slug=eq.${encodeURIComponent(slug)}&limit=1`,
    );
    const match = rows[0];
    if (!match) return null;
    const count = await rest(
      `chords?select=id&artist_slug=eq.${encodeURIComponent(slug)}`,
      true,
    );
    return {
      id: slug,
      name: match.artist,
      slug,
      songCount: count.total ?? undefined,
      bio: `Kumpulan chord gitar dari ${match.artist}.`,
      country: langLabel(detectScriptLang(match.artist || "")),
      genres: ["Pop"],
      thumbnail: null,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getPopularArtists(limit = 6): Promise<Artist[]> {
  try {
    const artists = await getAllArtists();
    return artists.slice(0, limit);
  } catch {
    return [];
  }
}

export async function getStats(): Promise<{
  songCount: number;
  artistCount: number;
  genreCount: number;
} | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/rpc/catalog_stats`, {
        method: "POST",
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]) {
          return {
            songCount: Number(rows[0].song_count || 0),
            artistCount: Number(rows[0].artist_count || 0),
            genreCount: 2,
          };
        }
      }
    } catch {
      // retry sekali di iterasi berikutnya
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  // ponytail: gagal → null, caller pakai data build (angka asli dari build-time) — jangan tampilkan angka palsu
  return null;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso || "";
  }
}

export function formatViews(views?: number): string {
  if (!views) return "0";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return String(views);
}

export async function getGenres(): Promise<Genre[]> {
  return [
    { slug: "pop", name: "Pop", description: "Lagu-lagu pop populer" },
    { slug: "dangdut", name: "Dangdut", description: "Lagu dangdut & koplo" },
  ];
}

export async function countSongsInGenre(genreSlug: string): Promise<number> {
  const songs = await getAllSongs();
  return songs.length;
}

export interface SearchResult {
  songs: Song[];
  artists: Artist[];
}

export async function searchCatalogue(query: string, limit = 40): Promise<SearchResult> {
  if (!query.trim()) return { songs: [], artists: [] };

  const q = query.toLowerCase().trim();
  const enc = encodeURIComponent(q);
  // leading wildcard supaya "kanzer" match "Kanzer PMC" & ilike tidak case-sensitive-tergantung
  const { rows } = await rest(
    `chords?select=${LIGHT_COLS}&or=(title.ilike.*${enc}*,artist.ilike.*${enc}*,artist_slug.ilike.*${enc}*)&limit=${limit}`,
  );
  const songs = rows.map(mapDbRowToSong);

  // artis dari hasil lagu (artist_slug asli, tanpa fetch artists.json 600KB)
  const seen = new Set<string>();
  const artists: Artist[] = [];
  for (const row of rows) {
    const aSlug = row.artist_slug;
    if (!aSlug || seen.has(aSlug)) continue;
    seen.add(aSlug);
    artists.push({
      id: aSlug,
      name: row.artist,
      slug: aSlug,
      bio: `Kumpulan chord gitar dari ${row.artist}.`,
      country: "",
      genres: ["Pop"],
      thumbnail: null,
      createdAt: "",
    });
  }

  // tambah artis dari artists.json yang namanya cocok (untuk artis tanpa lagu di hasil)
  try {
    const all = await getAllArtists();
    for (const a of all) {
      if (seen.has(a.slug)) continue;
      if (a.name.toLowerCase().includes(q)) {
        seen.add(a.slug);
        artists.push(a);
      }
    }
  } catch {
    // artists.json gagal — artis dari hasil lagu sudah cukup
  }

  return { songs, artists };
}
