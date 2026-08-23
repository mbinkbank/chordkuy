/**
 * Domain types.
 *
 * These mirror the planned Supabase tables 1:1 (snake_case columns are mapped
 * in `src/lib/api.ts`), so swapping the mock source for a real database only
 * requires changing the data-access layer — never the UI.
 *
 *   table songs   (id, title, slug, artist, artist_slug, original_key, capo,
 *                  lyrics, chords, genre, thumbnail, created_at, updated_at)
 *   table artists (id, name, slug, bio, country, genres, thumbnail, created_at)
 */

export interface Song {
  id: string;
  title: string;
  slug: string;
  artist: string;
  artistSlug: string;
  /** Key the sheet is written in, e.g. "G", "Am", "F#m". */
  originalKey: string;
  /** 0 = no capo. */
  capo: number;
  /**
   * Sheet body. Chords are inline in square brackets right before the syllable
   * they belong to: `[Am]Malam ini [F]kita bicara`.
   * Lines starting with `#` are section labels: `# Verse 1`.
   */
  lyrics: string;
  /** Distinct chords used, in order of appearance (denormalised for fast UI). */
  chords: string[];
  genre: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  /* Optional enrichment — safe to leave undefined. */
  year?: number;
  tempo?: number;
  difficulty?: "Pemula" | "Menengah" | "Mahir";
  strumming?: string;
  tuning?: string;
  duration?: string;
  views?: number;
  rating?: number;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  bio: string;
  country: string;
  genres: string[];
  thumbnail: string | null;
  createdAt: string;
}

export interface Genre {
  slug: string;
  name: string;
  description: string;
}
