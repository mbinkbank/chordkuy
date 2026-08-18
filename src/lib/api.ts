/**
 * Supabase Data Access Layer for `ug_chords`.
 */
import { supabase } from "./supabase";
import type { Artist, Genre, Song } from "../data/types";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Extract chord names from text
function extractChords(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|\d)*\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

// Convert Supabase `ug_chords` row to App `Song` type
export function mapDbRowToSong(row: any): Song {
  const title = row.title || "Untitled";
  const artist = row.artist || "Unknown Artist";
  const slug = `${slugify(artist)}-${slugify(title)}-${row.id}`;
  const artistSlug = slugify(artist);
  const capoNum = row.capo && row.capo.includes("fret") 
    ? parseInt(row.capo.replace(/\D/g, ""), 10) || 0 
    : 0;

  const rawDiff = (row.difficulty || "").toLowerCase();
  let difficulty: "Pemula" | "Menengah" | "Mahir" = "Menengah";
  if (rawDiff === "novice" || rawDiff === "pemula") difficulty = "Pemula";
  else if (rawDiff === "advanced" || rawDiff === "mahir") difficulty = "Mahir";

  // Hitung Kunci Jari = Nada Konser (key_name) - Capo
  let originalKey = row.key_name || "C";
  if (row.key_name && capoNum > 0) {
    originalKey = transposeChord(row.key_name, -capoNum, keyPrefersFlat(row.key_name));
  }

  return {
    id: String(row.id),
    title: title,
    slug: slug,
    artist: artist,
    artistSlug: artistSlug,
    originalKey: originalKey,
    capo: capoNum,
    lyrics: row.content || "",
    chords: contentChords,
    genre: "Pop",
    thumbnail: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: difficulty,
    tuning: row.tuning || "E A D G B E",
    views: 100 + (row.id * 7) % 500,
  };
}

export async function getAllSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from("ug_chords")
    .select("*")
    .order("id", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbRowToSong);
}

export async function getSongBySlug(slug: string): Promise<Song | null> {
  const parts = slug.split("-");
  const possibleId = parts[parts.length - 1];

  if (/^\d+$/.test(possibleId)) {
    const { data } = await supabase
      .from("ug_chords")
      .select("*")
      .eq("id", parseInt(possibleId, 10))
      .maybeSingle();
    if (data) return mapDbRowToSong(data);
  }

  const all = await getAllSongs();
  return all.find((s) => s.slug === slug) ?? null;
}

export async function getSongsByArtist(artistSlug: string): Promise<Song[]> {
  const all = await getAllSongs();
  return all.filter((s) => s.artistSlug === artistSlug);
}

export async function getPopularSongs(limit = 8): Promise<Song[]> {
  const all = await getAllSongs();
  return all.slice(0, limit);
}

export async function getRecentSongs(limit = 6): Promise<Song[]> {
  const { data, error } = await supabase
    .from("ug_chords")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapDbRowToSong);
}

export async function getSongsByGenre(genreSlug: string): Promise<Song[]> {
  return await getAllSongs();
}

export async function getRelatedSongs(song: Song, limit = 5): Promise<Song[]> {
  const all = await getAllSongs();
  return all.filter((s) => s.id !== song.id).slice(0, limit);
}

export async function getAllArtists(): Promise<Artist[]> {
  const songs = await getAllSongs();
  const map = new Map<string, Artist>();

  for (const song of songs) {
    if (!map.has(song.artistSlug)) {
      map.set(song.artistSlug, {
        id: song.artistSlug,
        name: song.artist,
        slug: song.artistSlug,
        bio: `Kumpulan chord gitar dari ${song.artist}.`,
        country: "International",
        genres: ["Pop"],
        thumbnail: null,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const artists = await getAllArtists();
  return artists.find((a) => a.slug === slug) ?? null;
}

export async function getPopularArtists(limit = 6): Promise<Artist[]> {
  const artists = await getAllArtists();
  return artists.slice(0, limit);
}

export async function getGenres(): Promise<Genre[]> {
  return [
    { slug: "pop", name: "Pop", description: "Lagu-lagu pop populer" },
    { slug: "rock", name: "Rock", description: "Lagu rock & alternative" },
  ];
}

export async function countSongsInGenre(genreSlug: string): Promise<number> {
  const songs = await getAllSongs();
  return songs.length;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatViews(views?: number): string {
  if (!views) return "0";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return String(views);
}

export async function getStats() {
  const songs = await getAllSongs();
  const artists = await getAllArtists();
  return {
    songCount: songs.length,
    artistCount: artists.length,
    genreCount: 2,
  };
}

export interface SearchResult {
  songs: Song[];
  artists: Artist[];
}

export async function searchCatalogue(query: string, limit = 40): Promise<SearchResult> {
  if (!query.trim()) return { songs: [], artists: [] };
  
  const q = query.toLowerCase().trim();
  const { data } = await supabase
    .from("ug_chords")
    .select("*")
    .or(`title.ilike.%${q}%,artist.ilike.%${q}%`)
    .limit(limit);

  if (!data) return { songs: [], artists: [] };
  const songs = data.map(mapDbRowToSong);
  const artists = await getAllArtists();
  const filteredArtists = artists.filter((a) => a.name.toLowerCase().includes(q));

  return { songs, artists: filteredArtists };
}
