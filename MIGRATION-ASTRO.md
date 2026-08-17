# Porting ChordLab to Astro + Supabase (Cloudflare Pages)

The codebase in `src/` is written so this move is mechanical: **no chord logic,
no CSS, and no data types change.** Only the page shell and the data-access
bodies do.

## 0. Why the template ships as Vite here

This workspace pins `package.json` to a Vite entry point, so the template runs
as a single-file Vite app. Everything that matters for Astro is already
isolated:

| Concern            | File(s)                                            | Astro action                          |
| ------------------ | -------------------------------------------------- | ------------------------------------- |
| Design system      | `src/index.css`                                    | copy verbatim → `src/styles/global.css` |
| Domain types       | `src/data/types.ts`                                | copy verbatim                          |
| Mock catalogue     | `src/data/songs.ts`, `src/data/artists.ts`         | keep for local dev / seeding           |
| Data access        | `src/lib/api.ts`                                   | swap bodies for Supabase queries       |
| Chord engine       | `src/lib/chords.ts`, `src/lib/chordShapes.ts`      | copy verbatim (pure TS, no DOM)        |
| SEO + JSON-LD      | `src/lib/seo.ts`                                   | render in `<head>` of `BaseLayout.astro` |
| Routing            | `src/lib/router.tsx`                               | delete — Astro file routing replaces it |
| Static pages       | `src/pages/*.tsx`                                  | markup → `.astro`, zero JS shipped     |
| Interactive parts  | `ChordViewer`, `Transpose/FontSize/AutoScroll`     | one vanilla-TS island (`client:idle`)  |

## 1. Scaffold

```bash
npm create astro@latest chordlab -- --template minimal --typescript strict
cd chordlab
npx astro add cloudflare sitemap
```

`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://chordlab.pages.dev",
  output: "static",              // SSG: every chord page is real HTML
  integrations: [sitemap()],     // replaces public/sitemap.xml
  build: { inlineStylesheets: "auto" },
});
```

## 2. File routes

```
src/pages/
  index.astro              → /
  search.astro             → /search
  artists.astro            → /artists
  artist/[slug].astro      → /artist/:slug   (getStaticPaths)
  chord/[slug].astro       → /chord/:slug    (getStaticPaths)
  about.astro  contact.astro  privacy.astro  terms.astro
  404.astro
```

```astro
---
// src/pages/chord/[slug].astro
import BaseLayout from "../../layouts/BaseLayout.astro";
import ChordSheet from "../../components/ChordSheet.astro";
import { getAllSongs, getSongBySlug, getRelatedSongs } from "../../lib/api";
import { parseSheet } from "../../lib/chords";

export async function getStaticPaths() {
  const songs = await getAllSongs();
  return songs.map((song) => ({ params: { slug: song.slug }, props: { song } }));
}

const { song } = Astro.props;
const lines = parseSheet(song.lyrics);          // rendered server-side
---
<BaseLayout
  title={`Chord ${song.title} - ${song.artist} | ChordLab`}
  description={`Chord gitar ${song.title} — ${song.artist}. Kunci dasar ${song.originalKey}.`}
  canonical={`/chord/${song.slug}`}
  jsonLd={[webPageSchema(...), breadcrumbSchema(...), musicRecordingSchema(song)]}
>
  <ChordSheet song={song} lines={lines} />   <!-- static HTML, crawlable -->
  <script src="../../scripts/chord-controls.ts"></script>
</BaseLayout>
```

The chord/lyric markup is emitted at build time; the island script only mutates
`textContent` of `.ch` nodes when transposing, so the crawlable content and the
LCP element never depend on JavaScript.

## 3. Supabase

```sql
create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text default '',
  country text default '',
  genres text[] default '{}',
  thumbnail text,
  created_at timestamptz default now()
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  artist text not null,
  artist_slug text not null references artists(slug) on update cascade,
  original_key text not null,
  capo int not null default 0,
  lyrics text not null,
  chords text[] not null default '{}',
  genre text not null,
  thumbnail text,
  year int, tempo int, difficulty text, strumming text,
  tuning text, duration text, views bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index songs_artist_slug_idx on songs (artist_slug);
create index songs_updated_idx     on songs (updated_at desc);
create index songs_search_idx      on songs using gin (to_tsvector('simple', title || ' ' || artist));

alter table songs   enable row level security;
alter table artists enable row level security;
create policy "public read" on songs   for select using (true);
create policy "public read" on artists for select using (true);
```

```ts
// src/lib/supabase.ts — anon key only, read-only RLS. Never ship a service key.
import { createClient } from "@supabase/supabase-js";
export const db = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);
```

```ts
// src/lib/api.ts — same signatures, async now
const mapSong = (r: any): Song => ({
  id: r.id, title: r.title, slug: r.slug, artist: r.artist,
  artistSlug: r.artist_slug, originalKey: r.original_key, capo: r.capo,
  lyrics: r.lyrics, chords: r.chords, genre: r.genre, thumbnail: r.thumbnail,
  createdAt: r.created_at, updatedAt: r.updated_at,
  year: r.year, tempo: r.tempo, difficulty: r.difficulty,
  strumming: r.strumming, tuning: r.tuning, duration: r.duration, views: r.views,
});

export async function getSongBySlug(slug: string) {
  const { data } = await db.from("songs").select("*").eq("slug", slug).single();
  return data ? mapSong(data) : null;
}
```

For thousands of pages, page the build query (`range(0, 999)` in a loop) and
enable Astro's `experimental.contentIntellisense` / incremental deploys.

## 4. Search at scale

Client-side filtering works up to ~1k songs. Beyond that, move `/search` to a
Cloudflare Pages Function that calls Postgres full-text search:

```ts
// functions/api/search.ts
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 64) ?? "";
  // …call Supabase REST with env.SUPABASE_ANON_KEY (a Pages secret, not in the bundle)
};
```

## 5. Deploy to Cloudflare Pages

```
Build command:      npm run build
Build output:       dist
Environment:        PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY
```

`public/_headers` and `public/_redirects` in this template already carry the
CSP, caching, and routing rules — keep them as-is.
