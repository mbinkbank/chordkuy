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

const LIGHT_COLS = "id,title,artist,key_name,capo,tuning,difficulty,rating";

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
    views: 100 + (row.id * 7) % 500,
    rating: typeof row.rating === "number" ? row.rating : undefined,
    language: row.language || "ID",
  };
}

export async function getAllSongs(): Promise<Song[]> {
  const rows = await restAll(`chords?select=*&order=id.desc`);
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

export async function getPopularSongs(limit = 8): Promise<Song[]> {
  const { rows } = await rest(`chords?select=${LIGHT_COLS}&order=id.desc&limit=${limit}`);
  return rows.map(mapDbRowToSong);
}

export async function getRecentSongs(limit = 6): Promise<Song[]> {
  return getPopularSongs(limit);
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

export async function getAllArtists(): Promise<Artist[]> {
  try {
    const rows = await restAll(`chords?select=artist,title&order=id.desc`);
    const map = new Map<string, { name: string; titles: string[] }>();
    for (const row of rows) {
      const name = row.artist || "";
      if (!name) continue;
      const artistSlug = slugify(name);
      const entry = map.get(artistSlug) || { name, titles: [] };
      if (row.title) entry.titles.push(row.title);
      map.set(artistSlug, entry);
    }
    return Array.from(map.entries())
      .map(([artistSlug, e]) => ({
        id: artistSlug,
        name: e.name,
        slug: artistSlug,
        bio: `Kumpulan chord gitar dari ${e.name}.`,
        country: langLabel(detectScriptLang(...e.titles)),
        genres: ["Pop"],
        thumbnail: null,
        createdAt: new Date().toISOString(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  try {
    const pattern = encodeURIComponent(slug.replace(/-/g, "%"));
    const { rows } = await rest(`chords?select=artist,title&artist=ilike.${pattern}`);
    const filtered = rows.filter((r) => slugify(r.artist) === slug);
    const match = filtered[0];
    if (!match) return null;
    return {
      id: slug,
      name: match.artist,
      slug,
      bio: `Kumpulan chord gitar dari ${match.artist}.`,
      country: langLabel(detectScriptLang(...filtered.map((r) => r.title || ""))),
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

export async function getStats() {
  try {
    const [songRes, artistRows] = await Promise.all([
      rest(`chords?select=id&limit=1`, true),
      restAll(`chords?select=artist`),
    ]);
    const artistCount = new Set(artistRows.map((r) => r.artist)).size;
    return { songCount: songRes.total ?? 0, artistCount, genreCount: 2 };
  } catch {
    return { songCount: 0, artistCount: 0, genreCount: 2 };
  }
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

  try {
    const q = query.toLowerCase().trim();
    const enc = encodeURIComponent(q);
    const { rows } = await rest(
      `chords?select=${LIGHT_COLS}&or=(title.ilike.*${enc}*,artist.ilike.*${enc}*)&limit=${limit}`,
    );

    if (!rows.length) return { songs: [], artists: [] };
    const songs = rows.map(mapDbRowToSong);
    const artists = await getAllArtists();
    const filteredArtists = artists.filter((a) => a.name.toLowerCase().includes(q));

    return { songs, artists: filteredArtists };
  } catch {
    return { songs: [], artists: [] };
  }
}
