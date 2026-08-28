-- Jalankan SEKALI di Supabase SQL Editor.

-- 1. Tambah kolom views
ALTER TABLE chords ADD COLUMN IF NOT EXISTS views bigint DEFAULT 0 NOT NULL;
ALTER TABLE chords ADD COLUMN IF NOT EXISTS views_7d bigint DEFAULT 0 NOT NULL;

-- 2. Index untuk trending query (views_7d DESC, views DESC)
CREATE INDEX IF NOT EXISTS idx_chords_views_7d ON chords (views_7d DESC, views DESC);

-- 3. RPC function: increment view per slug (aman dari anon key)
CREATE OR REPLACE FUNCTION increment_view(song_slug text)
RETURNS void AS $$
BEGIN
  UPDATE chords
  SET views = COALESCE(views, 0) + 1,
      views_7d = COALESCE(views_7d, 0) + 1
  WHERE slug = song_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC function: reset views_7d harian (dipanggil dari GitHub Actions)
CREATE OR REPLACE FUNCTION reset_views_7d()
RETURNS void AS $$
BEGIN
  UPDATE chords SET views_7d = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Statistik katalog real-time tanpa mengirim semua baris ke browser
CREATE OR REPLACE FUNCTION catalog_stats()
RETURNS TABLE(song_count bigint, artist_count bigint) AS $$
  SELECT COUNT(*), COUNT(DISTINCT artist) FROM chords;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
