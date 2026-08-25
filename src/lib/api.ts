import { supabase } from "./supabase";
import type { Artist, Genre, Song } from "../data/types";
import { detectScriptLang, langLabel } from "./lang";

const slugify = (text: string) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

function extractChords(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|\d)*\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export function mapDbRowToSong(row: any): Song {
  const title = row.title || "Untitled";
  const artist = row.artist || "Unknown Artist";
  const slug = `${slugify(artist)}-${slugify(title)}`;
  const artistSlug = slugify(artist);
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
  try {
    const { data, error } = await supabase
      .from("chords")
      .select("*")
      .order("id", { ascending: false });
    if (error || !data) return [];
    return data.map(mapDbRowToSong);
  } catch {
    return [];
  }
}

let lightCache: any[] | null = null;
let lightCacheTime = 0;
const LIGHT_TTL = 5 * 60 * 1000;

async function getLightRows(): Promise<any[]> {
  if (lightCache && Date.now() - lightCacheTime < LIGHT_TTL) return lightCache;
  const { data, error } = await supabase.from("chords").select("id,title,artist").order("id", { ascending: false });
  if (error || !data) return lightCache || [];
  lightCache = data as any[];
  lightCacheTime = Date.now();
  return lightCache;
}

export async function getSongBySlug(slug: string): Promise<Song | null> {
  try {
    const light = await getLightRows();
    const match = light.find(
      (r) => `${slugify(r.artist)}-${slugify(r.title)}` === slug || `${slugify(r.artist)}-${slugify(r.title)}` === slug.replace(/-\d+$/, ""),
    );
    if (!match) return null;
    const { data, error } = await supabase.from("chords").select("*").eq("id", match.id).single();
    if (error || !data) return null;
    return mapDbRowToSong(data);
  } catch {
    return null;
  }
}

export async function getSongsByArtist(artistSlug: string): Promise<Song[]> {
  try {
    const light = await getLightRows();
    const ids = light.filter((r) => slugify(r.artist) === artistSlug).map((r) => r.id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("chords").select("*").in("id", ids).order("id", { ascending: false });
    if (error || !data) return [];
    return data.map(mapDbRowToSong);
  } catch {
    return [];
  }
}

export async function getPopularSongs(limit = 8): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from("chords")
      .select("id,title,artist,key_name,capo,tuning,difficulty,rating")
      .order("id", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbRowToSong);
  } catch {
    return [];
  }
}

export async function getRecentSongs(limit = 6): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from("chords")
      .select("id,title,artist,key_name,capo,tuning,difficulty,rating")
      .order("id", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbRowToSong);
  } catch {
    return [];
  }
}

export const RECENT_PER_PAGE = 6;

export async function getRecentSongsPage(
  page: number,
  perPage = RECENT_PER_PAGE,
): Promise<{ songs: Song[]; total: number }> {
  try {
    const from = (page - 1) * perPage;
    const { data, error, count } = await supabase
      .from("chords")
      .select("id,title,artist,key_name,capo,tuning,difficulty,rating", {
        count: "exact",
      })
      .order("id", { ascending: false })
      .range(from, from + perPage - 1);
    if (error || !data) return { songs: [], total: 0 };
    return { songs: data.map(mapDbRowToSong), total: count ?? data.length };
  } catch {
    return { songs: [], total: 0 };
  }
}

export async function getSongsByGenre(genreSlug: string): Promise<Song[]> {
  return await getAllSongs();
}

export async function getRelatedSongs(song: Song, limit = 5): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from("chords")
      .select("id,title,artist,key_name,capo,tuning,difficulty,rating")
      .neq("id", Number(song.id))
      .order("id", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbRowToSong);
  } catch {
    return [];
  }
}

export async function getAllArtists(): Promise<Artist[]> {
  try {
    const { data, error } = await supabase.from("chords").select("artist,title").order("id", { ascending: false });
    if (error || !data) return [];
    const map = new Map<string, { name: string; titles: string[] }>();
    for (const row of data as any[]) {
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
    const { data, error } = await supabase.from("chords").select("artist,title").ilike("artist", slug.replace(/-/g, "%"));
    if (error || !data) return null;
    const rows = (data as any[]).filter((r) => slugify(r.artist) === slug);
    const match = rows[0];
    if (!match) return null;
    return {
      id: slug,
      name: match.artist,
      slug,
      bio: `Kumpulan chord gitar dari ${match.artist}.`,
      country: langLabel(detectScriptLang(...rows.map((r) => r.title || ""))),
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
    const [{ count: songCount }, { data: artistRows }] = await Promise.all([
      supabase.from("chords").select("id", { count: "exact", head: true }),
      supabase.from("chords").select("artist"),
    ]);
    const artistCount = new Set(((artistRows as any[]) || []).map((r) => r.artist)).size;
    return { songCount: songCount ?? 0, artistCount, genreCount: 2 };
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
    const { data } = await supabase
      .from("chords")
      .select("id,title,artist,key_name,capo,tuning,difficulty,rating")
      .or(`title.ilike.%${q}%,artist.ilike.%${q}%`)
      .limit(limit);

    if (!data) return { songs: [], artists: [] };
    const songs = data.map(mapDbRowToSong);
    const artists = await getAllArtists();
    const filteredArtists = artists.filter((a) => a.name.toLowerCase().includes(q));

    return { songs, artists: filteredArtists };
  } catch {
    return { songs: [], artists: [] };
  }
}
