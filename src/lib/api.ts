/**
 * Data access layer.
 *
 * Today it reads local mock data synchronously so pages render instantly.
 * Migrating to Supabase means replacing the bodies below with queries —
 * the returned shapes never change, so no component has to be touched.
 *
 *   // src/lib/supabase.ts
 *   import { createClient } from "@supabase/supabase-js";
 *   export const db = createClient(import.meta.env.PUBLIC_SUPABASE_URL,
 *                                  import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
 *
 *   export async function getSongBySlug(slug: string) {
 *     const { data } = await db.from("songs").select("*").eq("slug", slug).single();
 *     return data ? mapSong(data) : null;
 *   }
 */

import { artists, genres } from "../data/artists";
import { songs } from "../data/songs";
import type { Artist, Genre, Song } from "../data/types";

const byViews = (a: Song, b: Song) => (b.views ?? 0) - (a.views ?? 0);
const byUpdated = (a: Song, b: Song) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt);

export const getAllSongs = (): Song[] => [...songs];

export const getSongBySlug = (slug: string): Song | null =>
  songs.find((s) => s.slug === slug) ?? null;

export const getSongsByArtist = (artistSlug: string): Song[] =>
  songs.filter((s) => s.artistSlug === artistSlug).sort(byViews);

export const getPopularSongs = (limit = 8): Song[] => [...songs].sort(byViews).slice(0, limit);

export const getRecentSongs = (limit = 6): Song[] => [...songs].sort(byUpdated).slice(0, limit);

export const getSongsByGenre = (genreSlug: string): Song[] =>
  songs.filter((s) => s.genre.toLowerCase() === genreSlug.toLowerCase()).sort(byViews);

export function getRelatedSongs(song: Song, limit = 5): Song[] {
  const sameArtist = songs.filter((s) => s.artistSlug === song.artistSlug && s.id !== song.id);
  const sameGenre = songs.filter(
    (s) => s.genre === song.genre && s.artistSlug !== song.artistSlug && s.id !== song.id,
  );
  return [...sameArtist, ...sameGenre.sort(byViews)].slice(0, limit);
}

export const getAllArtists = (): Artist[] =>
  [...artists].sort((a, b) => a.name.localeCompare(b.name));

export const getArtistBySlug = (slug: string): Artist | null =>
  artists.find((a) => a.slug === slug) ?? null;

export const getPopularArtists = (limit = 6): Artist[] =>
  [...artists]
    .map((artist) => ({
      artist,
      score: getSongsByArtist(artist.slug).reduce((sum, s) => sum + (s.views ?? 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.artist);

export const getGenres = (): Genre[] => [...genres];

export const countSongsInGenre = (genreSlug: string): number => getSongsByGenre(genreSlug).length;

export interface SearchResult {
  songs: Song[];
  artists: Artist[];
}

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function searchCatalogue(query: string, limit = 40): SearchResult {
  const q = normalise(query);
  if (!q) return { songs: [], artists: [] };

  const scored = songs
    .map((song) => {
      const title = normalise(song.title);
      const artist = normalise(song.artist);
      const genre = normalise(song.genre);
      let score = 0;
      if (title === q) score += 100;
      if (title.startsWith(q)) score += 60;
      if (title.includes(q)) score += 40;
      if (artist.startsWith(q)) score += 30;
      if (artist.includes(q)) score += 20;
      if (genre.includes(q)) score += 8;
      if (song.chords.some((c) => normalise(c) === q)) score += 6;
      return { song, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.song.views ?? 0) - (a.song.views ?? 0))
    .slice(0, limit)
    .map((entry) => entry.song);

  const matchedArtists = artists
    .filter((a) => normalise(a.name).includes(q) || a.genres.some((g) => normalise(g).includes(q)))
    .slice(0, 8);

  return { songs: scored, artists: matchedArtists };
}

export interface CatalogueStats {
  songs: number;
  artists: number;
  genres: number;
}

export const getStats = (): CatalogueStats => ({
  songs: songs.length,
  artists: artists.length,
  genres: genres.length,
});

export const formatViews = (views?: number): string => {
  if (!views) return "—";
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  if (views >= 1_000) return (views / 1_000).toFixed(1).replace(".0", "") + "rb";
  return String(views);
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
